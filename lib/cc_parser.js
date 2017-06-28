var CCTransaction = require('cc-transaction');
var assetIdEncoder = require('cc-assetid-encoder');

var checkVersion = function (hex) {
  var version = hex.toString('hex').substring(0, 4);
  return (version.toLowerCase() === '4343');
};

var parseTransaction = function (transaction) {
  var result = [];
  transaction.vout.forEach(function (output) {
    var coloredData = parseOutput(transaction, output.n)
    if (coloredData !== null) {
      result.push(coloredData);
    }
  });
  return result;
};

var parseOutput = function (transaction, n) {
  var output = transaction.vout[n]
  if (!output.scriptPubKey || !output.scriptPubKey.type === 'nulldata') return null;
  var coloredData = null
  var hex = output.scriptPubKey.asm.substring('OP_RETURN '.length);
  if (checkVersion(hex)) {
    try {
      coloredData = CCTransaction.fromHex(hex).toJson();
    } catch (e) {
      console.error('Invalid CC transaction.');
    }
  }
  // Add assetId
  if (coloredData) {
    try {
      var tx = transaction;
      tx.ccdata = [coloredData];
      coloredData.assetId = assetIdEncoder(tx);
    } catch (e) {
      if (e.message === 'Not An issuance transaction') {
        // coloredData.assetId = GET ASSET SOME HOW
      }
    }
  }
  return coloredData;
}

module.exports = {
  parseTransaction: parseTransaction,
  parseOutput: parseOutput
};
