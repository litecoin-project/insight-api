var CCTransaction = require('cc-transaction');
var assetIdEncoder = require('cc-assetid-encoder');

var CCParser = function(node) {
  this.node = node
}

CCParser.prototype.checkVersion = function (hex) {
  var version = hex.toString('hex').substring(0, 4);
  return (version.toLowerCase() === '4343');
};

CCParser.prototype.parseTransaction = function (transaction) {
  var result = [];
  var self = this;
  transaction.vout.forEach(function (output) {
    var coloredData = self.parseOutput(transaction, output.n)
    if (coloredData !== null) {
      result.push(coloredData);
    }
  });
  return result;
};

CCParser.prototype.parseOutput = function (transaction, n) {
  var output = transaction.vout[n]
  if (!output.scriptPubKey || !output.scriptPubKey.type === 'nulldata') return null;
  var coloredData = null
  var hex = output.scriptPubKey.asm.substring('OP_RETURN '.length);
  if (this.checkVersion(hex)) {
    try {
      coloredData = CCTransaction.fromHex(hex).toJson();
    } catch (e) {
      this.node.log.error('Invalid CC transaction.');
    }
  }
  // Add assetId
  if (coloredData) {
    try {
      var tx = transaction;
      tx.ccdata = [coloredData];
      coloredData.assetId = assetIdEncoder(tx);
      this.node.log.info('Found valid CC transaction. AssetId:', assetId);
    } catch (e) {
      if (e.message === 'Not An issuance transaction') {
        // coloredData.assetId = GET ASSET SOME HOW
      }
    }
  }
  return coloredData;
}

module.exports = CCParser;
