'use strict';

// REMOVE LATER TO USE NODE CONFIG
var config = require('config');
var firstColoredBlock = config.firstColoredBlock;

var mongoose = require('mongoose');
var TxController = require('./transactions');
var BlockController = require('./blocks');
var CCBlock = require('./models/cc_block');
var async = require('async');

function Sync(node) {
  this.node = node;
  this.blocksToSync = [];
  this.txController = new TxController(this.node);
}

Sync.prototype.syncBlock = function(blockHeight, callback) {
  this.node.log.info(`[CC-API] searching cc transactions in block ${blockHeight}`);
  var self = this;
  var count = 0;
  this.node.getBlock(parseInt(blockHeight), function(err, block) {
    if (err) {
      return callback(err.message);
    }
    if (self.node.stopping) {
      self.litecoindSyncing = false;
      callback(null, false);
      return;
    }
    var ccTransactions = [];
    self.node.log.info(`[CC-API] got block ${blockHeight} with ${block.transactions.length} txs`)
    // Loop through every transaction in the block to find colorecoins data
    async.everySeries(block.transactions, function (tx, cb) {
      if (self.node.stopping) {
        self.litecoindSyncing = false;
        callback(null, false);
        return;
      }
      count = count + 1;
      self.txController.checkAndStoreCCTransaction(tx.hash, function (err, cctransaction) {
        if (err) {
          cb(new Error(err));
          return
        }
        if (cctransaction) {
          self.node.log.info(`[CC-API] found cc transaction hash ${tx.hash}`)
          ccTransactions.push(cctransaction);
        }
        cb(null, true);
      });
    }, function (err) {
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.
        self.node.log.error(`[CC-API] ${err}`);
        callback(err);
        return
      }

      self.node.log.info(`[CC-API] synced block ${blockHeight} with ${ccTransactions.length} cc transactions`);
      var ccblock = new CCBlock({
        timestamp: block.header.time,
        height: blockHeight,
        cc_transactions: ccTransactions.map(function (cctx) { return cctx.hash })
      });
      ccblock.save(function (err, ccblock) {
        if (err) {
          throw new Error(err);
        }
        callback(null, true);
      });
    });
  });
};

Sync.prototype.syncBlocks = function (callback) {
  var self = this;
  async.everySeries(this.blocksToSync, function (block, cb) {
    self.syncBlock(block, function (err, result) {
      if (err) {
        cb(err);
        self.node.log.error(`[CC-API] ${err}`);
        return
      }
      cb(null, true)
    })
  }, function (err) {
    if (err) {
      // One of the iterations produced an error.
      // All processing will now stop.
      self.node.log.error(`[CC-API] ${err}`);
      callback(err);
      return
    }

    if (self.node.stopping) {
      self.litecoindSyncing = false;
      callback(null, false);
      return;
    }
    self.node.log.info(`[CC-API] synced ${self.blocksToSync.length} blocks`);
    callback(null);
  });
}

Sync.prototype.start = function(startFrom, callback) {
  var self = this;

  if (self.litecoindSyncing || self.node.stopping) {
    return;
  }
  self.litecoindSyncing = true;

  var currentHeight = self.node.services.bitcoind.height;
  self.node.log.info(`[CC-API] Current height: ${currentHeight}`);

  self.loadTip(function (err, lastBlock) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }
    startFrom = startFrom || (lastBlock && lastBlock.height) || firstColoredBlock;
    for (var i = startFrom; i <= currentHeight; i++) {
      self.blocksToSync.push(i);
    }
    self.node.log.info(`[CC-API] Syncing ${self.blocksToSync.length} Blocks, starting from block ${startFrom}`);
    self.syncBlocks(function (err, result){
      if (callback) {
        callback(null, result);
      }
    })
  });
};

Sync.prototype.stop = function(callback) {
  this.litecoindSyncing = false;
  callback()
};

Sync.prototype.loadTip = function(callback) {
  CCBlock.findOne().sort('-created_at').exec(function (err, lastBlock) {
    if (err) {
      return callback(err);
    }
    callback(null, lastBlock);
  });
};

module.exports = Sync
