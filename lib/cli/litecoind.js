'use strict';

var methods = {
  isSynced: '',
  syncPercentage: '',
  getAddressBalance: '',
  getAddressUnspentOutputs: '',
  getAddressTxids: '',
  getAddressHistory: '',
  getAddressSummary: '',
  getRawBlock: '',
  getBlockOverview: '',
  getBlock: '',
  getBlockHashesByTimestamp: '',
  getBlockHeader: '',
  estimateFee: '',
  sendTransaction: '',
  getRawTransaction: '',
  getTransaction: '',
  getDetailedTransaction: '',
  getBestBlockHash: '',
  getSpentInfo: '',
  getInfo: '',
  generateBlock: '',
  stop: ''
};

var slice = function(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
};

function generateMethods(constructor, apiCalls) {

  function createMethod(methodName, argMap) {
    return function() {
      var limit = arguments.length - 1;

      for (var i = 0; i < limit; i++) {
        if (argMap[i]) {
          arguments[i] = argMap[i](arguments[i]);
        }
      }

      var params = slice(arguments, 0, arguments.length - 1)
      var callback = arguments[arguments.length - 1]
      this.call(methodName, params, callback)
    };
  };

  var types = {
    str: function(arg) {
      return arg.toString();
    },
    int: function(arg) {
      return parseFloat(arg);
    },
    float: function(arg) {
      return parseFloat(arg);
    },
    bool: function(arg) {
      return (arg === true || arg == '1' || arg == 'true' || arg.toString().toLowerCase() == 'true');
    },
    obj: function(arg) {
      if(typeof arg === 'string') {
        return JSON.parse(arg);
      }
      return arg;
    }
  };

  for(var k in apiCalls) {
    var spec = apiCalls[k].split(' ');
    for (var i = 0; i < spec.length; i++) {
      if(types[spec[i]]) {
        spec[i] = types[spec[i]];
      } else {
        spec[i] = types.str;
      }
    }
    var methodName = k;
    constructor.prototype[k] = createMethod(methodName, spec);
    constructor.prototype[methodName] = constructor.prototype[k];
  }
}

var Litecoind = function (node, options) {
  if (!options) {
    options = {};
  }
  this.options = {
    protocol: options.protocol || 'http',
    host: options.host || 'localhost',
    port: options.port || '3001'
  }
  this.callMethod = node.scaffold.callMethod;
}

Litecoind.prototype.call = function(methodName, params, callback) {
  this.callMethod(this.options, methodName, params, callback);
}

function litecoind() {
  generateMethods(Litecoind, methods);
  return Litecoind
}

module.exports = litecoind
