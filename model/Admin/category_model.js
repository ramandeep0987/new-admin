const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

  name: { type: String },
  
  mrdnumber: { type: String },
  date: { type: String },
  number: { type: String },
  doctorname: { type: String },

   services: {
    type: String,
   
  },
 facilities: {
    type: String,
    
  },


  Suggestion: { type: String },

  abhaid:{type:String},

  
  
 

  deleted: {type: Boolean, default: false},

}, {timestamps:true});

module.exports = mongoose.model('category', categorySchema);