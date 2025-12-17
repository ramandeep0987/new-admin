const mongoose = require('mongoose');

let service_feeSchema = new mongoose.Schema({

  adminId: {type:mongoose.Schema.Types.ObjectId, ref:"user"},
  service_charge: {type: Number, default: 0},
  job_cancellation_fee: {type: Number, default: 0},

}, {timestamps: true});

module.exports = mongoose.model('service_fee', service_feeSchema);