const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  account_holder_name: {type: String, default: ""},
  bank_name: {type: String, default: ""},
  account_number: {type: String, default: ""},
  IFSC: {type: String, default: ""},
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('bank', bankSchema);