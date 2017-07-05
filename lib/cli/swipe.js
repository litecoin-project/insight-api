'use strict';

var chalk = require('chalk');
var mongoose = require('mongoose');
var CCTransaction = require('../models/cc_transaction');
var CCBlock = require('../models/cc_block');
var DB = require('../db');

function swipe() {
  console.log(chalk.red('swiping db...'));
  var db = new DB({})
  db.connect();
  CCBlock.remove({}, function (){
    CCTransaction.remove({}, function (){
      console.log(chalk.green('DB swiped'));
      mongoose.connection.close();
    });
  });
}

module.exports = swipe
