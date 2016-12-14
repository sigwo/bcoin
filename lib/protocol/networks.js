/*!
 * network.js - bitcoin networks for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var BN = require('bn.js');

/**
 * @module network
 */

var network = exports;
var main, testnet, regtest, segnet3, segnet4, simnet;

/**
 * Network type list.
 * @memberof module:network
 * @const {String[]}
 * @default
 */

network.types = ['main', 'testnet', 'regtest', 'segnet3', 'segnet4', 'simnet'];

/**
 * Main
 * @static
 * @lends module:network
 * @type {Object}
 */

main = network.main = {};

/**
 * Symbolic network type.
 * @const {String}
 * @default
 */

main.type = 'main';

/**
 * Default seeds.
 * @const {String[]}
 * @default
 */

main.seeds = [
  'seed.bitcoin.sipa.be', // Pieter Wuille
  'dnsseed.bluematt.me', // Matt Corallo
  'dnsseed.bitcoin.dashjr.org', // Luke Dashjr
  'seed.bitcoinstats.com', // Christian Decker
  'bitseed.xf2.org', // Jeff Garzik
  'seed.bitcoin.jonasschnelli.ch' // Jonas Schnelli
];

/**
 * Packet magic number.
 * @const {Number}
 * @default
 */

main.magic = 0xd9b4bef9;

/**
 * Default network port.
 * @const {Number}
 * @default
 */

main.port = 8333;

/**
 * Public key for verifying alert packets.
 * @const {Buffer}
 */

main.alertKey = new Buffer(''
  + '04fc9702847840aaf195de8442ebecedf5b095c'
  + 'dbb9bc716bda9110971b28a49e0ead8564ff0db'
  + '22209e0374782c093bb899692d524e9d6a6956e'
  + '7c5ecbcd68284',
  'hex');

/**
 * Checkpoint block list.
 * @const {Object}
 */

main.checkpoints = {
  11111: '1d7c6eb2fd42f55925e92efad68b61edd22fba29fde8783df744e26900000000',
  33333: 'a6d0b5df7d0df069ceb1e736a216ad187a50b07aaa4e78748a58d52d00000000',
  74000: '201a66b853f9e7814a820e2af5f5dc79c07144e31ce4c9a39339570000000000',
  105000: '97dc6b1d15fbeef373a744fee0b254b0d2c820a3ae7f0228ce91020000000000',
  134444: 'feb0d2420d4a18914c81ac30f494a5d4ff34cd15d34cfd2fb105000000000000',
  168000: '63b703835cb735cb9a89d733cbe66f212f63795e0172ea619e09000000000000',
  193000: '17138bca83bdc3e6f60f01177c3877a98266de40735f2a459f05000000000000',
  210000: '2e3471a19b8e22b7f939c63663076603cf692f19837e34958b04000000000000',
  216116: '4edf231bf170234e6a811460f95c94af9464e41ee833b4f4b401000000000000',
  225430: '32595730b165f097e7b806a679cf7f3e439040f750433808c101000000000000',
  250000: '14d2f24d29bed75354f3f88a5fb50022fc064b02291fdf873800000000000000',
  279000: '407ebde958e44190fa9e810ea1fc3a7ef601c3b0a0728cae0100000000000000',
  295000: '83a93246c67003105af33ae0b29dd66f689d0f0ff54e9b4d0000000000000000',
  // Checkpoints from btcd:
  300255: 'b2f3a0f0de4120c1089d5f5280a263059f9b6e7c520428160000000000000000',
  319400: '3bf115fd057391587ca39a531c5d4989e1adec9b2e05c6210000000000000000',
  343185: '548536d48e7678fcfa034202dd45d4a76b1ad061f38b2b070000000000000000',
  352940: 'ffc9520143e41c94b6e03c2fa3e62bb76b55ba2df45d75100000000000000000',
  382320: 'b28afdde92b0899715e40362f56afdb20e3d135bedc68d0a0000000000000000',
  // Custom checkpoints
  401465: 'eed16cb3e893ed9366f27c39a9ecd95465d02e3ef40e45010000000000000000',
  420000: 'a1ff746b2d42b834cb7d6b8981b09c265c2cabc016e8cc020000000000000000'
};

main.checkpoints.lastHeight = 420000;

/**
 * @const {Number}
 * @default
 */

main.halvingInterval = 210000;

/**
 * Genesis block header.
 * @const {NakedBlock}
 */

main.genesis = {
  version: 1,
  hash: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1231006505,
  bits: 486604799,
  nonce: 2083236893,
  height: 0
};

/**
 * The network's genesis block in a hex string.
 * @const {String}
 */

main.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab'
  + '5f49ffff001d1dac2b7c01010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

/**
 * POW-related constants.
 * @enum {Number}
 * @default
 */

main.pow = {
  /**
   * Default target.
   * @const {Buffer}
   */

  limit: new BN(
    '00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'hex'
  ),

  /**
   * Compact pow limit.
   * @const {Number}
   * @default
   */

  bits: 486604799,

  /**
   * Default retarget interval.
   * @const {Number}
   * @default
   */

  targetTimespan: 14 * 24 * 60 * 60, // two weeks

  /**
   * Average block time.
   * @const {Number}
   * @default
   */

  targetSpacing: 10 * 60,

  /**
   * Retarget interval in blocks.
   * @const {Number}
   * @default
   */

  retargetInterval: 2016,

  /**
   * Allow constant retargetting on testnet.
   * @const {Boolean}
   * @default
   */

  difficultyReset: false,

  /**
   * Do not allow retargetting.
   * @const {Boolean}
   * @default
   */

  noRetargeting: false
};

/**
 * Block constants.
 * @enum {Number}
 * @default
 */

main.block = {
  /**
   * Height at which bip34 was activated.
   * Used for avoiding bip30 checks.
   */

  bip34height: 227931,

  /**
   * Hash of the block that activated bip34.
   */

  bip34hash: 'b808089c756add1591b1d17bab44bba3fed9e02f942ab4894b02000000000000',

  /**
   * Height at which bip65 was activated.
   */

  bip65height: 388381,

  /**
   * Hash of the block that activated bip65.
   */

  bip65hash: 'f035476cfaeb9f677c2cdad00fd908c556775ded24b6c2040000000000000000',

  /**
   * Height at which bip66 was activated.
   */

  bip66height: 363725,

  /**
   * Hash of the block that activated bip66.
   */

  bip66hash: '3109b588941188a9f1c2576aae462d729b8cce9da1ea79030000000000000000',

  /**
   * Safe height to start pruning.
   */

  pruneAfterHeight: 1000,

  /**
   * Safe number of blocks to keep.
   */

  keepBlocks: 288,

  /**
   * Age used for the time delta to
   * determine whether the chain is synced.
   */

  maxTipAge: 24 * 60 * 60,

  /**
   * Height at which block processing is
   * slow enough that we can output
   * logs without spamming.
   */

  slowHeight: 325000
};

/**
 * Whether this is a segwit-enabled network.
 * @const {Boolean}
 * @default
 */

main.witness = true;

/**
 * Whether to use segnet3-style segwit.
 * @const {Boolean}
 * @default
 */

main.oldWitness = false;

/**
 * For versionbits.
 * @const {Number}
 * @default
 */

main.activationThreshold = 1916; // 95% of 2016

/**
 * Confirmation window for versionbits.
 * @const {Number}
 * @default
 */

main.minerWindow = 2016; // nPowTargetTimespan / nPowTargetSpacing

/**
 * Deployments for versionbits.
 * @const {Object}
 * @default
 */

main.deployments = {
  testdummy: {
    name: 'testdummy',
    bit: 28,
    startTime: 1199145601, // January 1, 2008
    timeout: 1230767999, // December 31, 2008
    force: true
  },
  csv: {
    name: 'csv',
    bit: 0,
    startTime: 1462060800, // May 1st, 2016
    timeout: 1493596800, // May 1st, 2017
    force: true
  },
  witness: {
    name: 'witness',
    bit: 1,
    startTime: 1479168000, // November 15th, 2016.
    timeout: 1510704000, // November 15th, 2017.
    force: false
  },
  mast: {
    name: 'mast',
    bit: 2,
    startTime: 0xffffffff, // Far in the future
    timeout: 0xffffffff,
    force: false
  }
};

/**
 * Deployments for versionbits (array form, sorted).
 * @const {Array}
 * @default
 */

main.deploys = [
  main.deployments.csv,
  main.deployments.witness,
  main.deployments.mast,
  main.deployments.testdummy
];

/**
 * Key prefixes.
 * @enum {Number}
 * @default
 */

main.keyPrefix = {
  privkey: 0x80,
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  xprivkey58: 'xprv',
  xpubkey58: 'xpub',
  coinType: 0
};

/**
 * {@link Address} prefixes.
 * @enum {Number}
 */

main.addressPrefix = {
  pubkeyhash: 0x00,
  scripthash: 0x05,
  witnesspubkeyhash: 0x06,
  witnessscripthash: 0x0a
};

/**
 * Default value for whether the mempool
 * accepts non-standard transactions.
 * @const {Boolean}
 * @default
 */

main.requireStandard = true;

/**
 * Default http port.
 * @const {Number}
 * @default
 */

main.rpcPort = 8332;

/**
 * Default min relay rate.
 * @const {Rate}
 * @default
 */

main.minRelay = 10000;

/**
 * Default normal relay rate.
 * @const {Rate}
 * @default
 */

main.feeRate = 50000;

/**
 * Maximum normal relay rate.
 * @const {Rate}
 * @default
 */

main.maxFeeRate = 150000;

/**
 * Whether to allow self-connection.
 * @const {Boolean}
 */

main.selfConnect = false;

/**
 * Whether to request mempool on sync.
 * @const {Boolean}
 */

main.requestMempool = false;

/**
 * Number of blocks to request based on chain height.
 * @const {Array}
 */

main.batchSize = [
  [100000, 500],
  [150000, 250],
  [250000, 150],
  [350000, 50],
  [20]
];

/*
 * Testnet (v3)
 * https://en.bitcoin.it/wiki/Testnet
 */

testnet = network.testnet = {};

testnet.type = 'testnet';

testnet.seeds = [
  'testnet-seed.alexykot.me',
  'testnet-seed.bitcoin.petertodd.org',
  'testnet-seed.bluematt.me',
  'testnet-seed.bitcoin.schildbach.de'
];

testnet.magic = 0x0709110b;

testnet.port = 18333;

testnet.alertKey = new Buffer(''
  + '04302390343f91cc401d56d68b123028bf52e5f'
  + 'ca1939df127f63c6467cdf9c8e2c14b61104cf8'
  + '17d0b780da337893ecc4aaff1309e536162dabb'
  + 'db45200ca2b0a',
  'hex');

testnet.checkpoints = {
  546: '70cb6af7ebbcb1315d3414029c556c55f3e2fc353c4c9063a76c932a00000000',
  // Custom checkpoints
  10000: '02a1b43f52591e53b660069173ac83b675798e12599dbb0442b7580000000000',
  100000: '1e0a16bbadccde1d80c66597b1939e45f91b570d29f95fc158299e0000000000',
  170000: '508125560d202b89757889bb0e49c712477be20440058f05db4f0e0000000000',
  210000: '32365454b5f29a826bff8ad9b0448cad0072fc73d50e482d91a3dece00000000',
  300000: 'a141bf3972424853f04367b47995e220e0b5a2706e5618766f22000000000000',
  390000: 'f217e183484fb6d695609cc71fa2ae24c3020943407e0150b298030000000000',
  420000: 'de9e73a3b91fbb014e036e8583a17d6b638a699aeb2de8573d12580800000000',
  500000: '06f60922a2aab2757317820fc6ffaf6a470e2cbb0f63a2aac0a7010000000000',
  630000: 'bbbe117035432a6a4effcb297207a02b031735b43e0d19a9217c000000000000',
  700000: 'c14d3f6a1e7c7d66fd940951e44f3c3be1273bea4d2ab1786140000000000000',
  780000: '0381582e34c3755964dc2813e2b33e521e5596367144e1670851050000000000',
  840000: 'dac1648107bd4394e57e4083c86d42b548b1cfb119665f179ea80a0000000000',
  900000: '9bd8ac418beeb1a2cf5d68c8b5c6ebaa947a5b766e5524898d6f350000000000'
};

testnet.checkpoints.lastHeight = 900000;

testnet.halvingInterval = 210000;

testnet.genesis = {
  version: 1,
  hash: '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1296688602,
  bits: 486604799,
  nonce: 414098458,
  height: 0
};

testnet.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4adae5'
  + '494dffff001d1aa4ae1801010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

testnet.pow = {
  limit: new BN(
    '00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'hex'
  ),
  bits: 486604799,
  targetTimespan: 14 * 24 * 60 * 60, // two weeks
  targetSpacing: 10 * 60,
  retargetInterval: 2016,
  difficultyReset: true,
  noRetargeting: false
};

testnet.block = {
  bip34height: 21111,
  bip34hash: 'f88ecd9912d00d3f5c2a8e0f50417d3e415c75b3abe584346da9b32300000000',
  bip65height: 581885,
  bip65hash: 'b61e864fbec41dfaf09da05d1d76dc068b0dd82ee7982ff255667f0000000000',
  bip66height: 330776,
  bip66hash: '82a14b9e5ea81d4832b8e2cd3c2a6092b5a3853285a8995ec4c8042100000000',
  pruneAfterHeight: 1000,
  keepBlocks: 10000,
  // maxTipAge: 0x7fffffff
  maxTipAge: 24 * 60 * 60,
  slowHeight: 750000
};

testnet.witness = true;

testnet.oldWitness = false;

testnet.activationThreshold = 1512; // 75% for testchains

testnet.minerWindow = 2016; // nPowTargetTimespan / nPowTargetSpacing

testnet.deployments = {
  testdummy: {
    name: 'testdummy',
    bit: 28,
    startTime: 1199145601, // January 1, 2008
    timeout: 1230767999, // December 31, 2008
    force: true
  },
  csv: {
    name: 'csv',
    bit: 0,
    startTime: 1456790400, // March 1st, 2016
    timeout: 1493596800, // May 1st, 2017
    force: true
  },
  witness: {
    name: 'witness',
    bit: 1,
    startTime: 1462060800, // May 1st 2016
    timeout: 1493596800, // May 1st 2017
    force: false
  },
  mast: {
    name: 'mast',
    bit: 2,
    startTime: 0xffffffff, // Far in the future
    timeout: 0xffffffff,
    force: false
  }
};

testnet.deploys = [
  testnet.deployments.csv,
  testnet.deployments.witness,
  testnet.deployments.mast,
  testnet.deployments.testdummy
];

testnet.keyPrefix = {
  privkey: 0xef,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  xprivkey58: 'tprv',
  xpubkey58: 'tpub',
  coinType: 1
};

testnet.addressPrefix = {
  pubkeyhash: 0x6f,
  scripthash: 0xc4,
  witnesspubkeyhash: 0x03,
  witnessscripthash: 0x28
};

testnet.requireStandard = false;

testnet.rpcPort = 18332;

testnet.minRelay = 10000;

testnet.feeRate = 20000;

testnet.maxFeeRate = 60000;

testnet.selfConnect = false;

testnet.requestMempool = false;

testnet.batchSize = [
  [100000, 500],
  [250]
];

/*
 * Regtest
 */

regtest = network.regtest = {};

regtest.type = 'regtest';

regtest.seeds = [
  '127.0.0.1'
];

regtest.magic = 0xdab5bffa;

regtest.port = 18444;

regtest.alertPrivateKey = new Buffer(
  'b866c595a088e2d9ea87ff4df173dd5990b1331fa9acff6aa82cc04162a63f91',
  'hex');

regtest.alertKey = new Buffer(
  '032b7c336bc802421f38063251a6230cc3cd3a9c4282d1673fbb037a4fd4f7408c',
  'hex');

regtest.checkpoints = {};
regtest.checkpoints.lastHeight = 0;

regtest.halvingInterval = 150;

regtest.genesis = {
  version: 1,
  hash: '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1296688602,
  bits: 545259519,
  nonce: 2,
  height: 0
};

regtest.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4adae5'
  + '494dffff7f200200000001010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

regtest.pow = {
  limit: new BN(
    '7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'hex'
  ),
  bits: 545259519,
  targetTimespan: 14 * 24 * 60 * 60, // two weeks
  targetSpacing: 10 * 60,
  retargetInterval: 2016,
  difficultyReset: true,
  noRetargeting: true
};

regtest.block = {
  bip34height: 100000000,
  bip34hash: null,
  bip65height: 1351,
  bip65hash: null,
  bip66height: 1251,
  bip66hash: null,
  pruneAfterHeight: 1000,
  keepBlocks: 10000,
  maxTipAge: 24 * 60 * 60,
  slowHeight: 0x7fffffff
};

regtest.witness = false;

regtest.oldWitness = false;

regtest.activationThreshold = 108; // 75% for testchains

regtest.minerWindow = 144; // Faster than normal for regtest (144 instead of 2016)

regtest.deployments = {
  testdummy: {
    name: 'testdummy',
    bit: 28,
    startTime: 0,
    timeout: 0xffffffff,
    force: true
  },
  csv: {
    name: 'csv',
    bit: 0,
    startTime: 0,
    timeout: 0xffffffff,
    force: true
  },
  witness: {
    name: 'witness',
    bit: 1,
    startTime: 0,
    timeout: 0xffffffff,
    force: false
  },
  mast: {
    name: 'mast',
    bit: 2,
    startTime: 0xffffffff, // Far in the future
    timeout: 0xffffffff,
    force: false
  }
};

regtest.deploys = [
  regtest.deployments.csv,
  regtest.deployments.witness,
  regtest.deployments.mast,
  regtest.deployments.testdummy
];

regtest.keyPrefix = {
  privkey: 0xef,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  xprivkey58: 'tprv',
  xpubkey58: 'tpub',
  coinType: 1
};

regtest.addressPrefix = {
  pubkeyhash: 0x6f,
  scripthash: 0xc4,
  witnesspubkeyhash: 0x03,
  witnessscripthash: 0x28
};

regtest.requireStandard = false;

regtest.rpcPort = 18332;

regtest.minRelay = 10000;

regtest.feeRate = 20000;

regtest.maxFeeRate = 60000;

regtest.selfConnect = true;

regtest.requestMempool = true;

regtest.batchSize = [
  [500]
];

/*
 * segnet3
 */

segnet3 = network.segnet3 = {};

segnet3.type = 'segnet3';

segnet3.seeds = [
  '104.243.38.34',
  '104.155.1.158',
  '119.246.245.241',
  '46.101.235.82'
];

segnet3.magic = 0xcaea962e;

segnet3.port = 28333;

segnet3.alertKey = new Buffer(
  '0300000000000000000000003b78ce563f89a0ed9414f5aa28ad0d96d6795f9c63',
  'hex');

segnet3.checkpoints = {};
segnet3.checkpoints.lastHeight = 0;

segnet3.halvingInterval = 210000;

segnet3.genesis = {
  version: 1,
  hash: 'aa022fd26404d3a1f6ac348fc049996a52f40d833017c7ca3f05df8d519c5b0d',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1452831101,
  bits: 486604799,
  nonce: 0,
  height: 0
};

segnet3.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a7d71'
  + '9856ffff001d0000000001010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

segnet3.pow = {
  limit: new BN(
    '00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'hex'
  ),
  bits: 486604799,
  targetTimespan: 14 * 24 * 60 * 60, // two weeks
  targetSpacing: 10 * 60,
  retargetInterval: 2016,
  difficultyReset: true,
  noRetargeting: false
};

segnet3.block = {
  bip34height: 8,
  bip34hash: '1c2a2898cebca152f872fa71b756903711ad778c7d63ba6b73c140f800000000',
  bip65height: 8,
  bip65hash: '1c2a2898cebca152f872fa71b756903711ad778c7d63ba6b73c140f800000000',
  bip66height: 8,
  bip66hash: '1c2a2898cebca152f872fa71b756903711ad778c7d63ba6b73c140f800000000',
  bip141height: 8,
  bip141hash: '1c2a2898cebca152f872fa71b756903711ad778c7d63ba6b73c140f800000000',
  pruneAfterHeight: 1000,
  keepBlocks: 10000,
  // maxTipAge: 0x7fffffff,
  maxTipAge: 24 * 60 * 60,
  slowHeight: 0x7fffffff
};

segnet3.witness = true;

segnet3.oldWitness = true;

segnet3.activationThreshold = 108;

segnet3.minerWindow = 144;

segnet3.deployments = {};

segnet3.deploys = [];

segnet3.keyPrefix = {
  privkey: 0x9e,
  xpubkey: 0x053587cf,
  xprivkey: 0x05358394,
  xprivkey58: '2791',
  xpubkey58: '2793',
  coinType: 1
};

segnet3.addressPrefix = {
  pubkeyhash: 0x1e,
  scripthash: 0x32,
  witnesspubkeyhash: 0x03,
  witnessscripthash: 0x28
};

segnet3.requireStandard = false;

segnet3.rpcPort = 28332;

segnet3.minRelay = 10000;

segnet3.feeRate = 20000;

segnet3.maxFeeRate = 60000;

segnet3.selfConnect = false;

segnet3.requestMempool = true;

segnet3.batchSize = [
  [20000, 500],
  [250]
];

/*
 * segnet4
 */

segnet4 = network.segnet4 = {};

segnet4.type = 'segnet4';

segnet4.seeds = [
  '104.243.38.34',
  '37.34.48.17'
];

segnet4.magic = 0xc4a1abdc;

segnet4.port = 28901;

segnet4.alertKey = new Buffer(
  '0300000000000000000000003b78ce563f89a0ed9414f5aa28ad0d96d6795f9c63',
  'hex');

segnet4.checkpoints = {};
segnet4.checkpoints.lastHeight = 0;

segnet4.halvingInterval = 210000;

segnet4.genesis = {
  version: 1,
  hash: 'b291211d4bb2b7e1b7a4758225e69e50104091a637213d033295c010f55ffb18',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1452831101,
  bits: 503447551,
  nonce: 0,
  height: 0
};

segnet4.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a7d71'
  + '9856ffff011e0000000001010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

segnet4.pow = {
  // 512x lower min difficulty than mainnet
  limit: new BN(
    '000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'hex'
  ),
  bits: 503447551,
  targetTimespan: 14 * 24 * 60 * 60, // two weeks
  targetSpacing: 10 * 60,
  retargetInterval: 2016,
  difficultyReset: true,
  noRetargeting: false
};

segnet4.block = {
  bip34height: 8,
  bip34hash: '6c48386dc7c460defabb5640e28b6510a5f238cdbe6756c2976a7e0913000000',
  bip65height: 8,
  bip65hash: '6c48386dc7c460defabb5640e28b6510a5f238cdbe6756c2976a7e0913000000',
  bip66height: 8,
  bip66hash: '6c48386dc7c460defabb5640e28b6510a5f238cdbe6756c2976a7e0913000000',
  pruneAfterHeight: 1000,
  keepBlocks: 10000,
  // maxTipAge: 0x7fffffff,
  maxTipAge: 24 * 60 * 60,
  slowHeight: 0x7fffffff
};

segnet4.witness = true;

segnet4.oldWitness = false;

segnet4.activationThreshold = 108;

segnet4.minerWindow = 144;

segnet4.deployments = {
  testdummy: {
    name: 'testdummy',
    bit: 28,
    startTime: 1199145601, // January 1, 2008
    timeout: 1230767999, // December 31, 2008
    force: true
  },
  csv: {
    name: 'csv',
    bit: 0,
    startTime: 1456790400, // March 1st, 2016
    timeout: 1493596800, // May 1st, 2017
    force: true
  },
  witness: {
    name: 'witness',
    bit: 1,
    startTime: 0,
    timeout: 999999999999,
    force: false
  }
};

segnet4.deploys = [
  segnet4.deployments.csv,
  segnet4.deployments.witness,
  segnet4.deployments.testdummy
];

segnet4.keyPrefix = {
  privkey: 0x9e,
  xpubkey: 0x053587cf,
  xprivkey: 0x05358394,
  xprivkey58: '2791',
  xpubkey58: '2793',
  coinType: 1
};

segnet4.addressPrefix = {
  pubkeyhash: 0x1e,
  scripthash: 0x32,
  witnesspubkeyhash: 0x03,
  witnessscripthash: 0x28
};

segnet4.requireStandard = false;

segnet4.rpcPort = 28902;

segnet4.minRelay = 10000;

segnet4.feeRate = 20000;

segnet4.maxFeeRate = 60000;

segnet4.selfConnect = false;

segnet4.requestMempool = true;

segnet4.batchSize = [
  [17000, 500],
  [250]
];

/*
 * Simnet (btcd)
 */

simnet = network.simnet = {};

simnet.type = 'simnet';

simnet.seeds = [
  '127.0.0.1'
];

simnet.magic = 0x12141c16;

simnet.port = 18555;

simnet.alertKey = new Buffer(''
  + '04302390343f91cc401d56d68b123028bf52e5f'
  + 'ca1939df127f63c6467cdf9c8e2c14b61104cf8'
  + '17d0b780da337893ecc4aaff1309e536162dabb'
  + 'db45200ca2b0a',
  'hex');

simnet.checkpoints = {};

simnet.checkpoints.lastHeight = 0;

simnet.halvingInterval = 210000;

simnet.genesis = {
  version: 1,
  hash: 'f67ad7695d9b662a72ff3d8edbbb2de0bfa67b13974bb9910d116d5cbd863e68',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
  ts: 1401292357,
  bits: 545259519,
  nonce: 2,
  height: 0
};

simnet.genesisBlock =
  '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a4506'
  + '8653ffff7f200200000001010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

simnet.pow = {
  limit: new BN(
    // High target of 0x207fffff (545259519)
    '7fffff0000000000000000000000000000000000000000000000000000000000',
    'hex'
  ),
  bits: 545259519,
  targetTimespan: 14 * 24 * 60 * 60, // two weeks
  targetSpacing: 10 * 60,
  retargetInterval: 2016,
  difficultyReset: true,
  noRetargeting: false
};

simnet.block = {
  bip34height: 0,
  bip34hash: 'f67ad7695d9b662a72ff3d8edbbb2de0bfa67b13974bb9910d116d5cbd863e68',
  bip65height: 0,
  bip65hash: 'f67ad7695d9b662a72ff3d8edbbb2de0bfa67b13974bb9910d116d5cbd863e68',
  bip66height: 0,
  bip66hash: 'f67ad7695d9b662a72ff3d8edbbb2de0bfa67b13974bb9910d116d5cbd863e68',
  pruneAfterHeight: 1000,
  keepBlocks: 10000,
  maxTipAge: 0x7fffffff,
  slowHeight: 0
};

simnet.witness = false;

simnet.oldWitness = false;

simnet.activationThreshold = 1512; // 75% for testchains

simnet.minerWindow = 2016; // nPowTargetTimespan / nPowTargetSpacing

simnet.deployments = {
  testdummy: {
    name: 'testdummy',
    bit: 28,
    startTime: 1199145601, // January 1, 2008
    timeout: 1230767999, // December 31, 2008
    force: true
  },
  csv: {
    name: 'csv',
    bit: 0,
    startTime: 1456790400, // March 1st, 2016
    timeout: 1493596800, // May 1st, 2017
    force: true
  },
  witness: {
    name: 'witness',
    bit: 1,
    startTime: 1462060800, // May 1st 2016
    timeout: 1493596800, // May 1st 2017
    force: false
  },
  mast: {
    name: 'mast',
    bit: 2,
    startTime: 0xffffffff, // Far in the future
    timeout: 0xffffffff,
    force: false
  }
};

simnet.deploys = [
  simnet.deployments.csv,
  simnet.deployments.witness,
  simnet.deployments.mast,
  simnet.deployments.testdummy
];

simnet.keyPrefix = {
  privkey: 0x64,
  xpubkey: 0x0420bd3a,
  xprivkey: 0x0420b900,
  xprivkey58: 'sprv',
  xpubkey58: 'spub',
  coinType: 115
};

simnet.addressPrefix = {
  pubkeyhash: 0x3f,
  scripthash: 0x7b,
  witnesspubkeyhash: 0x03,
  witnessscripthash: 0x28
};

simnet.requireStandard = false;

simnet.rpcPort = 18556;

simnet.minRelay = 10000;

simnet.feeRate = 20000;

simnet.maxFeeRate = 60000;

simnet.selfConnect = true;

simnet.requestMempool = false;

simnet.batchSize = [
  [100000, 500],
  [250]
];
