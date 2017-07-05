'use strict';

var bitcore = require('litecore-lib');
var config = require('config');
var mongoose = require('mongoose');
var fs = require('fs');
var mkdirp = require('mkdirp');
var Networks = bitcore.Networks;
var $ = bitcore.util.preconditions;

mongoose.Promise = require('bluebird');
const port = process.env.PORT || config.PORT;
const db = mongoose.connection;

function DB(node) {
  this.node = node;
  this._setDataPath();
}

DB.prototype.connect = function() {
  if (this.createDataPath && !fs.existsSync(this.dataPath)) {
    mkdirp.sync(this.dataPath);
  }
  // for testing to work
  if (mongoose.connection.readyState === 0) {
    const dbOptions = {
      server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
      replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    };

    mongoose.connect(config.DBHost, dbOptions);
  }

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.info(`Connected to DB @ ${config.DBHost}`);
  });
};

DB.prototype.close = function(callback) {
  mongoose.connection.close(callback);
};

DB.prototype._setDataPath = function() {
  this.createDataPath = false;
  if (!this.node.services || this.node.services.bitcoind) {
    return
  }
  $.checkState(this.node.services.bitcoind.spawn.datadir, 'bitcoind is expected to have a "spawn.datadir" property');
  var datadir = this.node.services.bitcoind.spawn.datadir;
  if (this.node.network === Networks.livenet) {
    this.dataPath = datadir + '/bitcore-cc';
    this.createDataPath = true;
  } else if (this.node.network === Networks.testnet) {
    if (this.node.network.regtestEnabled) {
      this.dataPath = datadir + '/regtest/bitcore-cc';
    } else {
      this.dataPath = datadir + '/testnet4/bitcore-cc';
    }
    this.createDataPath = true;
  } else {
    throw new Error('Unknown network: ' + this.network);
  }
};

module.exports = DB
