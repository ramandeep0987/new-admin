let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');
const workerServices_model = require('../../model/Admin/workerServices_model');
const moment = require("moment");
const notification_model = require('../../model/Admin/notification_model');

module.exports = { 

  category_list: async(req, res)=> { 
    try {
      let userId = req.user;
      let categoryList = await category_model.find({deleted:false, status:1})
      if (!categoryList) {
        return helper.failed(res, "Something went wrong");    
      }
      const notificationpending = await notification_model.find({receiver: userId, isRead:"0"})
      let pendingNotifications = notificationpending.length > 0;
     
        return helper.success(res, "Category list",{ categoryList, pendingNotifications } );
    } catch (error) {
        console.log(error)
    }
  },

}