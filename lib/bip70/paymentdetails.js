/*!
 * paymentdetails.js - bip70 paymentdetails for bcoin
 * Copyright (c) 2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var assert = require('assert');
var util = require('../utils/util');
var Output = require('../primitives/output');
var protobuf = require('../utils/protobuf');
var ProtoReader = protobuf.ProtoReader;
var ProtoWriter = protobuf.ProtoWriter;

function PaymentDetails(options) {
  if (!(this instanceof PaymentDetails))
    return new PaymentDetails(options);

  this.network = null;
  this.outputs = [];
  this.time = util.now();
  this.expires = -1;
  this.memo = null;
  this.paymentUrl = null;
  this.merchantData = null;

  if (options)
    this.fromOptions(options);
}

PaymentDetails.prototype.fromOptions = function fromOptions(options) {
  var i, output;

  if (options.network != null) {
    assert(typeof options.network === 'string');
    this.network = options.network;
  }

  if (options.outputs) {
    assert(Array.isArray(options.outputs));
    for (i = 0; i < options.outputs.length; i++) {
      output = new Output(options.outputs[i]);
      this.outputs.push(output);
    }
  }

  if (options.time != null) {
    assert(util.isNumber(options.time));
    this.time = options.time;
  }

  if (options.expires != null) {
    assert(util.isNumber(options.expires));
    this.expires = options.expires;
  }

  if (options.memo != null) {
    assert(typeof options.memo === 'string');
    this.memo = options.memo;
  }

  if (options.paymentUrl != null) {
    assert(typeof options.paymentUrl === 'string');
    this.paymentUrl = options.paymentUrl;
  }

  if (options.merchantData)
    this.setData(options.merchantData);

  return this;
};

PaymentDetails.fromOptions = function fromOptions(options) {
  return new PaymentDetails().fromOptions(options);
};

PaymentDetails.prototype.isExpired = function isExpired() {
  if (this.expires === -1)
    return false;
  return util.now() > this.expires;
};

PaymentDetails.prototype.setData = function setData(data, enc) {
  if (data == null || Buffer.isBuffer(data)) {
    this.merchantData = data;
    return;
  }

  if (typeof data !== 'string') {
    assert(!enc || enc === 'json');
    this.merchantData = new Buffer(JSON.stringify(data), 'utf8');
    return;
  }

  this.merchantData = new Buffer(data, enc);
};

PaymentDetails.prototype.getData = function getData(enc) {
  var data = this.merchantData;

  if (!data)
    return;

  if (!enc)
    return data;

  if (enc === 'json') {
    data = data.toString('utf8');
    try {
      data = JSON.parse(data);
    } catch (e) {
      return;
    }
    return data;
  }

  return data.toString(enc);
};

PaymentDetails.prototype.fromRaw = function fromRaw(data) {
  var br = new ProtoReader(data);
  var op, output;

  this.network = br.readFieldString(1, true);

  while (br.nextTag() === 2) {
    op = new ProtoReader(br.readFieldBytes(2));
    output = new Output();
    output.value = op.readFieldU64(1, true);
    output.script.fromRaw(op.readFieldBytes(2, true));
    this.outputs.push(output);
  }

  this.time = br.readFieldU64(3);
  this.expires = br.readFieldU64(4, true);
  this.memo = br.readFieldString(5, true);
  this.paymentUrl = br.readFieldString(6, true);
  this.merchantData = br.readFieldBytes(7, true);

  return this;
};

PaymentDetails.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = new Buffer(data, enc);
  return new PaymentDetails().fromRaw(data);
};

PaymentDetails.prototype.toRaw = function toRaw(writer) {
  var bw = new ProtoWriter(writer);
  var i, op, output;

  if (this.network != null)
    bw.writeFieldString(1, this.network);

  for (i = 0; i < this.outputs.length; i++) {
    output = this.outputs[i];
    op = new ProtoWriter();
    op.writeFieldU64(1, output.value);
    op.writeFieldBytes(2, output.script.toRaw());
    bw.writeFieldBytes(2, op.render());
  }

  bw.writeFieldU64(3, this.time);

  if (this.expires !== -1)
    bw.writeFieldU64(4, this.expires);

  if (this.memo != null)
    bw.writeFieldString(5, this.memo);

  if (this.paymentUrl != null)
    bw.writeFieldString(6, this.paymentUrl);

  if (this.merchantData)
    bw.writeFieldString(7, this.merchantData);

  if (!writer)
    bw = bw.render();

  return bw;
};

module.exports = PaymentDetails;
