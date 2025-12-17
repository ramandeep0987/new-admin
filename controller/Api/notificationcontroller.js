const notification_model = require('../../model/Admin/notification_model')
const helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');
const user_model = require('../../model/Admin/user_model');

module.exports = {

  change_notification_status: async (req, res) => {
    try {
      const { status } = req.body;

      const updatestatus = await user_model.updateOne(
        { _id: req.user._id },
        { notification_status: req.body.notification_status }
      );
      let updated_notify_status = await user_model.findById({ _id: req.user._id })

      return helper.success(res, "Notification status update successfully", {updated_notify_status});
    } catch (error) {
      console.log(error);
    }
  },
  
  unread_notification_count: async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await notification_model.countDocuments({ receiver: userId, status:0 });


    return helper.success(res, "Unread notification count", { count: unreadCount });

  } catch (error) {
    console.log(error);
  }
  },

  read_notification: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        notificationId: "required",
      });
      
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      
      let notificationId = req.body.notificationId;
      
      const updateStatus = await notification_model.updateOne({ _id: notificationId },
        {isRead: req.body.isRead });

        if (!updateStatus) {
          return helper.failed(res, "Notification not found");
        }

      const updatedStatus = await notification_model.findById({ _id : notificationId });

        return helper.success(res, "Notification readed successfully", {
          updatedNotification: updatedStatus
        });
    } catch (error) {
        console.error(error);
        return helper.failed(res, "Internal server error");
    }
  },

  notificationList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const userId = req.user._id;

      // Calculate the items to skip
      const skip = (page - 1) * perPage;
      const notifications = await notification_model.find({ receiver: userId, type: 3 })
      .populate("sender", "firstname image rating")
      .skip(skip)
      .limit(perPage)
      .sort({createdAt:-1});
  
      const totalNotificationCount = await notification_model.countDocuments(notifications);
      const totalPages = Math.ceil(totalNotificationCount / perPage);

      return helper.success(res, 'Notification list', {notifications,
        page: page,
        perPage: perPage,
        totalNotificationCount: totalNotificationCount,
        totalPages: totalPages});
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },


}