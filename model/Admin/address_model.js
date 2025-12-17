const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  address: {type: String, default: ""},
  houseNo: {type: String, default: ""},
  state: {type: String, default: ""},
  city: {type: String, default: ""}, 
  country: {type: String, default: ""}, 
  zipcode: {type: String, default: ""},
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false
    },
    coordinates: {
      type: [Number],
      default: [0,0],   //default coordinates
      required: false,
    }
},
  status: {type: Number, default:1 },
  deleted: {type: Boolean, default: false},
  
}, {timestamps:true});

module.exports = mongoose.model('address', addressSchema);