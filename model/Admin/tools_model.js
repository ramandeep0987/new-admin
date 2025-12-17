const mongoose = require('mongoose');

const toolsSchema = new mongoose.Schema({

  tool_name: {type: String},
  status: {type: Number, default:1 },
  deleted: {type: Boolean, default: false},

}, {timestamps:true});

module.exports = mongoose.model('tools', toolsSchema);