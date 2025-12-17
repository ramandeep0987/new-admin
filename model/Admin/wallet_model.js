const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: "bank", default: null},
  amount: {type: String},
  payment_status: {type: String, default: "1"},  //1 for pending, 2 for approved, 3 for Rejected
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('wallet', walletSchema);