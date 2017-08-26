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

const _ = bitcore.deps._;
const $ = bitcore.util.preconditions;
const properties = { network: config.network, returnBuilder: true };
const ccb = new ColoredCoinsBuilder(properties);

const EXP_EIGHT = 1e8;
const INS_RATE = 180;
const OUTS_RATE = 34;
const MINIMUM_FEE = 100000;
const FEE_DIVISOR = 1000;
const ASSETS_LIMIT = 200;
const FEE_TOLERANCE = 10;
const ESTIMATE_FEE_URL = 'http://litecoin.mifiel.co/api/utils/estimatefee?nbBlocks=3';
const MSG_NOT_ENOUGH_FUNDS = 'Not enough funds to make the transaction';
const MSG_NO_INPUTS_ADDRESS = 'The address does not have inputs';
const MSG_MUST_INC_ADDRESS = 'Must include "address"';
const MSG_MUST_INC_ASSET = 'Must include asset';
const MSG_NO_INPUTS_CONFIRMED = 'The address does not have inputs with confirmations';

function TxnHandle(args) {
  this.body = args.body;
  this.type = args.type;
  this.choosenUtxos = [];
  this.utxosIterator = 0;
  this.includeAssets = args.includeAssets;
}

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
  const txnHandle = new TxnHandle({ type: 'issue', includeAssets: false, body });
  this._startBuildTxn(txnHandle, res);
};

AssetController.prototype.buildSendTransaction = function(req, res) {
  const body = JSON.parse(JSON.stringify(req.body));
  const txnHandle = new TxnHandle({ type: 'send', includeAssets: true, body });
  this._startBuildTxn(txnHandle, res);
};

AssetController.prototype.buildBurnTransaction = function(req, res) {
  const body = JSON.parse(JSON.stringify(req.body));
  const txnHandle = new TxnHandle({ type: 'burn', includeAssets: true, body });
  this._startBuildTxn(txnHandle, res);
};

AssetController.prototype._startBuildTxn = function(handle, res) {
  const body = handle.body;
  const includeAssets = handle.includeAssets;

  if (!body.utxos) {
    this._getUtxo(body.address, this.addressController.ccBuilderTransformUtxo)
      .then((utxos) => {
        handle.utxos = [].concat(utxos);
        return this._findUtxosMaxValue(utxos, includeAssets);
      })
      .then((maxUtxo) => {
        body.fee = maxUtxo.value;
        body.utxos = maxUtxo;
        this._evaluateBuildTxn(handle, res);
      })
      .catch((err) => {
        this.common.handleErrors(err, res);
      });
  } else {
    this._evaluateBuildTxn(handle, res);
  }
};

AssetController.prototype._loadBestUtxos = function(handle) {
  return new Promise((resolve, reject) => {
    let valueSum = 0;
    let iterator = handle.utxosIterator;
    const minUtxos = [];

    for (iterator; iterator < handle.utxos.length; iterator += 1) {
      valueSum += handle.utxos[iterator].value;
      minUtxos.push(handle.utxos[iterator]);
      if (valueSum > handle.valueNeeded || iterator === 49) {
        break;
      }
    }

    if (valueSum < handle.valueNeeded) {
      reject({ message: MSG_NOT_ENOUGH_FUNDS });
      return;
    }

    handle.utxosIterator = iterator;

    if (handle.includeAssets){
      this._populateUtxosAssets(minUtxos)
        .then((populated) => {
          handle.choosenUtxos = [].concat(handle.choosenUtxos, populated);
          resolve(handle.choosenUtxos);
        })
        .catch(reject);
    } else {
      handle.choosenUtxos = [].concat(handle.choosenUtxos, minUtxos);
      resolve(handle.choosenUtxos);
    }
  });
};

AssetController.prototype._loadMinimumUtxosCycle = function(handle) {
  let buildResult;
  const body = handle.body;
  const buildFunc = this.ccBuildTypes[handle.type];

  const loadCycle = (resolve, reject) => {
    this._loadBestUtxos(handle)
      .then(() => {
        body.utxos = handle.choosenUtxos;
        buildResult = buildFunc(body);
        const txn = buildResult.txb.tx;

        return this._evaluateInputsValue(body, txn, handle.feeRate);
      })
      .then((result) => {
        if (result.pass) {
          resolve(buildResult);
        } else {
          loadCycle(resolve, reject);
        }
      })
      .catch(reject);
  };

  return new Promise((resolve, reject) => {
    loadCycle(resolve, reject);
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
  const byteSize = (numInputs * INS_RATE) + (numOutputs * OUTS_RATE) + FEE_TOLERANCE;
  const fee = byteSize * (feeRate / FEE_DIVISOR);
  const miningFee = fee >= MINIMUM_FEE ? fee : MINIMUM_FEE;
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

  if (valueCollected >= valueNeeded) {
    return { pass: true, valueNeeded };
  } else {
    return { pass: false, valueNeeded };
  }
};

AssetController.prototype._evaluateBuildTxn = function(handle, res) {
  const buildFunc = this.ccBuildTypes[handle.type];
  try {
    const results = buildFunc(handle.body);
    const txn = results.txb.tx;

    this._fetchEstimateFeeRate()
      .then((feeRate) => {
        const inputsValuePass = this._evaluateInputsValue(handle.body, txn, feeRate);
        handle.feeRate = feeRate;

        if (inputsValuePass.pass) {
          res.jsonp(results);
        } else {
          handle.valueNeeded = inputsValuePass.valueNeeded;
          this._loadMinimumUtxosCycle(handle)
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
  return new Promise((resolve, reject) => {
    request(ESTIMATE_FEE_URL, (err, resEstimate) => {
      if (err) {
        reject(err);
        return;
      }
      const estimateFee = JSON.parse(resEstimate.body)['3'] * EXP_EIGHT;
      resolve(estimateFee);
    });
  });
};

AssetController.prototype._getUtxo = function(address, transform){
  return new Promise((resolve, reject) => {
    if (!address) {
      reject({ message: MSG_MUST_INC_ADDRESS });
      return;
    }

    this.addressController._utxo(address, transform, (err, utxos) => {
      if (err){
        reject(err);
        return;
      }
      if (!utxos || utxos.length <= 0) {
        reject({ message: MSG_NO_INPUTS_ADDRESS });
      } else {
        const utxosConfirmedAndSorted = utxos
          .filter(utxo => utxo.confirmations > 0)
          .sort((a, b) => (a.value < b.value));

        if (utxosConfirmedAndSorted.length <= 0) {
          reject({ message: MSG_NO_INPUTS_CONFIRMED });
        } else {
          resolve(utxosConfirmedAndSorted);
        }
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
      message: MSG_MUST_INC_ASSET,
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
