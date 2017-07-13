'use strict';

var bitcore = require('litecore-lib');
var async = require('async');
var TxController = require('./transactions');
var Common = require('./common');
var CCTransaction = require('./models/cc_transaction');
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var ColoredCoinsBuilder=require('cc-transaction-builder');
var AddressController=require('./addresses');
var ASSETS_LIMIT = 200;
 

function AssetController(node) {
  this.node = node;
  this.txController = new TxController(node);
  this.common = new Common({log: this.node.log});
  this.addressController=new AddressController(node);
}

AssetController.prototype.show = function(req, res) {
  var self = this;
  var options = {
    noTxList: parseInt(req.query.noTxList)
  };

  if (req.query.from && req.query.to) {
    options.from = parseInt(req.query.from);
    options.to = parseInt(req.query.to);
  }

  this.getAssetSummary(req.asset, options, function(err, data) {
    if(err) {
      return self.common.handleErrors(err, res);
    }

    res.jsonp(data);
  });
};

// List Assets by date
AssetController.prototype.list = function(req, res) {
  var self = this;

  var dateStr;
  var todayStr = this.formatTimestamp(new Date());
  var isToday;

  if (req.query.assetDate) {
    dateStr = req.query.assetDate;
    var datePattern = /\d{4}-\d{2}-\d{2}/;
    if(!datePattern.test(dateStr)) {
      return self.common.handleErrors(new Error('Please use yyyy-mm-dd format'), res);
    }

    isToday = dateStr === todayStr;
  } else {
    dateStr = todayStr;
    isToday = true;
  }

  var gte = Math.round((new Date(dateStr)).getTime() / 1000);

  //pagination
  var lte = parseInt(req.query.startTimestamp) || gte + 86400;
  var prev = this.formatTimestamp(new Date((gte - 86400) * 1000));
  var next = lte ? this.formatTimestamp(new Date(lte * 1000)) : null;
  var limit = parseInt(req.query.limit || ASSETS_LIMIT);
  var more = false;
  var moreTimestamp = lte;
  var date = new Date(1498782037 * 1000).getTime()/1000

  CCTransaction
    .find({timestamp: { $gte: gte, $lte: lte }})
    .sort('-timestamp')
    .skip(limit)
    .limit(limit)
    .exec(function(err, assets) {
      if (err) {
        return self.common.handleErrors(err, res);
      }

      async.mapSeries(
        assets,
        function(transaction, next) {
          self.getAssetSummary(transaction.assetId, next);
        },
        function(err, assets) {
          if (err) {
            return self.common.handleErrors(err, res);
          }

          var data = {
            assets: assets,
            length: assets.length
          };

          if (more) {
            data.pagination = {
              next: next,
              prev: prev,
              currentTs: lte - 1,
              current: dateStr,
              isToday: isToday,
              more: more,
              moreTs: moreTimestamp
            };
          }

          res.jsonp(data);
        }
      );
    });
};

//helper to convert timestamps to yyyy-mm-dd format
AssetController.prototype.formatTimestamp = function(date) {
  var yyyy = date.getUTCFullYear().toString();
  var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
  var dd = date.getUTCDate().toString();

  return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
};

AssetController.prototype.balance = function(req, res) {
  this.assetSummarySubQuery(req, res, 'balanceSat');
};

AssetController.prototype.totalReceived = function(req, res) {
  this.assetSummarySubQuery(req, res, 'totalReceivedSat');
};

AssetController.prototype.totalSent = function(req, res) {
  this.assetSummarySubQuery(req, res, 'totalSentSat');
};

AssetController.prototype.unconfirmedBalance = function(req, res) {
  this.assetSummarySubQuery(req, res, 'unconfirmedBalanceSat');
};

AssetController.prototype.assetSummarySubQuery = function(req, res, param) {
  var self = this;
  this.getAssetSummary(req.asset, {}, function(err, data) {
    if(err) {
      return self.common.handleErrors(err, res);
    }

    res.jsonp(data[param]);
  });
};

AssetController.prototype.buildIssueTransaction=function(req,res){
  var self = this; 
  var body=JSON.parse(JSON.stringify(req.body));
   
  if (!body.fee){
    var config = require('config');
    body.fee=config.default_fee;
  }

  if (!body.utxos){ 
      if (!body.address){
        return self.common.handleErrors(
               {message:'Must include "address"'},res);
       }
      self.addressController._utxo(body.address, function (err, utxos) {
          if (utxos==undefined || utxos.length<=0){
             return self.common.handleErrors(
                {message:'The address does not have inputs'},res);
           }
          body.utxos=utxos;
          self._buildIssueTransaction(body,res);
      });
    }else{
       self._buildIssueTransaction(body,res); 
    } 
}

AssetController.prototype._buildIssueTransaction=function(body,res){
   var self = this;
   try {
      var properties={network:'litecoin-testnet'};
      var ccb = new ColoredCoinsBuilder(properties); 
      var results = ccb.buildIssueTransaction(body);
      res.jsonp(results); 
    } catch (err) { 
      return self.common.handleErrors(err,res);
  }
}

AssetController.prototype.getAssetSummary = function(asset, options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  $.checkArgument(_.isFunction(callback));
  CCTransaction.find({assetId: asset}, { _id: false, __v: false }, function (err, transactions) {
    if (err) {
      return callback(err);
    }
    var issueTxs = transactions.filter(function (tx) { return tx.type === 'issuance' });
    var sendTxs = transactions.filter(function (tx) { return tx.type === 'send' });
    var transformed = {
      assetStr: asset,
      transactions: transactions,
      issueTransactions: issueTxs,
      sendTransactions: sendTxs,
    };
    callback(null, transformed);
  });
};

AssetController.prototype.saveTransaction = function(req, res, next) {
  var self = this;
  this.txController.checkAndStoreCCTransaction(req.params.txid, function (err, cctransaction) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(cctransaction);
  });
};

AssetController.prototype.checkAsset = function(req, res, next) {
  req.asset = req.params.assetid;
  this.check(req, res, next, [req.asset]);
};

AssetController.prototype.checkAssets = function(req, res, next) {
  if (req.body.assets) {
    req.assets = req.body.assets.split(',');
  } else {
    req.assets = req.params.assets.split(',');
  }

  this.check(req, res, next, req.assets);
};

AssetController.prototype.check = function(req, res, next, assets) {
  var self = this;
  if(!assets.length || !assets[0]) {
    return self.common.handleErrors({
      message: 'Must include asset',
      code: 1
    }, res);
  }

  for(var i = 0; i < assets.length; i++) {
    try {
      // TODO: Verify that the assets strings are valid
      // var a = new bitcore.Asset(assets[i]);
    } catch(e) {
      return self.common.handleErrors({
        message: 'Invalid asset: ' + e.message,
        code: 1
      }, res);
    }
  }

  next();
};

AssetController.prototype._getTransformOptions = function(req) {
  return {
    noAsm: parseInt(req.query.noAsm) ? true : false,
    noScriptSig: parseInt(req.query.noScriptSig) ? true : false,
    noSpent: parseInt(req.query.noSpent) ? true : false
  };
};

AssetController.prototype.multitxs = function(req, res, next) {
  var self = this;

  var options = {
    from: parseInt(req.query.from) || parseInt(req.body.from) || 0
  };

  options.to = parseInt(req.query.to) || parseInt(req.body.to) || parseInt(options.from) + 10;

  self.node.getAssetHistory(req.assets, options, function(err, result) {
    if(err) {
      return self.common.handleErrors(err, res);
    }

    var transformOptions = self._getTransformOptions(req);

    self.transformAssetHistoryForMultiTxs(result.items, transformOptions, function(err, items) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        totalItems: result.totalCount,
        from: options.from,
        to: Math.min(options.to, result.totalCount),
        items: items
      });
    });

  });
};

AssetController.prototype.transformAssetHistoryForMultiTxs = function(txinfos, options, callback) {
  var self = this;

  var items = txinfos.map(function(txinfo) {
    return txinfo.tx;
  }).filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });

  async.map(
    items,
    function(item, next) {
      self.txController.transformTransaction(item, options, next);
    },
    callback
  );
};

module.exports = AssetController;
