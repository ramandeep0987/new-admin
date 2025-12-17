const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  bookingId:{ type: mongoose.Schema.Types.ObjectId, ref: "booking", default: null},
  transactionId: {type: String, default: ''},
  admin_charges: {type: String, default: ''},
  total_amount: {type: String, default: ''},  // including admin amount + actual amount
  actual_amount: {type: String, default: ''},  // actual booking amount,
  payment_status:{type:String,default:''},
  refundId:{type:String,default:''},
  transaction_status: {
    type: Number,
    enum: [0, 1 ], // 
    default: 0 },

}, {timestamps: true});

module.exports = mongoose.model( 'transaction', transactionSchema );