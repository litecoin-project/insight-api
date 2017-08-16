'use strict';

const bitcore = require('litecore-lib');
const lodash = require('lodash');
const async = require('async');
const request = require('request');
const ColoredCoinsBuilder = require('cc-transaction-builder');
const config = require('config');
const TxController = require('./transactions');
const Common = require('./common');
const CCTransaction = require('./models/cc_transaction');
const AddressController = require('./addresses');
const ASSETS_LIMIT = 200;

const _ = bitcore.deps._;
const $ = bitcore.util.preconditions;
const properties = { network: config.network, returnBuilder: true };
const ccb = new ColoredCoinsBuilder(properties);

function AssetController(node) {
  this.node = node;
  this.txController = new TxController(node);
  this.common = new Common({ log: this.node.log });
  this.addressController = new AddressController(node);
}

AssetController.prototype.ccBuildTypes = {
  issue: ccb.buildIssueTransaction,
  burn: ccb.buildBurnTransaction,
  send: ccb.buildSendTransaction,
};

AssetController.prototype.show = function(req, res) {
  const options = {
    noTxList: parseInt(req.query.noTxList),
  };

  if (req.query.from && req.query.to) {
    options.from = parseInt(req.query.from);
    options.to = parseInt(req.query.to);
  }

  this.getAssetSummary(req.asset, options, (err, data) => {
    if(err) {
      this.common.handleErrors(err, res);
      return;
    }

    res.jsonp(data);
  });
};

// List Assets by date
AssetController.prototype.list = function(req, res) {
  let dateStr;
  let isToday;
  const todayStr = this.formatTimestamp(new Date());

  if (req.query.assetDate) {
    dateStr = req.query.assetDate;
    var datePattern = /\d{4}-\d{2}-\d{2}/;
    if(!datePattern.test(dateStr)) {
      this.common.handleErrors(new Error('Please use yyyy-mm-dd format'), res);
      return;
    }

    isToday = dateStr === todayStr;
  } else {
    dateStr = todayStr;
    isToday = true;
  }

  const gte = Math.round((new Date(dateStr)).getTime() / 1000);

  //pagination
  const lte = parseInt(req.query.startTimestamp) || gte + 86400;
  const prev = this.formatTimestamp(new Date((gte - 86400) * 1000));
  const next = lte ? this.formatTimestamp(new Date(lte * 1000)) : null;
  const limit = parseInt(req.query.limit || ASSETS_LIMIT);
  const more = false;
  const moreTimestamp = lte;
  // var date = new Date(1498782037 * 1000).getTime()/1000

  CCTransaction
    .find({ timestamp: { $gte: gte, $lte: lte } })
    .sort('-timestamp')
    .skip(limit)
    .limit(limit)
    .exec((err, assets) => {
      if (err) {
        this.common.handleErrors(err, res);
        return;
      }

      async.mapSeries(
        assets,
        (transaction, next) => {
          this.getAssetSummary(transaction.assetId, next);
        },
        (err, assets) => {
          if (err) {
            this.common.handleErrors(err, res);
            return;
          }

          const data = {
            assets: assets,
            length: assets.length,
          };

          if (more) {
            data.pagination = {
              next,
              prev,
              more,
              isToday,
              currentTs: lte - 1,
              current: dateStr,
              moreTs: moreTimestamp,
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
  this.getAssetSummary(req.asset, {}, (err, data) => {
    if(err) {
      this.common.handleErrors(err, res);
      return;
    }

    res.jsonp(data[param]);
  });
};

AssetController.prototype.buildIssueTransaction = function(req, res) {
  const body = JSON.parse(JSON.stringify(req.body));
  this._startBuildTxn(body, 'issue', false, res);
};

AssetController.prototype.buildSendTransaction = function(req, res) {
  const body = JSON.parse(JSON.stringify(req.body));
  this._startBuildTxn(body, 'send', true, res);
};

AssetController.prototype.buildBurnTransaction = function(req, res) {
  const body = JSON.parse(JSON.stringify(req.body));
  this._startBuildTxn(body, 'burn', true, res);
};

AssetController.prototype._startBuildTxn = function(body, type, includeAssets, res) {
  if (!body.utxos) {
    this._getUtxo(body.address, this.addressController.ccBuilderTransformUtxo)
      .then((utxos) => {
        return this._findUtxosMaxValue(utxos, includeAssets);
      })
      .then((maxUtxo) => {
        body.fee = maxUtxo.value;
        body.utxos = maxUtxo;
        this._evaluateBuildTxn(body, type, includeAssets, res);
      })
      .catch((err) => {
        this.common.handleErrors(err, res);
      });
  } else {
    this._evaluateBuildTxn(body, type, includeAssets, res);
  }
};

AssetController.prototype._loadBestUtxos = function(body, utxos, valueToReach, includeAssets) {
  return new Promise((resolve, reject) => {
    let valueSum = 0;
    const minUtxos = [];

    utxos.sort((a, b) => (a.value < b.value));

    for (let i = 0; i < utxos.length; i += 1) {
      valueSum += utxos[i].value;
      minUtxos.push(utxos[i]);
      if (valueSum > valueToReach || i === 49) {
        break;
      }
    }

    if (valueSum < valueToReach) {
      reject({ message: 'Not enough funds to make the transaction' });
      return;
    }

    if (includeAssets){
      this._populateUtxosAssets(minUtxos)
        .then(resolve)
        .catch(reject);
    } else {
      resolve(minUtxos);
    }
  });
};

AssetController.prototype._loadMinimumUtxosCycle = function(body, valueToReach, feeRate, type, includeAssets) {
  let buildResult;
  const buildFunc = this.ccBuildTypes[type];

  const loadCycle = (utxos, valueNeeded, resolve, reject) => {
    this._loadBestUtxos(body, utxos, valueNeeded, includeAssets)
      .then((bestUtxos) => {
        body.utxos = bestUtxos;
        buildResult = buildFunc(body);
        const txn = buildResult.txb.tx;

        return this._evaluateInputsValue(body, txn, feeRate);
      })
      .then((result) => {
        if (result.pass) {
          resolve(buildResult);
        } else {
          loadCycle(result.valueNeeded);
        }
      })
      .catch(reject);
  };

  return new Promise((resolve, reject) => {
    this._getUtxo(body.address, this.addressController.ccBuilderTransformUtxo)
      .then((utxos) => {
        loadCycle(utxos, valueToReach, resolve, reject);
      })
      .catch(reject);
  });
};

AssetController.prototype._populateUtxosAssets = function(utxos) {
  return new Promise((resolve, reject) => {
    async.eachOf(utxos, (utxo, i, cb) => {
      this.txController._transaction(utxo.txid)
        .then((transaction) => {
          utxos[i].assets = transaction.assets.map(asset => ({
            amount: asset.amount,
            assetId: asset.assetId,
          }));
          cb();
        }).catch(cb);
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(utxos);
      }
    });
  });
};

AssetController.prototype._calculateMiningFee = function(numInputs, numOutputs, feeRate) {
  const byteSize = (numInputs * 180) + (numOutputs * 34) + 10;
  const fee = byteSize * (feeRate / 1000);
  const miningFee = fee >= 100000 ? fee : 100000;
  return miningFee;
};

AssetController.prototype._calculateInputsValue = function(utxos) {
  return utxos.reduce((a, b) => (a + b.value), 0);
};

AssetController.prototype._evaluateInputsValue = function(body, txn, feeRate) {
  const inputs = txn.ins.length;
  const outputs = txn.outs.length;

  const miningFee = this._calculateMiningFee(inputs, outputs, feeRate);
  const valueCollected = this._calculateInputsValue(body.utxos);
  const valueNeeded = miningFee + body.amount;

  if (valueCollected > valueNeeded) {
    return { pass: true, valueNeeded };
  } else {
    return { pass: false, valueNeeded };
  }
};

AssetController.prototype._evaluateBuildTxn = function(body, type, includeAssets, res) {
  const buildFunc = this.ccBuildTypes[type];
  try {
    const results = buildFunc(body);
    const txn = results.txb.tx;

    this._fetchEstimateFeeRate()
      .then((feeRate) => {
        const inputsValuePass = this._evaluateInputsValue(body, txn, feeRate);

        if (inputsValuePass.pass) {
          res.jsonp(results);
        } else {
          this._loadMinimumUtxosCycle(body, inputsValuePass.valueNeeded, feeRate, type, includeAssets)
            .then(res.jsonp)
            .catch((err) => {
              this.common.handleErrors(err, res);
            });
        }
      }).catch((err) => {
        this.common.handleErrors(err,res);
      });
  } catch (err) {
    this.common.handleErrors(err,res);
  }
};

AssetController.prototype._findUtxosMaxValue = function(utxos, includeAssets){
  return new Promise((resolve, reject) => {
    const maxUtxo = [ lodash.max(utxos, 'value') ];
    if (includeAssets){
      this.txController._transaction(maxUtxo[0].txid)
        .then((transaction) => {
          maxUtxo[0].assets = transaction.assets.map(asset => ({
            amount: asset.amount,
            assetId: asset.assetId,
          }));
          resolve(maxUtxo);
        }).catch(reject);
    } else {
      resolve(maxUtxo);
    }
  });
};

AssetController.prototype._assignDefaultFee = function(body) {
  if (!body.fee){
    body.fee = config.default_fee;
  }
};

AssetController.prototype._fetchEstimateFeeRate = function() {
  const estimateFeeUrl = 'http://litecoin.mifiel.co/api/utils/estimatefee?nbBlocks=2,3,4,5,6,7,8,9,10,20,25';
  return new Promise((resolve, reject) => {
    request(estimateFeeUrl, (err, resEstimate) => {
      if (err) {
        reject(err);
        return;
      }
      const estimateFee = JSON.parse(resEstimate.body)['3'] * 1e8;
      resolve(estimateFee);
    });
  });
};

AssetController.prototype._getUtxo = function(address, transform){
  return new Promise((resolve, reject) => {
    if (!address) {
      reject({ message:'Must include "address"' });
      return;
    }

    this.addressController._utxo(address, transform, (err, utxos) => {
      if (err){
        reject(err);
        return;
      }
      if (!utxos || utxos.length <= 0) {
        reject({ message: 'The address does not have inputs' });
      } else {
        resolve(utxos);
      }
    });
  });
};

AssetController.prototype.getAssetSummary = function(asset, options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  $.checkArgument(_.isFunction(callback));
  CCTransaction.find({ assetId: asset }, { _id: false, __v: false }, (err, transactions) => {
    if (err) {
      callback(err);
      return;
    }
    const issueTxs = transactions.filter((tx) => { return tx.type === 'issuance'; });
    const sendTxs = transactions.filter((tx) => { return tx.type === 'send'; });
    const transformed = {
      transactions,
      assetStr: asset,
      issueTransactions: issueTxs,
      sendTransactions: sendTxs,
    };
    callback(null, transformed);
  });
};

AssetController.prototype.saveTransaction = function(req, res) {
  this.txController.checkAndStoreCCTransaction(req.params.txid, (err, cctransaction) => {
    if (err) {
      this.common.handleErrors(err, res);
      return;
    }
    res.jsonp(cctransaction);
  });
};

AssetController.prototype.checkAsset = function(req, res, next) {
  req.asset = req.params.assetid;
  this.check(req, res, next, [ req.asset ]);
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
  if(!assets.length || !assets[0]) {
    this.common.handleErrors({
      message: 'Must include asset',
      code: 1,
    }, res);
  }

  for(let i = 0; i < assets.length; i += 1) {
    try {
      // TODO: Verify that the assets strings are valid
      // var a = new bitcore.Asset(assets[i]);
    } catch(e) {
      this.common.handleErrors({
        message: 'Invalid asset: ' + e.message,
        code: 1,
      }, res);
      return;
    }
  }

  next();
};

AssetController.prototype._getTransformOptions = function(req) {
  return {
    noAsm: parseInt(req.query.noAsm) ? true : false,
    noScriptSig: parseInt(req.query.noScriptSig) ? true : false,
    noSpent: parseInt(req.query.noSpent) ? true : false,
  };
};

AssetController.prototype.multitxs = function(req, res) {
  const options = {
    from: parseInt(req.query.from) || parseInt(req.body.from) || 0,
  };

  options.to = parseInt(req.query.to) || parseInt(req.body.to) || parseInt(options.from) + 10;

  this.node.getAssetHistory(req.assets, options, (err, result) => {
    if(err) {
      this.common.handleErrors(err, res);
      return;
    }

    const transformOptions = this._getTransformOptions(req);

    this.transformAssetHistoryForMultiTxs(result.items, transformOptions, (err, items) => {
      if (err) {
        this.common.handleErrors(err, res);
        return;
      }
      res.jsonp({
        totalItems: result.totalCount,
        from: options.from,
        to: Math.min(options.to, result.totalCount),
        items: items,
      });
    });
  });
};

AssetController.prototype.transformAssetHistoryForMultiTxs = function(txinfos, options, callback) {
  const items = txinfos.map((txinfo) => {
    return txinfo.tx;
  }).filter((value, index) => {
    this.indexOf(value) === index;
  });

  async.map(
    items,
    (item, next) => {
      this.txController.transformTransaction(item, options, next);
    },
    callback
  );
};

module.exports = AssetController;
