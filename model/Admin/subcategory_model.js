const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    name: { type: String },

    image: { type: String },
    status: { type: Number, default: 1 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    deleted: { type: Boolean, default: false },
  },

  { timestamps: true }
);

module.exports = mongoose.model("SubCategory", SubCategorySchema);
