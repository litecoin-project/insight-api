'use strict';

var Writable = require('stream').Writable;
var bodyParser = require('body-parser');
var compression = require('compression');
var BaseService = require('./service');
var inherits = require('util').inherits;
var BlockController = require('./blocks');
var TxController = require('./transactions');
var AddressController = require('./addresses');
var AssetController = require('./assets');
var StatusController = require('./status');
var MessagesController = require('./messages');
var UtilsController = require('./utils');
var CurrencyController = require('./currency');
var RateLimiter = require('./ratelimiter');
var Sync = require('./sync');
var morgan = require('morgan');
var bitcore = require('litecore-lib');
var async = require('async');
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var Transaction = bitcore.Transaction;
var EventEmitter = require('events').EventEmitter;

// install and connect to DB
var DB = require('./db');

/**
 * A service for Bitcore to enable HTTP routes to query information about the blockchain.
 *
 * @param {Object} options
 * @param {Boolean} options.enableCache - This will enable cache-control headers
 * @param {Number} options.cacheShortSeconds - The time to cache short lived cache responses.
 * @param {Number} options.cacheLongSeconds - The time to cache long lived cache responses.
 * @param {String} options.routePrefix - The URL route prefix
 */
var InsightCCAPI = function(options) {
  BaseService.call(this, options);

  // in minutes
  this.currencyRefresh = options.currencyRefresh || CurrencyController.DEFAULT_CURRENCY_DELAY;

  this.subscriptions = {
    ccinv: [],
  };

  if (!_.isUndefined(options.enableCache)) {
    $.checkArgument(_.isBoolean(options.enableCache));
    this.enableCache = options.enableCache;
  }
  this.cacheShortSeconds = options.cacheShortSeconds;
  this.cacheLongSeconds = options.cacheLongSeconds;

  this.rateLimiterOptions = options.rateLimiterOptions;
  this.disableRateLimiter = options.disableRateLimiter;

  this.blockSummaryCacheSize = options.blockSummaryCacheSize || BlockController.DEFAULT_BLOCKSUMMARY_CACHE_SIZE;
  this.blockCacheSize = options.blockCacheSize || BlockController.DEFAULT_BLOCK_CACHE_SIZE;

  if (!_.isUndefined(options.routePrefix)) {
    this.routePrefix = options.routePrefix;
  } else {
    this.routePrefix = this.name;
  }

  this.store = new DB(this.node);
  this.txController = new TxController(this.node);
  this.sync = new Sync(this.node);
};

InsightCCAPI.dependencies = [ 'bitcoind', 'web' ];

inherits(InsightCCAPI, BaseService);

InsightCCAPI.prototype.cache = function(maxAge) {
  var self = this;
  return function(req, res, next) {
    if (self.enableCache) {
      res.header('Cache-Control', 'public, max-age=' + maxAge);
    }
    next();
  };
};

InsightCCAPI.prototype.cacheShort = function() {
  var seconds = this.cacheShortSeconds || 30; // thirty seconds
  return this.cache(seconds);
};

InsightCCAPI.prototype.cacheLong = function() {
  var seconds = this.cacheLongSeconds || 86400; // one day
  return this.cache(seconds);
};

InsightCCAPI.prototype.getRoutePrefix = function() {
  return this.routePrefix;
};

InsightCCAPI.prototype.start = function(callback) {
  this.node.services.bitcoind.on('tx', this.transactionEventHandler.bind(this));
  this.node.services.bitcoind.on('block', this.blockEventHandler.bind(this));
  this.store.connect();
  this.sync.start();
  setImmediate(callback);
};

InsightCCAPI.prototype.stop = function(callback) {
  var self = this;

  self.sync.stop(function (argument) {
    // Wait until syncing stops and all db operations are completed before closing leveldb
    async.whilst(function() {
      return self.sync.litecoindSyncing;
    }, function(next) {
      setTimeout(next, 10);
    }, function() {
      self.store.close(callback);
    });
  });
};

InsightCCAPI.prototype.createLogInfoStream = function() {
  var self = this;

  function Log(options) {
    Writable.call(this, options);
  }
  inherits(Log, Writable);

  Log.prototype._write = function (chunk, enc, callback) {
    self.node.log.info(chunk.slice(0, chunk.length - 1)); // remove new line and pass to logger
    callback();
  };
  var stream = new Log();

  return stream;
};

InsightCCAPI.prototype.getRemoteAddress = function(req) {
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  return req.socket.remoteAddress;
};

InsightCCAPI.prototype._getRateLimiter = function() {
  var rateLimiterOptions = _.isUndefined(this.rateLimiterOptions) ? {} : _.clone(this.rateLimiterOptions);
  rateLimiterOptions.node = this.node;
  var limiter = new RateLimiter(rateLimiterOptions);
  return limiter;
};

InsightCCAPI.prototype.setupRoutes = function(app) {

  var self = this;

  //Enable rate limiter
  if (!this.disableRateLimiter) {
    var limiter = this._getRateLimiter();
    app.use(limiter.middleware());
  }

  //Setup logging
  morgan.token('remote-forward-addr', function(req){
    return self.getRemoteAddress(req);
  });
  var logFormat = ':remote-forward-addr ":method :url" :status :res[content-length] :response-time ":user-agent" ';
  var logStream = this.createLogInfoStream();
  app.use(morgan(logFormat, {stream: logStream}));

  //Enable compression
  app.use(compression());

  //Enable urlencoded data
  app.use(bodyParser.urlencoded({extended: true}));

  //Enable CORS
  app.use(function(req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Content-Length, Cache-Control, cf-connecting-ip');

    var method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
    } else {
      next();
    }
  });

  //Block routes
  var blockOptions = {
    node: this.node,
    blockSummaryCacheSize: this.blockSummaryCacheSize,
    blockCacheSize: this.blockCacheSize
  };
  var blocks = new BlockController(blockOptions);
  app.get('/blocks', this.cacheShort(), blocks.list.bind(blocks));

  app.get('/block/:blockHash', this.cacheShort(), blocks.checkBlockHash.bind(blocks), blocks.show.bind(blocks));
  app.param('blockHash', blocks.block.bind(blocks));

  app.get('/rawblock/:blockHash', this.cacheLong(), blocks.checkBlockHash.bind(blocks), blocks.showRaw.bind(blocks));
  app.param('blockHash', blocks.rawBlock.bind(blocks));

  app.get('/block-index/:height', this.cacheShort(), blocks.blockIndex.bind(blocks));
  app.param('height', blocks.blockIndex.bind(blocks));

  // Transaction routes
  var transactions = new TxController(this.node);
  app.get('/tx/:txid', this.cacheShort(), transactions.show.bind(transactions));
  app.param('txid', transactions.transaction.bind(transactions));
  app.get('/txs', this.cacheShort(), transactions.list.bind(transactions));
  app.post('/tx/send', transactions.send.bind(transactions));

  // Raw Routes
  app.get('/rawtx/:txid', this.cacheLong(), transactions.showRaw.bind(transactions));
  app.param('txid', transactions.rawTransaction.bind(transactions));

  // Address routes
  var addresses = new AddressController(this.node);
  app.get('/addr/:addr', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.show.bind(addresses));
  app.get('/addr/:addr/utxo', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.utxo.bind(addresses));
  app.get('/addrs/:addrs/utxo', this.cacheShort(), addresses.checkAddrs.bind(addresses), addresses.multiutxo.bind(addresses));
  app.post('/addrs/utxo', this.cacheShort(), addresses.checkAddrs.bind(addresses), addresses.multiutxo.bind(addresses));
  app.get('/addrs/:addrs/txs', this.cacheShort(), addresses.checkAddrs.bind(addresses), addresses.multitxs.bind(addresses));
  app.post('/addrs/txs', this.cacheShort(), addresses.checkAddrs.bind(addresses), addresses.multitxs.bind(addresses));

  // Address property routes
  app.get('/addr/:addr/balance', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.balance.bind(addresses));
  app.get('/addr/:addr/totalReceived', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.totalReceived.bind(addresses));
  app.get('/addr/:addr/totalSent', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.totalSent.bind(addresses));
  app.get('/addr/:addr/unconfirmedBalance', this.cacheShort(), addresses.checkAddr.bind(addresses), addresses.unconfirmedBalance.bind(addresses));

  // Asset routes
  var assets = new AssetController(this.node);
  app.get('/assets', this.cacheShort(), assets.list.bind(assets));
  app.get('/asset/:assetid', this.cacheShort(), assets.checkAsset.bind(assets), assets.show.bind(assets));
  // app.get('/assets/save_tx/:txid', this.cacheShort(), assets.saveTransaction.bind(assets));

  app.post('/assets/issue', this.cacheShort(), assets.buildIssueTransaction.bind(assets));
  app.post('/assets/sendAsset', this.cacheShort(), assets.buildSendTransaction.bind(assets));
  app.post('/assets/burnAsset', this.cacheShort(), assets.buildBurnTransaction.bind(assets));
  app.post('/assets/broadcast', this.cacheShort(), transactions.send.bind(transactions));


  // Status route
  var status = new StatusController(this.node);
  app.get('/status', this.cacheShort(), status.show.bind(status));
  app.get('/sync', this.cacheShort(), status.sync.bind(status));
  app.get('/peer', this.cacheShort(), status.peer.bind(status));
  app.get('/version', this.cacheShort(), status.version.bind(status));

  // Address routes
  var messages = new MessagesController(this.node);
  app.get('/messages/verify', messages.verify.bind(messages));
  app.post('/messages/verify', messages.verify.bind(messages));

  // Utils route
  var utils = new UtilsController(this.node);
  app.get('/utils/estimatefee', utils.estimateFee.bind(utils));

  // Currency
  var currency = new CurrencyController({
    node: this.node,
    currencyRefresh: this.currencyRefresh
  });
  app.get('/currency', currency.index.bind(currency));

  // Not Found
  app.use(function(req, res) {
    res.status(404).jsonp({
      status: 404,
      url: req.originalUrl,
      error: 'Not found'
    });
  });

};

InsightCCAPI.prototype.getPublishEvents = function() {
  return [
    {
      name: 'ccinv',
      scope: this,
      subscribe: this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this),
      extraEvents: ['cctx', 'ccblock']
    }
  ];
};

InsightCCAPI.prototype.blockEventHandler = function(hashBuffer) {
  // Notify ccinv subscribers
  for (var i = 0; i < this.subscriptions.ccinv.length; i++) {
    this.subscriptions.ccinv[i].emit('ccblock', hashBuffer.toString('hex'));
  }
};

InsightCCAPI.prototype.transactionEventHandler = function(txBuffer) {
  var tx = new Transaction().fromBuffer(txBuffer);
  var result = this.txController.transformInvTransaction(tx);

  for (var i = 0; i < this.subscriptions.ccinv.length; i++) {
    this.subscriptions.ccinv[i].emit('cctx', result);
  }

  this.txController.checkAndStoreCCTransaction(tx.hash, function (){})
};

InsightCCAPI.prototype.subscribe = function(emitter) {
  $.checkArgument(emitter instanceof EventEmitter, 'First argument is expected to be an EventEmitter');

  var emitters = this.subscriptions.ccinv;
  var index = emitters.indexOf(emitter);
  if(index === -1) {
    emitters.push(emitter);
  }
};

InsightCCAPI.prototype.unsubscribe = function(emitter) {
  $.checkArgument(emitter instanceof EventEmitter, 'First argument is expected to be an EventEmitter');

  var emitters = this.subscriptions.ccinv;
  var index = emitters.indexOf(emitter);
  if(index > -1) {
    emitters.splice(index, 1);
  }
};

module.exports = InsightCCAPI;
