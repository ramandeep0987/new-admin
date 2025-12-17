const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({

  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  // availabilityId :{ type: mongoose.Schema.Types.ObjectId, ref: "availability", default: null},
  services: [{
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    hourly_price: { type: String, default: '' }
  }],
  availability: [{
    days: { type: String, default: '' },
    start_time: { type: String, default: '' },
    end_time: { type: String, default: '' }
  }],
  description: {type: String},
  work_photos: [{
    url:{type:String}
  }],
  deleted: {type: Boolean, default: false},
  status: {type: Number, default: 1 },  // 0 for inactive, 1 for active job
}, {timestamps:true});

module.exports = mongoose.model('workerservices', serviceSchema);