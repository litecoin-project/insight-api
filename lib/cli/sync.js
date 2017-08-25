'use strict';

var config = require('config');
var Sync = require('../sync');
var DB = require('../db');

var firstColoredBlock = config.firstColoredBlock;

function sync(node, startFrom, callback) {
  var store = new DB(node);
  store.connect();

  node.getInfo(function (err, info) {
    if (err) {
      throw new Error(err.message);
    }
    // simulate `node.services.bitcoind.height`
    node.height = info.blocks

    // fake the log and services for the cli
    node.log = {
      info: function(log){ console.log(log); },
      error: function(log){ console.error(chalk.cyan(log)); }
    };
    node.services = {
      bitcoind: node
    };
    var sync = new Sync(node);
    sync.start(startFrom, function (err, result){
      store.close();
      callback(err, result);
    });
  });
}

module.exports = sync
