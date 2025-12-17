let user_model = require("../../model/Admin/user_model");
let category_model = require("../../model/Admin/category_model");
let SubCategory = require("../../model/Admin/subcategory_model");
const notification_model = require("../../model/Admin/notification_model");
let helper = require("../../Helper/helper");
const { Validator } = require("node-input-validator");
const review_model = require("../../model/Admin/review_model");
const job_request = require("../../model/Admin/job_request");
const cardmodel = require("../../model/Admin/cardmodel");
const serviceModel = require("../../model/Admin/workerServices_model");
let bankmodel = require("../../model/Admin/bankmodel");
const mongoose = require("mongoose");

module.exports = {
  subcategory_list: async (req, res) => {
    try {
      var id = new mongoose.Types.ObjectId(req.query.categoryId);
      
      const profiledetail = await SubCategory.find({
        categoryId: id,
      });

      if (!profiledetail) {
        return helper.error(res, "User not found");
      }

      return helper.success(res, "User Profile", {
        profiledetail: profiledetail,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
