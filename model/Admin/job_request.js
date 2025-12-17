let mongoose = require('mongoose');

const jobrequestSchema = new mongoose.Schema({
    // review: { type: mongoose.Schema.Types.ObjectId, ref: "review"},
    // categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category"},
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "workerservices"},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
    message: { type: String, default: ''},
    status: {type: String, default: 1 }, // 1 applied by worker/pending, 2 accepted, 3 on going, 4 rejected by user, 5 cancel by worked, 6 completed by worker, 7 edned by worker
    deleted: {type: Boolean, default: false},
},
{timestamps: true});

module.exports = mongoose.model('jobrequest', jobrequestSchema);