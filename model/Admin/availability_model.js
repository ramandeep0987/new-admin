const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  // categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category"},
  days: {type: String, default: ""},
  start_time: {type: String, default: ""}, 
  end_time: {type: String, default: ""}, 
  status: {type: Number, default:1 },
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('availability', availabilitySchema);