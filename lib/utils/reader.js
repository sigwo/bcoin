/*!
 * reader.js - buffer reader for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var encoding = require('./encoding');
var crypto = require('../crypto/crypto');
var assert = require('assert');

/**
 * An object that allows reading of buffers in a sane manner.
 * @exports BufferReader
 * @constructor
 * @param {Buffer} data
 * @param {Boolean?} zeroCopy - Do not reallocate buffers when
 * slicing. Note that this can lead to memory leaks if not used
 * carefully.
 */

function BufferReader(data, zeroCopy) {
  if (data instanceof BufferReader)
    return data;

  if (!(this instanceof BufferReader))
    return new BufferReader(data, zeroCopy);

  this.data = data;
  this.offset = 0;
  this.zeroCopy = zeroCopy;
  this.stack = [];
}

/**
 * Get total size of passed-in Buffer.
 * @returns {Buffer}
 */

BufferReader.prototype.getSize = function getSize() {
  return this.data.length;
};

/**
 * Calculate number of bytes left to read.
 * @returns {Number}
 */

BufferReader.prototype.left = function left() {
  assert(this.offset <= this.data.length);
  return this.data.length - this.offset;
};

/**
 * Seek to a position to read from by offset.
 * @param {Number} off - Offset (positive or negative).
 */

BufferReader.prototype.seek = function seek(off) {
  assert(this.offset + off >= 0);
  assert(this.offset + off <= this.data.length);
  this.offset += off;
  return off;
};

/**
 * Mark the current starting position.
 */

BufferReader.prototype.start = function start() {
  this.stack.push(this.offset);
  return this.offset;
};

/**
 * Stop reading. Pop the start position off the stack
 * and calculate the size of the data read.
 * @returns {Number} Size.
 * @throws on empty stack.
 */

BufferReader.prototype.end = function end() {
  var start, end;

  assert(this.stack.length > 0);

  start = this.stack.pop();
  end = this.offset;

  return end - start;
};

/**
 * Stop reading. Pop the start position off the stack
 * and return the data read.
 * @param {Bolean?} zeroCopy - Do a fast buffer
 * slice instead of allocating a new buffer (warning:
 * may cause memory leaks if not used with care).
 * @returns {Buffer} Data read.
 * @throws on empty stack.
 */

BufferReader.prototype.endData = function endData(zeroCopy) {
  var ret, start, end, size, data;

  assert(this.stack.length > 0);

  start = this.stack.pop();
  end = this.offset;
  size = end - start;
  data = this.data;

  if (size === data.length)
    return data;

  if (this.zeroCopy || zeroCopy)
    return data.slice(start, end);

  ret = new Buffer(size);
  data.copy(ret, 0, start, end);

  return ret;
};

/**
 * Destroy the reader. Remove references to the data.
 */

BufferReader.prototype.destroy = function destroy() {
  this.offset = null;
  this.stack = null;
  this.data = null;
};

/**
 * Read uint8.
 * @returns {Number}
 */

BufferReader.prototype.readU8 = function readU8() {
  var ret;
  assert(this.offset + 1 <= this.data.length);
  ret = this.data.readUInt8(this.offset, true);
  this.offset += 1;
  return ret;
};

/**
 * Read uint16le.
 * @returns {Number}
 */

BufferReader.prototype.readU16 = function readU16() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readUInt16LE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read uint16be.
 * @returns {Number}
 */

BufferReader.prototype.readU16BE = function readU16BE() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readUInt16BE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read uint32le.
 * @returns {Number}
 */

BufferReader.prototype.readU32 = function readU32() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readUInt32LE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read uint32be.
 * @returns {Number}
 */

BufferReader.prototype.readU32BE = function readU32BE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readUInt32BE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read uint64le.
 * @returns {BN}
 */

BufferReader.prototype.readU64 = function readU64() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.readU64(this.data, this.offset);
  this.offset += 8;
  return ret;
};

/**
 * Read uint64be.
 * @returns {BN}
 */

BufferReader.prototype.readU64BE = function readU64BE() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.readU64BE(this.data, this.offset);
  this.offset += 8;
  return ret;
};

/**
 * Read uint64le as a js number.
 * @returns {Number}
 * @throws on num > MAX_SAFE_INTEGER
 */

BufferReader.prototype.readU64N = function readU64N(force53) {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.readU64N(this.data, this.offset, force53);
  this.offset += 8;
  return ret;
};

/**
 * Read uint64be as a js number.
 * @returns {Number}
 * @throws on num > MAX_SAFE_INTEGER
 */

BufferReader.prototype.readU64NBE = function readU64NBE(force53) {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.readU64NBE(this.data, this.offset, force53);
  this.offset += 8;
  return ret;
};

/**
 * Read first least significant 53 bits of
 * a uint64le as a js number. Maintain the sign.
 * @returns {Number}
 */

BufferReader.prototype.readU53 = function readU53() {
  return this.readU64N(true);
};

/**
 * Read first least significant 53 bits of
 * a uint64be as a js number. Maintain the sign.
 * @returns {Number}
 */

BufferReader.prototype.readU53BE = function readU53BE() {
  return this.readU64NBE(true);
};

/**
 * Read int8.
 * @returns {Number}
 */

BufferReader.prototype.read8 = function read8() {
  var ret;
  assert(this.offset + 1 <= this.data.length);
  ret = this.data.readInt8(this.offset, true);
  this.offset += 1;
  return ret;
};

/**
 * Read int16le.
 * @returns {Number}
 */

BufferReader.prototype.read16 = function read16() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readInt16LE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read int16be.
 * @returns {Number}
 */

BufferReader.prototype.read16BE = function read16BE() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readInt16BE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read int32le.
 * @returns {Number}
 */

BufferReader.prototype.read32 = function read32() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readInt32LE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read int32be.
 * @returns {Number}
 */

BufferReader.prototype.read32BE = function read32BE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readInt32BE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read int64le.
 * @returns {BN}
 */

BufferReader.prototype.read64 = function read64() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.read64(this.data, this.offset);
  this.offset += 8;
  return ret;
};

/**
 * Read int64be.
 * @returns {BN}
 */

BufferReader.prototype.read64BE = function read64BE() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.read64BE(this.data, this.offset);
  this.offset += 8;
  return ret;
};

/**
 * Read int64le as a js number.
 * @returns {Number}
 * @throws on num > MAX_SAFE_INTEGER
 */

BufferReader.prototype.read64N = function read64N(force53) {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.read64N(this.data, this.offset, force53);
  this.offset += 8;
  return ret;
};

/**
 * Read int64be as a js number.
 * @returns {Number}
 * @throws on num > MAX_SAFE_INTEGER
 */

BufferReader.prototype.read64NBE = function read64NBE(force53) {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = encoding.read64NBE(this.data, this.offset, force53);
  this.offset += 8;
  return ret;
};

/**
 * Read first least significant 53 bits of
 * a int64le as a js number. Maintain the sign.
 * @returns {Number}
 */

BufferReader.prototype.read53 = function read53() {
  return this.read64N(true);
};

/**
 * Read first least significant 53 bits of
 * a int64be as a js number. Maintain the sign.
 * @returns {Number}
 */

BufferReader.prototype.read53BE = function read53BE() {
  return this.read64NBE(true);
};

/**
 * Read float le.
 * @returns {Number}
 */

BufferReader.prototype.readFloat = function readFloat() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readFloatLE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read float be.
 * @returns {Number}
 */

BufferReader.prototype.readFloatBE = function readFloatBE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readFloatBE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read double float le.
 * @returns {Number}
 */

BufferReader.prototype.readDouble = function readDouble() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = this.data.readDoubleLE(this.offset, true);
  this.offset += 8;
  return ret;
};

/**
 * Read double float be.
 * @returns {Number}
 */

BufferReader.prototype.readDoubleBE = function readDoubleBE() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = this.data.readDoubleBE(this.offset, true);
  this.offset += 8;
  return ret;
};

/**
 * Read a varint.
 * @param {Boolean?} big - Whether to read as a big number.
 * @returns {Number}
 */

BufferReader.prototype.readVarint = function readVarint(big) {
  var result = encoding.readVarint(this.data, this.offset, big);
  this.offset += result.size;
  return result.value;
};

/**
 * Skip past a varint.
 * @returns {Number}
 */

BufferReader.prototype.skipVarint = function skipVarint() {
  var size = encoding.skipVarint(this.data, this.offset);
  assert(this.offset + size <= this.data.length);
  this.offset += size;
};

/**
 * Read a varint (type 2).
 * @param {Boolean?} big - Whether to read as a big number.
 * @returns {Number}
 */

BufferReader.prototype.readVarint2 = function readVarint2(big) {
  var result = encoding.readVarint2(this.data, this.offset, big);
  this.offset += result.size;
  return result.value;
};

/**
 * Read N bytes (will do a fast slice if zero copy).
 * @param {Number} size
 * @param {Bolean?} zeroCopy - Do a fast buffer
 * slice instead of allocating a new buffer (warning:
 * may cause memory leaks if not used with care).
 * @returns {Buffer}
 */

BufferReader.prototype.readBytes = function readBytes(size, zeroCopy) {
  var ret;

  assert(size >= 0);
  assert(this.offset + size <= this.data.length);

  if (this.zeroCopy || zeroCopy) {
    ret = this.data.slice(this.offset, this.offset + size);
  } else {
    ret = new Buffer(size);
    this.data.copy(ret, 0, this.offset, this.offset + size);
  }

  this.offset += size;

  return ret;
};

/**
 * Read a varint number of bytes (will do a fast slice if zero copy).
 * @param {Bolean?} zeroCopy - Do a fast buffer
 * slice instead of allocating a new buffer (warning:
 * may cause memory leaks if not used with care).
 * @returns {Buffer}
 */

BufferReader.prototype.readVarBytes = function readVarBytes(zeroCopy) {
  return this.readBytes(this.readVarint(), zeroCopy);
};

/**
 * Read a string.
 * @param {String} enc - Any buffer-supported encoding.
 * @param {Number} size
 * @returns {String}
 */

BufferReader.prototype.readString = function readString(enc, size) {
  var ret;
  assert(size >= 0);
  assert(this.offset + size <= this.data.length);
  ret = this.data.toString(enc, this.offset, this.offset + size);
  this.offset += size;
  return ret;
};

/**
 * Read a 32-byte hash.
 * @param {String} enc - `"hex"` or `null`.
 * @returns {Hash|Buffer}
 */

BufferReader.prototype.readHash = function readHash(enc) {
  if (enc)
    return this.readString(enc, 32);
  return this.readBytes(32);
};

/**
 * Read string of a varint length.
 * @param {String} enc - Any buffer-supported encoding.
 * @param {Number?} limit - Size limit.
 * @returns {String}
 */

BufferReader.prototype.readVarString = function readVarString(enc, limit) {
  var size = this.readVarint();
  assert(!limit || size <= limit, 'String exceeds limit.');
  return this.readString(enc, size);
};

/**
 * Read a null-terminated string.
 * @param {String} enc - Any buffer-supported encoding.
 * @returns {String}
 */

BufferReader.prototype.readNullString = function readNullString(enc) {
  var i, ret;
  assert(this.offset + 1 <= this.data.length);
  for (i = this.offset; i < this.data.length; i++) {
    if (this.data[i] === 0)
      break;
  }
  assert(i !== this.data.length);
  ret = this.readString(enc, i - this.offset);
  this.offset = i + 1;
  return ret;
};

/**
 * Create a checksum from the last start position.
 * @returns {Number} Checksum.
 */

BufferReader.prototype.createChecksum = function createChecksum() {
  var start = this.stack[this.stack.length - 1] || 0;
  var data = this.data.slice(start, this.offset);
  return crypto.hash256(data).readUInt32LE(0, true);
};

/**
 * Verify a 4-byte checksum against a calculated checksum.
 * @returns {Number} checksum
 * @throws on bad checksum
 */

BufferReader.prototype.verifyChecksum = function verifyChecksum() {
  var chk = this.createChecksum();
  var checksum = this.readU32();
  assert(chk === checksum, 'Checksum mismatch.');
  return checksum;
};

/*
 * Expose
 */

module.exports = BufferReader;
