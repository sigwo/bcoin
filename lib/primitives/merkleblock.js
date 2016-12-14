/*!
 * merkleblock.js - merkleblock object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var util = require('../utils/util');
var crypto = require('../crypto/crypto');
var assert = require('assert');
var constants = require('../protocol/constants');
var DUMMY = new Buffer([0]);
var AbstractBlock = require('./abstractblock');
var VerifyResult = require('../btc/errors').VerifyResult;
var BufferWriter = require('../utils/writer');
var BufferReader = require('../utils/reader');
var Headers = require('./headers');
var TX = require('./tx');

/**
 * Represents a merkle (filtered) block.
 * @exports MerkleBlock
 * @constructor
 * @extends AbstractBlock
 * @param {NakedBlock} options
 */

function MerkleBlock(options) {
  if (!(this instanceof MerkleBlock))
    return new MerkleBlock(options);

  AbstractBlock.call(this, options);

  this.hashes = [];
  this.flags = DUMMY;

  // List of matched TXs
  this.map = {};
  this.matches = [];
  this._validPartial = null;

  // TXs that will be pushed on
  this.txs = [];

  if (options)
    this.fromOptions(options);
}

util.inherits(MerkleBlock, AbstractBlock);

/**
 * Inject properties from options object.
 * @private
 * @param {NakedBlock} options
 */

MerkleBlock.prototype.fromOptions = function fromOptions(options) {
  var i, hash;

  assert(options, 'MerkleBlock data is required.');
  assert(Array.isArray(options.hashes));
  assert(Buffer.isBuffer(options.flags));

  if (options.hashes) {
    for (i = 0; i < options.hashes.length; i++) {
      hash = options.hashes[i];
      if (typeof hash === 'string')
        hash = new Buffer(hash, 'hex');
      this.hashes.push(hash);
    }
  }

  if (options.flags)
    this.flags = options.flags;

  return this;
};

/**
 * Instantiate merkle block from options object.
 * @param {NakedBlock} options
 * @returns {MerkleBlock}
 */

MerkleBlock.fromOptions = function fromOptions(data) {
  return new MerkleBlock().fromOptions(data);
};

/**
 * Get merkleblock size.
 * @returns {Number} Size.
 */

MerkleBlock.prototype.getSize = function getSize() {
  var writer = new BufferWriter();
  this.toRaw(writer);
  return writer.written;
};

/**
 * Add a transaction to the block's tx vector.
 * @param {TX|NakedTX} tx
 * @returns {TX}
 */

MerkleBlock.prototype.addTX = function addTX(tx) {
  var hash = tx.hash('hex');
  var index = this.map[hash];

  this.txs.push(tx);
  tx.setBlock(this, index);

  return index;
};

/**
 * Test the block's _matched_ transaction vector against a hash.
 * @param {Hash|TX} hash
 * @returns {Boolean}
 */

MerkleBlock.prototype.hasTX = function hasTX(hash) {
  return this.indexOf(hash) !== -1;
};

/**
 * Test the block's _matched_ transaction vector against a hash.
 * @param {Hash|TX} hash
 * @returns {Number} Index.
 */

MerkleBlock.prototype.indexOf = function indexOf(hash) {
  var index;

  if (hash instanceof TX)
    hash = hash.hash('hex');

  this.verifyPartial();

  index = this.map[hash];

  if (index == null)
    return -1;

  return index;
};

/**
 * Verify the partial merkletree. Push leaves onto
 * {@link MerkleBlock#tx} and into {@link MerkleBlock#map}.
 * @private
 * @returns {Boolean}
 */

MerkleBlock.prototype.verifyPartial = function verifyPartial() {
  var tree;

  if (this._validPartial != null)
    return this._validPartial;

  tree = this.extractTree();

  if (!tree || tree.root !== this.merkleRoot) {
    this._validPartial = false;
    return false;
  }

  this.matches = tree.matches;
  this.map = tree.map;
  this._validPartial = true;

  return true;
};

/**
 * Extract the matches from partial merkle
 * tree and calculate merkle root.
 * @private
 * @returns {Object}
 */

MerkleBlock.prototype.extractTree = function extractTree() {
  var bitsUsed = 0;
  var hashUsed = 0;
  var matches = [];
  var indexes = [];
  var map = {};
  var failed = false;
  var hashes = [];
  var flags = this.flags;
  var totalTX = this.totalTX;
  var height = 0;
  var root, p, buf;

  function width(height) {
    return (totalTX + (1 << height) - 1) >>> height;
  }

  function traverse(height, pos) {
    var parent, hash, left, right, txid;

    if (bitsUsed >= flags.length * 8) {
      failed = true;
      return constants.ZERO_HASH;
    }

    parent = (flags[bitsUsed / 8 | 0] >>> (bitsUsed % 8)) & 1;
    bitsUsed++;

    if (height === 0 || !parent) {
      if (hashUsed >= hashes.length) {
        failed = true;
        return constants.ZERO_HASH;
      }
      hash = hashes[hashUsed++];
      if (height === 0 && parent) {
        txid = hash.toString('hex');
        matches.push(hash);
        indexes.push(pos);
        map[txid] = pos;
      }
      return hash;
    }

    left = traverse(height - 1, pos * 2);
    if (pos * 2 + 1 < width(height - 1)) {
      right = traverse(height - 1, pos * 2 + 1);
      if (util.equal(right, left))
        failed = true;
    } else {
      right = left;
    }

    left.copy(buf, 0);
    right.copy(buf, 32);

    return crypto.hash256(buf);
  }

  for (p = 0; p < this.hashes.length; p++)
    hashes.push(this.hashes[p]);

  if (totalTX === 0)
    return;

  if (totalTX > constants.block.MAX_SIZE / 60)
    return;

  if (hashes.length > totalTX)
    return;

  if (flags.length * 8 < hashes.length)
    return;

  height = 0;
  while (width(height) > 1)
    height++;

  if (height > 0)
    buf = new Buffer(64);

  root = traverse(height, 0);

  if (failed)
    return;

  if (((bitsUsed + 7) / 8 | 0) !== flags.length)
    return;

  if (hashUsed !== hashes.length)
    return;

  return new PartialTree(root, matches, indexes, map);
};

/**
 * Do non-contextual verification on the block.
 * Verify the headers and the partial merkle tree.
 * @alias MerkleBlock#verify
 * @param {Number|null} - Adjusted time.
 * @param {Object?} ret - Return object, may be
 * set with properties `reason` and `score`.
 * @returns {Boolean}
 */

MerkleBlock.prototype._verify = function _verify(now, ret) {
  if (!ret)
    ret = new VerifyResult();

  if (!this.verifyHeaders(now, ret))
    return false;

  if (!this.verifyPartial()) {
    ret.reason = 'bad-txnmrklroot';
    ret.score = 100;
    return false;
  }

  return true;
};

/**
 * Extract the coinbase height (always -1).
 * @returns {Number}
 */

MerkleBlock.prototype.getCoinbaseHeight = function getCoinbaseHeight() {
  return -1;
};

/**
 * Inspect the block and return a more
 * user-friendly representation of the data.
 * @returns {Object}
 */

MerkleBlock.prototype.inspect = function inspect() {
  return {
    type: 'merkleblock',
    hash: this.rhash,
    height: this.height,
    date: util.date(this.ts),
    version: util.hex32(this.version),
    prevBlock: util.revHex(this.prevBlock),
    merkleRoot: util.revHex(this.merkleRoot),
    ts: this.ts,
    bits: this.bits,
    nonce: this.nonce,
    totalTX: this.totalTX,
    hashes: this.hashes.map(function(hash) {
      return hash.toString('hex');
    }),
    flags: this.flags,
    map: this.map,
    txs: this.txs.length
  };
};

/**
 * Serialize the merkleblock.
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Buffer|String}
 */

MerkleBlock.prototype.toRaw = function toRaw(writer) {
  var bw = BufferWriter(writer);
  var i;

  bw.writeU32(this.version);
  bw.writeHash(this.prevBlock);
  bw.writeHash(this.merkleRoot);
  bw.writeU32(this.ts);
  bw.writeU32(this.bits);
  bw.writeU32(this.nonce);
  bw.writeU32(this.totalTX);

  bw.writeVarint(this.hashes.length);

  for (i = 0; i < this.hashes.length; i++)
    bw.writeHash(this.hashes[i]);

  bw.writeVarBytes(this.flags);

  if (!writer)
    bw = bw.render();

  return bw;
};

/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */

MerkleBlock.prototype.fromRaw = function fromRaw(data) {
  var br = BufferReader(data);
  var i, count;

  this.version = br.readU32();
  this.prevBlock = br.readHash('hex');
  this.merkleRoot = br.readHash('hex');
  this.ts = br.readU32();
  this.bits = br.readU32();
  this.nonce = br.readU32();
  this.totalTX = br.readU32();

  count = br.readVarint();

  for (i = 0; i < count; i++)
    this.hashes.push(br.readHash());

  this.flags = br.readVarBytes();

  return this;
};

/**
 * Instantiate a merkleblock from a serialized data.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {MerkleBlock}
 */

MerkleBlock.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = new Buffer(data, enc);
  return new MerkleBlock().fromRaw(data);
};

/**
 * Convert the block to an object suitable
 * for JSON serialization. Note that the hashes
 * will be reversed to abide by bitcoind's legacy
 * of little-endian uint256s.
 * @returns {Object}
 */

MerkleBlock.prototype.toJSON = function toJSON() {
  return {
    type: 'merkleblock',
    hash: this.rhash,
    height: this.height,
    version: this.version,
    prevBlock: util.revHex(this.prevBlock),
    merkleRoot: util.revHex(this.merkleRoot),
    ts: this.ts,
    bits: this.bits,
    nonce: this.nonce,
    totalTX: this.totalTX,
    hashes: this.hashes.map(function(hash) {
      return util.revHex(hash.toString('hex'));
    }),
    flags: this.flags.toString('hex')
  };
};

/**
 * Inject properties from json object.
 * @private
 * @param {Object} json
 */

MerkleBlock.prototype.fromJSON = function fromJSON(json) {
  var i, hash;

  assert(json, 'MerkleBlock data is required.');
  assert.equal(json.type, 'merkleblock');
  assert(Array.isArray(json.hashes));
  assert(typeof json.flags === 'string');

  this.parseJSON(json);

  for (i = 0; i < json.hashes.length; i++) {
    hash = util.revHex(json.hashes[i]);
    this.hashes.push(new Buffer(hash, 'hex'));
  }

  this.flags = new Buffer(json.flags, 'hex');

  return this;
};

/**
 * Instantiate a merkle block from a jsonified block object.
 * @param {Object} json - The jsonified block object.
 * @returns {MerkleBlock}
 */

MerkleBlock.fromJSON = function fromJSON(json) {
  return new MerkleBlock().fromJSON(json);
};

/**
 * Create a merkleblock from a {@link Block} object, passing
 * it through a filter first. This will build the partial
 * merkle tree.
 * @param {Block} block
 * @param {Bloom} filter
 * @returns {MerkleBlock}
 */

MerkleBlock.fromBlock = function fromBlock(block, filter) {
  var matches = [];
  var i, tx;

  for (i = 0; i < block.txs.length; i++) {
    tx = block.txs[i];
    if (tx.isWatched(filter))
      matches.push(1);
    else
      matches.push(0);
  }

  return MerkleBlock.fromMatches(block, matches);
};

/**
 * Create a merkleblock from an array of txids.
 * This will build the partial merkle tree.
 * @param {Block} block
 * @param {Hash[]} hashes
 * @returns {MerkleBlock}
 */

MerkleBlock.fromHashes = function fromHashes(block, hashes) {
  var filter = {};
  var matches = [];
  var i, tx, hash;

  for (i = 0; i < hashes.length; i++) {
    hash = hashes[i];
    if (typeof hash === 'string')
      hash = new Buffer(hash, 'hex');
    filter[hash.toString('hex')] = true;
  }

  for (i = 0; i < block.txs.length; i++) {
    tx = block.txs[i];
    if (filter[tx.hash('hex')])
      matches.push(1);
    else
      matches.push(0);
  }

  return MerkleBlock.fromMatches(block, matches);
};

/**
 * Create a merkleblock from an array of matches.
 * This will build the partial merkle tree.
 * @param {Block} block
 * @param {Number[]} matches
 * @returns {MerkleBlock}
 */

MerkleBlock.fromMatches = function fromMatches(block, matches) {
  var txs = [];
  var leaves = [];
  var bits = [];
  var hashes = [];
  var i, tx, totalTX, height, flags, p, merkle, buf;

  for (i = 0; i < block.txs.length; i++) {
    tx = block.txs[i];
    if (matches[i])
      txs.push(tx);
    leaves.push(tx.hash());
  }

  totalTX = leaves.length;

  function width(height) {
    return (totalTX + (1 << height) - 1) >>> height;
  }

  function hash(height, pos, leaves) {
    var left, right;

    if (height === 0)
      return leaves[pos];

    left = hash(height - 1, pos * 2, leaves);

    if (pos * 2 + 1 < width(height - 1))
      right = hash(height - 1, pos * 2 + 1, leaves);
    else
      right = left;

    left.copy(buf, 0);
    right.copy(buf, 32);

    return crypto.hash256(buf);
  }

  function traverse(height, pos, leaves, matches) {
    var parent = 0;
    var p;

    for (p = (pos << height); p < ((pos + 1) << height) && p < totalTX; p++)
      parent |= matches[p];

    bits.push(parent);

    if (height === 0 || !parent) {
      hashes.push(hash(height, pos, leaves));
      return;
    }

    traverse(height - 1, pos * 2, leaves, matches);

    if (pos * 2 + 1 < width(height - 1))
      traverse(height - 1, pos * 2 + 1, leaves, matches);
  }

  height = 0;
  while (width(height) > 1)
    height++;

  if (height > 0)
    buf = new Buffer(64);

  traverse(height, 0, leaves, matches);

  flags = new Buffer((bits.length + 7) / 8 | 0);
  flags.fill(0);

  for (p = 0; p < bits.length; p++)
    flags[p / 8 | 0] |= bits[p] << (p % 8);

  merkle = new MerkleBlock();
  merkle._hash = block._hash;
  merkle.version = block.version;
  merkle.prevBlock = block.prevBlock;
  merkle.merkleRoot = block.merkleRoot;
  merkle.ts = block.ts;
  merkle.bits = block.bits;
  merkle.nonce = block.nonce;
  merkle.totalTX = totalTX;
  merkle.height = block.height;
  merkle.hashes = hashes;
  merkle.flags = flags;
  merkle.txs = txs;

  return merkle;
};

/**
 * Test whether an object is a MerkleBlock.
 * @param {Object} obj
 * @returns {Boolean}
 */

MerkleBlock.isMerkleBlock = function isMerkleBlock(obj) {
  return obj
    && obj.flags !== undefined
    && typeof obj.verifyPartial === 'function';
};

/**
 * Convert the block to a headers object.
 * @returns {Headers}
 */

MerkleBlock.prototype.toHeaders = function toHeaders() {
  return Headers.fromBlock(this);
};

/*
 * Helpers
 */

function PartialTree(root, matches, indexes, map) {
  this.root = root.toString('hex');
  this.matches = matches;
  this.indexes = indexes;
  this.map = map;
}

/*
 * Expose
 */

module.exports = MerkleBlock;
