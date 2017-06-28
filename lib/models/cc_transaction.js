var mongoose = require('mongoose');

// Columns:
//   - hash
//   - assetId
//   - address
//   - payments
//   - protocol
//   - version
//   - type
//   - lockStatus
//   - aggregationPolicy
//   - divisibility
//   - amount
//   - multiSig

const Schema = mongoose.Schema;
const CCTransaction = new Schema({
  hash: {
    type: String,
    required: true,
  },
  assetId: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  payments: {
    type: Array,
    required: false
  },
  protocol: {
    type: Number,
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  lockStatus: {
    type: Boolean,
    required: true
  },
  aggregationPolicy: {
    type: String,
    required: true
  },
  divisibility: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  multiSig: {
    type: Array,
    required: false
  }
});

module.exports = mongoose.model('CCTransaction', CCTransaction);
