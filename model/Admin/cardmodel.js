const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  card_holder_name: {type: String, default: ""},
  card_number: { type: Number, default: "" },
  expiry_date: { type:String },
  cvv:{type:String},
  cardToken: {type: String, default: ""},
  deleted: {type: Boolean, default: false},
  card_token:{type: String,default:""},
}, {timestamps:true});

module.exports = mongoose.model('card', cardSchema);