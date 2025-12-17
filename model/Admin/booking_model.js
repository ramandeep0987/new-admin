const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  addressId:{ type: mongoose.Schema.Types.ObjectId, ref: "address", default: null},
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category", default: null },
  SubCategoryId:{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", default: null},
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "workerservices", default: null },
  image: {type:String, default: ''},
  cardId: {type: String, default: ""},
  time: {type: String, default: ""},
  description: {type: String, default: ""},
  date: {type: String, default: ""},
  time: {type: String, default: ""},
  price_per_hours: {type: Number, default: 0},
  total_hours: {type: Number, default: 0},
  total_price: {type: Number, default: 0},
  admin_charges: {type: Number, default: 0},
  isBookingCompleted: {type: Number, default: 0},
  deleted: {type: Boolean, default: false},
  status: {type: String, default: 0 },  // 0 for rejected, 1 applied by user, 2 accepted/upcoming, 3 pending/ongoing, 4 completed

}, {timestamps:true});

module.exports = mongoose.model('request', bookingSchema);