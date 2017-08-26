'use strict';

var program = require('commander');
var config = require('config');

var sync = require('./sync');
var swipe = require('./swipe');

function main(node) {
  program
    .version('0.4.4')

  program
    .command('sync')
    .option('-s, --startBlock', 'Force the block height to start the sync from')
    .description('Syncs ColoredCoins transactions since last sored block')
    .action(function (cmd) {
      var startBlock = typeof cmd === 'string' ? parseInt(cmd) : null
      sync(node, startBlock, function (err, result){
        if (err) {
          throw err;
        }
        console.log('done sync', result);
      });
    });

  program
    .command('swipe')
    .description('Swipe CC Transactions database')
    .action(function () {
      swipe()
    });

  program.parse(process.argv);

  if (process.argv.length === 2) {
    program.help();
  }
}

module.exports = main
