var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CCBlock = new Schema({
  timestamp: {
    type: Date,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  cc_transactions: {
    type: Array,
    required: false,
    default: []
  }
}, {
  timestamps: {
    createdAt: 'created_at'
  }
});

module.exports = mongoose.model('CCBlock', CCBlock);
