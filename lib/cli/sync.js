'use strict';

var chalk = require('chalk');
var config = require('config');
var mongoose = require('mongoose');
var async = require('async');

var TxController = require('../transactions');
var BlockController = require('../blocks');
var CCBlock = require('../models/cc_block');

var firstColoredBlock = config.firstColoredBlock;


function Sync(node, startFrom) {
  this.node = node;
  // fake the log and services for now
  this.node.log = {
    info: function(log){ console.log(log); },
    error: function(log){ console.error(chalk.cyan(log)); }
  };
  this.node.services = {
    bitcoind: node
  };
  this.startFrom = startFrom;
  this.ok = true;
  this.blocksToSync = [];
  this.txController = new TxController(this.node);
}

Sync.prototype.syncBlock = function(blockHeight, callback) {
  console.log(chalk.cyan(`searching cc transactions in block ${blockHeight}`));
  var self = this;
  var count = 0;
  this.node.getBlock(parseInt(blockHeight), function(err, block) {
    if (err) {
      return callback(err.message);
    }
    var ccTransactions = [];
    console.log(chalk.cyan(`got block ${blockHeight} with ${block.transactions.length} txs`))
    async.everySeries(block.transactions, function (tx, cb) {
      count = count + 1;
      self.txController.checkAndStoreCCTransaction(tx.hash, function (err, cctransaction) {
        if (err) {
          cb(new Error(err));
          return
        }
        if (cctransaction) {
          console.log(chalk.blue(`found cc transaction hash ${tx.hash}`))
          ccTransactions.push(cctransaction);
        }
        cb(null, true);
      });
    }, function (err) {
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.
        console.error(chalk.red(err));
        callback(err);
        return
      }

      console.log(chalk.green(`synced block ${blockHeight} with ${ccTransactions.length} cc transactions`));
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

Sync.prototype.syncBlocks = function (blocks, callback) {
  var self = this;
  async.everySeries(blocks, function (block, cb) {
    self.syncBlock(block, function (err, result) {
      if (err) {
        cb(err);
        console.log(err)
        return
      }
      cb(null, true)
    })
  }, function (err) {
    if (err) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.error(chalk.red(err));
      callback(err);
      return
    }
    console.log(chalk.bold.green(`synced ${blocks.length} blocks`));
    callback(null);
  });
}

Sync.prototype.start = function(callback) {
  var self = this;
  var currentHeight = self.node.getInfo(function (err, info) {
    var currentHeight = info.blocks
    console.log(chalk.cyan(`Current height: ${currentHeight}`));

    CCBlock.findOne().sort('-created_at').exec(function (err, lastBlock) {
      if (err) {
        return callback(err);
      }
      self.startFrom =  self.startFrom || (lastBlock && lastBlock.height) || firstColoredBlock;
      for (var i = self.startFrom; i <= currentHeight; i++) {
        self.blocksToSync.push(i);
      }
      console.log(chalk.cyan(`Syncing ${self.blocksToSync.length} Blocks, starting from block ${self.startFrom}`));
      self.syncBlocks(self.blocksToSync, function (err, result){
        mongoose.connection.close();
        callback(null, result);
      })
    });
  });
};

function sync(node, startFrom, callback) {
  require('../db')
  var sync = new Sync(node, startFrom);
  sync.start(callback);
}

module.exports = sync
