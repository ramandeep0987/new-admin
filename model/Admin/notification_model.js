let mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: "booking", default: null},
    message: {type: String, default: ""},
    type: {type: Number, default: "1"},
    isRead: {type: String, default:"0"},    // 0 for unread, 1 for read.
    status: {type:Number, default: 1},      // 0 for off, 1 for onn
},
    {timestamps: true});

module.exports = mongoose.model('notification', notificationSchema);