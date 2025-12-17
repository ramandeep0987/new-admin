const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({

  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "user"},
  workerId:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null},
  servicefee: {type: mongoose.Schema.Types.ObjectId, ref: "service_fee", default: "658bdabbc509afc52a3e028b"},
  job_title: {type: String},
  address:{ type: mongoose.Schema.Types.ObjectId, ref: "address"},
  categoryId:{ type: mongoose.Schema.Types.ObjectId, ref: "category"},
  price: {type: String, default: ''},
  time: {type: String},
  description: {type: String},
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
  deleted: {type: Boolean, default: false},
  job_status: {type: String, default: 0},  // 1 applied by user, 2 accepted, 3 rejected, 4 going, 5 completed 
  status: {type: Number, default: 1 },  // 0 for inactive, 1 for active job
  transectionId: {type: String, default:"" }, 
  transectionStatus: {type: String, default:"" }, 
}, {timestamps:true});

module.exports = mongoose.model('job', jobSchema);