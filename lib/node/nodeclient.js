/*!
 * nodeclient.js - node client for bcoin
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var util = require('../utils/util');
var co = require('../utils/co');
var AsyncObject = require('../utils/async');

/**
 * NodeClient
 * Sort of a fake local client for separation of concerns.
 * @constructor
 */

function NodeClient(node) {
  if (!(this instanceof NodeClient))
    return new NodeClient(node);

  AsyncObject.call(this);

  this.node = node;
  this.network = node.network;
  this.onError = node._error.bind(node);
  this.filter = null;
  this.listen = false;

  this._init();
}

util.inherits(NodeClient, AsyncObject);

/**
 * Initialize the client.
 * @returns {Promise}
 */

NodeClient.prototype._init = function init() {
  var self = this;

  this.node.on('connect', function(entry, block) {
    if (!self.listen)
      return;

    self.emit('block connect', entry, block.txs);
  });

  this.node.on('disconnect', function(entry, block) {
    if (!self.listen)
      return;

    self.emit('block disconnect', entry);
  });

  this.node.on('tx', function(tx) {
    if (!self.listen)
      return;

    self.emit('tx', tx);
  });

  this.node.on('reset', function(tip) {
    if (!self.listen)
      return;

    self.emit('chain reset', tip);
  });
};

/**
 * Open the client.
 * @returns {Promise}
 */

NodeClient.prototype._open = function open(options) {
  this.listen = true;
  return Promise.resolve();
};

/**
 * Close the client.
 * @returns {Promise}
 */

NodeClient.prototype._close = function close() {
  this.listen = false;
  return Promise.resolve();
};

/**
 * Get chain tip.
 * @returns {Promise}
 */

NodeClient.prototype.getTip = function getTip() {
  return Promise.resolve(this.node.chain.tip);
};

/**
 * Get chain entry.
 * @param {Hash} hash
 * @returns {Promise}
 */

NodeClient.prototype.getEntry = co(function* getEntry(hash) {
  var entry = yield this.node.chain.db.getEntry(hash);

  if (!entry)
    return;

  if (!(yield entry.isMainChain()))
    return;

  return entry;
});

/**
 * Send a transaction. Do not wait for promise.
 * @param {TX} tx
 * @returns {Promise}
 */

NodeClient.prototype.send = function send(tx) {
  this.node.sendTX(tx).catch(this.onError);
  return Promise.resolve();
};

/**
 * Set bloom filter.
 * @param {Bloom} filter
 * @returns {Promise}
 */

NodeClient.prototype.setFilter = function setFilter(filter) {
  this.filter = filter;
  this.node.pool.setFilter(filter);
  return Promise.resolve();
};

/**
 * Add data to filter.
 * @param {Buffer} data
 * @returns {Promise}
 */

NodeClient.prototype.addFilter = function addFilter(data) {
  return Promise.resolve();
};

/**
 * Reset filter.
 * @returns {Promise}
 */

NodeClient.prototype.resetFilter = function resetFilter() {
  return Promise.resolve();
};

/**
 * Esimate smart fee.
 * @param {Number?} blocks
 * @returns {Promise}
 */

NodeClient.prototype.estimateFee = function estimateFee(blocks) {
  if (!this.node.fees)
    return Promise.resolve(this.network.feeRate);
  return Promise.resolve(this.node.fees.estimateFee(blocks));
};

/**
 * Rescan for any missed transactions.
 * @param {Number|Hash} start - Start block.
 * @param {Bloom} filter
 * @param {Function} iter - Iterator.
 * @returns {Promise}
 */

NodeClient.prototype.rescan = function rescan(start) {
  var self = this;
  return this.node.chain.scan(start, this.filter, function(entry, txs) {
    return new Promise(function(resolve, reject) {
      var cb = co.wrap(resolve, reject);
      self.emit('block rescan', entry, txs, cb);
    });
  });
};

/*
 * Expose
 */

module.exports = NodeClient;
