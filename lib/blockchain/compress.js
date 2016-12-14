/*!
 * compress.js - coin compressor for bcoin
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var assert = require('assert');
var ec = require('../crypto/ec');

/*
 * Compression
 */

/**
 * Compress a script, write directly to the buffer.
 * @param {Script} script
 * @param {BufferWriter} bw
 */

function compressScript(script, bw) {
  var data;

  // Attempt to compress the output scripts.
  // We can _only_ ever compress them if
  // they are serialized as minimaldata, as
  // we need to recreate them when we read
  // them.

  // P2PKH -> 1 | key-hash
  // Saves 5 bytes.
  if (script.isPubkeyhash(true)) {
    data = script.code[2].data;
    bw.writeU8(1);
    bw.writeBytes(data);
    return bw;
  }

  // P2SH -> 2 | script-hash
  // Saves 3 bytes.
  if (script.isScripthash()) {
    data = script.code[1].data;
    bw.writeU8(2);
    bw.writeBytes(data);
    return bw;
  }

  // P2PK -> 3 | compressed-key
  // Only works if the key is valid.
  // Saves up to 34 bytes.
  if (script.isPubkey(true)) {
    data = script.code[0].data;
    if (ec.publicKeyVerify(data)) {
      data = compressKey(data);
      bw.writeU8(3);
      bw.writeBytes(data);
      return bw;
    }
  }

  // Raw -> 0 | varlen | script
  bw.writeU8(0);
  bw.writeVarBytes(script.toRaw());

  return bw;
}

/**
 * Decompress a script from buffer reader.
 * @param {Script} script
 * @param {BufferReader} br
 */

function decompressScript(script, br) {
  var data;

  // Decompress the script.
  switch (br.readU8()) {
    case 0:
      data = br.readVarBytes();
      script.fromRaw(data);
      break;
    case 1:
      data = br.readBytes(20, true);
      script.fromPubkeyhash(data);
      break;
    case 2:
      data = br.readBytes(20, true);
      script.fromScripthash(data);
      break;
    case 3:
      data = br.readBytes(33, true);
      // Decompress the key. If this fails,
      // we have database corruption!
      data = decompressKey(data);
      script.fromPubkey(data);
      break;
    default:
      throw new Error('Bad prefix.');
  }

  return script;
}

/**
 * Compress value using an exponent. Takes advantage of
 * the fact that many bitcoin values are divisible by 10.
 * @see https://github.com/btcsuite/btcd/blob/master/blockblockchain/compress.go
 * @param {Amount} value
 * @returns {Number}
 */

function compressValue(value) {
  var exp, last;

  if (value === 0)
    return 0;

  exp = 0;
  while (value % 10 === 0 && exp < 9) {
    value /= 10;
    exp++;
  }

  if (exp < 9) {
    last = value % 10;
    value = (value - last) / 10;
    return 1 + 10 * (9 * value + last - 1) + exp;
  }

  return 10 + 10 * (value - 1);
}

/**
 * Decompress value.
 * @param {Number} value - Compressed value.
 * @returns {Amount} value
 */

function decompressValue(value) {
  var exp, n, last;

  if (value === 0)
    return 0;

  value--;

  exp = value % 10;
  value = (value - exp) / 10;

  if (exp < 9) {
    last = value % 9;
    value = (value - last) / 9;
    n = value * 10 + last + 1;
  } else {
    n = value + 1;
  }

  while (exp > 0) {
    n *= 10;
    exp--;
  }

  return n;
}

/**
 * Compress a public key to coins compression format.
 * @param {Buffer} key
 * @returns {Buffer}
 */

function compressKey(key) {
  var out;

  switch (key[0]) {
    case 0x02:
    case 0x03:
      // Key is already compressed.
      out = key;
      break;
    case 0x04:
    case 0x06:
    case 0x07:
      // Compress the key normally.
      out = ec.publicKeyConvert(key, true);
      // Store the original format (which
      // may be a hybrid byte) in the hi
      // 3 bits so we can restore it later.
      // The hi bits being set also lets us
      // know that this key was originally
      // decompressed.
      out[0] |= key[0] << 2;
      break;
    default:
      throw new Error('Bad point format.');
  }

  assert(out.length === 33);

  return out;
}

/**
 * Decompress a public key from the coins compression format.
 * @param {Buffer} key
 * @returns {Buffer}
 */

function decompressKey(key) {
  var format = key[0] >>> 2;
  var out;

  assert(key.length === 33);

  // Hi bits are not set. This key
  // is not meant to be decompressed.
  if (format === 0)
    return key;

  // Decompress the key, and off the
  // low bits so publicKeyConvert
  // actually understands it.
  key[0] &= 0x03;
  out = ec.publicKeyConvert(key, false);

  // Reset the hi bits so as not to
  // mutate the original buffer.
  key[0] |= format << 2;

  // Set the original format, which
  // may have been a hybrid prefix byte.
  out[0] = format;

  return out;
}

/*
 * Expose
 */

exports.compress = {
  script: compressScript,
  value: compressValue,
  key: compressKey
};

exports.decompress = {
  script: decompressScript,
  value: decompressValue,
  key: decompressKey
};
