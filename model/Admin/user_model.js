const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    phone: { type: Number, default: "" },
    image: { type: String, default: "" },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    address: { type: String, default: "" },
    locations: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      locationName: { type: String },
      coordinates: {
        type: [Number],
        default: [0, 0], //default coordinates
        required: false,
      },
    },
    country_code: { type: String, default: "" },
    status: { type: Number, default: 1 },
    rating: { type: Number, default: 0 },
    notification_status: {
      type: String,
      enum: ["0", "1"],
      default: "0",
    },
    profile_completed: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },
    google: { type: String }, //social login
    facebook: { type: String }, //social login
    apple: { type: String }, //social login
    socialtype: { type: String, enum: ["0", "1", "2", "3"] },
    otp: { type: Number },
    otpverify: { type: Number, default: 0 },
    constant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    device_type: {
      type: Number,
      required: false,
      enum: [1, 2], //1 for Android, 2 for IOS
    },
    device_token: { type: String },
    token: { type: String },

    loginTime: { type: String },
    stripe_customer: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    role: { type: String, enum: ["0", "1", "2", ""], default: "" }, //0 for Admin, 1 for user, 2 for Worker

    Iscomplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("user", UserSchema);
