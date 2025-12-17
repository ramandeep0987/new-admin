const mongoose = require('mongoose');

const contactusSchema = new mongoose.Schema({

  name: {type: String, default: ''},
  email: {type: String,  default: ''},
  phone: {type: Number},
  country_code: {type: String,  default: ''},
  message: {type: String,  default: ''},
  date: {
    type: Date,
    default: Date.now
  },
  
}, {timestamps:true});

module.exports = mongoose.model('contactus', contactusSchema);