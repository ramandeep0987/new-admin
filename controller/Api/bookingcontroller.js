let helper = require("../../Helper/helper");
const { Validator } = require("node-input-validator");
const user_model = require("../../model/Admin/user_model");
const booking_model = require("../../model/Admin/booking_model");
const notification_model = require("../../model/Admin/notification_model");
const socket = require("socket.io");
const socketuser = require("../../model/socket/socketusers");
const review_model = require("../../model/Admin/review_model");
const moment = require("moment");
var cron = require("node-cron");
const stripe = require("stripe")(process.env.SECRETKEY);
const adminFee = require('../../model/Admin/service_fee_model')
const serviceModel = require("../../model/Admin/workerServices_model");
const transactionModel = require("../../model/Admin/transaction_model");

const pushCroneHandler = async () => {
  try {
    let bookingData = await booking_model
      .find({ deleted: false, isBookingCompleted: 1, status: "1" })
      .populate("userId", "firstname")
      .populate("workerId", "firstname")
      .populate("categoryId", "name");

    for (let i = 0; i < bookingData.length; i++) {
      const { _id, createdAt, duration, duration_type, userId, device_token, status,
      } = bookingData[i];

      // Calculate the time difference in milliseconds
      const currentTime = new Date();
      const bookingTime = new Date(createdAt);
      const timeDifference = currentTime - bookingTime;

      if (status !== "2" && timeDifference >= 48 * 60 * 60 * 1000) {
        // If booking is not accepted within 48 hours, delete it
        const deletedjob = await booking_model
          .findOneAndUpdate({ _id }, { deleted: true })
          .populate("userId", "firstname device_token")
          .populate("categoryId", "name");

        if (deletedjob) {
          const payLoad = {
            receiver_name: deletedjob.userId.firstname,
            device_token: deletedjob.userId.device_token,
            message: `${deletedjob.categoryId.name} booking has been deleted due to provider not available`,
            type: 4,
          };
          await helper.pushNotificationForExceeding5mints(payLoad);
        }
      }
    }
  } catch (error) {
    console.log("crone erro =============>", error);
  }
};

//Schedule a task to run every hour
cron.schedule("* * * * *", async () => {
  // console.log("running a task every 30 sec");
  pushCroneHandler();
  return;
});

module.exports = {
  delete_service_request: async (req, res) => {
    try {
      let RequestId = req.body.RequestId;
      let removeRequest = await booking_model.findByIdAndUpdate(
        { _id: RequestId },
        { deleted: true }
      );

      if (!removeRequest) {
        return helper.failed(res, "job not found.");
      }
      let removedRequest = await booking_model.findOne({ _id: RequestId });
      return helper.success(res, "job deleted successfully.", removedRequest);
    } catch (error) {
      console.log(error);
    }
  },

  booking_details: async (req, res) => {
    try {
      const currentUser = req?.user;
      const v = new Validator(req.body, {
        bookingId: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      const bookingDetails = await booking_model
        .findById({ _id: req.body.bookingId })
        .populate("userId", "firstname image")
        .populate("workerId", "firstname image rating address")
        .populate("categoryId", "name")
        .populate("addressId", " houseNo address location")

        const findRatingOnThisJob = await review_model.findOne({
          bookingId: req.body.bookingId,
          userId: req.user,
        });
        const stripeCustemer = currentUser?.stripe_customer;
       
        let defaultCard ;
        const userDefaultCard = await helper.stripePayment.card.getAllCard(
          stripeCustemer
        );

        for (let c = 0; c <userDefaultCard.data.length; c++) {
          const { id } = userDefaultCard?.data[c];
         
          if (bookingDetails.cardId == id) {
            defaultCard = userDefaultCard?.data[c]
            break;
          }
        } 
      if (req.user.role == "1") {
        return helper.success(res, "Booking details", {
          bookingDetail: bookingDetails,
          isRating: !!findRatingOnThisJob,
          defaultCard,
        });
      } else {
        return helper.success(res, "Booking details", {
          bookingDetail: bookingDetails,
          defaultCard,
        });
      }
    } catch (error) {
      console.log("error =========>", error);
      return helper.failed(res, "Internal server error.", error);
    }
  },

  // booking list for user side
  booking_list: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const userId = req.user._id;
      const status = parseInt(req.query.status);

      const filter = { userId: userId, isBookingCompleted: 1, deleted: false };
      if (status !== undefined) {
        if (status === 4) {
          filter.status = { $in: [0, 4] };
        } else {
          filter.status = status;
        }
      }
      if (req.query.date) {
        filter.date = req.query.date;
      }

      // Calculate the items to skip
      const skip = (page - 1) * perPage;
      const projectionFields = "firstname image address rating";
      const jobsData = await booking_model
        .find(filter)
        .populate("categoryId", "name image")
        .populate("workerId", "firstname image rating address")
        .populate("addressId", "address houseNo")
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalBookingCount = await booking_model.countDocuments(filter);
      const totalPages = Math.ceil(totalBookingCount / perPage);

      if (!jobsData) {
        return helper.failed(res, "Bookings not found.");
      }

      return helper.success(res, "Booking listing", {
        jobsData,
        page: page,
        perPage: perPage,
        totalBookingCount: totalBookingCount,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error");
    }
  },

  // booking list for worker side
  worker_booking_list: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const workerId = req.user._id;
      const status = parseInt(req.query.status);

      const filter = {
        workerId: workerId,
        isBookingCompleted: 1,
        deleted: false,
      };

      if (status !== undefined) {
        if (status === 4) {
          filter.status = { $in: [0, 4] };
        } else {
          filter.status = status;
        }
      }
      if (req.query.date) {
        filter.date = req.query.date;
      }

      // Calculate the items to skip
      const skip = (page - 1) * perPage;
      const jobsData = await booking_model
        .find(filter)
        .populate("categoryId", "name image")
        .populate("userId", "firstname image address")
        .populate("addressId", "address")
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalBookingCount = await booking_model.countDocuments(filter);
      const totalPages = Math.ceil(totalBookingCount / perPage);

      if (!jobsData) {
        return helper.failed(res, "No booking found.", []);
      }

      return helper.success(res, "Booking list.", {
        jobsData,
        page: page,
        perPage: perPage,
        totalBookingCount: totalBookingCount,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error.");
    }
  },

  post_booking_request: (io) => async (req, res) => {
    try {
      const userId = req.user._id;
      const status = 1;
      let sendPushNotification = false;
      let createBooking;

      if (req.body.bookingId) {
        // Only update the fields that need to be updated
        const updateFields = { ...req.body };
        delete updateFields.bookingId; // Remove bookingId from update fields

        if (req.body.date) {
          const providedDate = moment(req.body.date, "DD-MM-YYYY");

          // Check worker availability for the provided date
          const workerAvailability = await serviceModel.findOne({
            workerId: req.body.workerId,
            "availability.days": providedDate.format("ddd"),
            deleted: false,
          });

          if (!workerAvailability) {
            return helper.failed(res, "Provider not available on this date.");
          }
        }
        // Calculate total price if total_hours or price_per_hours is provided
        if (req.body.total_hours || req.body.price_per_hours) {
          updateFields.total_price = Number(req.body.price_per_hours) * Number(req.body.total_hours);
        }

        createBooking = await booking_model.findByIdAndUpdate(
          { _id: req.body.bookingId },
          { $set: updateFields }, // Use $set to only update specified fields
          { new: true }
        );

        // Check if isBookingCompleted is set to 1 to send push notification
        if (req.body.isBookingCompleted == 1) {
          sendPushNotification = true;
        }
      } else {
        // Create a new booking
        req.body.total_price = Number(req.body.price_per_hours) * Number(req.body.total_hours);

        const adminFees = await adminFee.findOne()
        let admincharges = adminFees.service_charge
        let adminamount = admincharges*req.body.total_price / 100
        let finalamount = Number(req.body.total_price) + Number(adminamount)

        createBooking = await booking_model.create({
          ...req.body,
          userId,
          status,
          price_per_hours: req.body.price_per_hours,
          admin_charges: adminamount,
          total_price: finalamount,
        });

        // Check if isBookingCompleted is set to 1 to send push notification
        if (req.body.isBookingCompleted == 1) {
          sendPushNotification = true;
        }
      }

      // Find the user to get device information for push notification
      const bookingData = await booking_model.findById({
        _id: createBooking.id,
      });
      const sender = await user_model.findById(bookingData.userId);
      const receiverId = await user_model.findOne({
        _id: bookingData.workerId,
      });

      let payload = {};
      payload = sender;
      payload.title = "Message Sent ";
      payload.message = `${sender.firstname} requested for service.`;
      payload.bookingId = bookingData.id;

      let save_noti_data = {};
      save_noti_data.receiver = receiverId;
      save_noti_data.sender = sender;
      save_noti_data.type = 3;
      save_noti_data.bookingId = bookingData.id;
      save_noti_data.message = payload.message;

      let objS = {
        device_type: receiverId.device_type,
        device_token: receiverId.device_token,
        sender_name: sender.firstname,
        sender_image: sender.image,
        message: payload.message,
        type: 3,
        payload,
        save_noti_data,
      };

      // Find service requests for the worker
      const servicerequests = await booking_model.find({
          workerId: createBooking.workerId,
          isBookingCompleted: 1,
          status: "1",
          deleted: false,
        })
        .populate("userId", "firstname image address")
        .populate("workerId", "firstname image address")
        .populate("addressId", "address state country")
        .populate("categoryId", "name image");

      // Find socketId of worker to listen when posting new booking
      const findWorkerSocketId = await socketuser.findOne({
        userId: createBooking.workerId,
      });
      io.to(findWorkerSocketId.socketId).emit("bookingWorker", {
        servicerequests: servicerequests,
      });

      // Send push notification if the flag is set
      if (sendPushNotification) {
        const push = await helper.send_push_notification(objS);
        const notify = await notification_model.create(save_noti_data);
      }

      return helper.success(res, "Service request sent successfully.", createBooking);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Internal server error.");
    }
  },

  update_booking_status: async (req, res) => {
    try {
      const workerId = req.user;
      const bookingRequest_id = req.body.bookingRequest_id;
      const status = req.body.status;
  
      const statusMessages = {
        0: "rejected service request",
        1: "requested for service", // applied by user
        2: "accepted the service request", // worker can accept
        3: "started working", // worker can update this status
        4: "completed service", // User can update this status
      };
  
      const bookingData = await booking_model.findById({ _id: bookingRequest_id });
      
      // if the booking date is greater than current date do not start work
      if (status == 3) {
        const currentDate = moment().format('DD-MM-YYYY'); // Get current date in 'YYYY-MM-DD' format  
        if (currentDate < bookingData.date) {
          return helper.failed(res, "Cannot start work before time.");
        }
      }
  
      const updateStatus = await booking_model.findOneAndUpdate({ _id: bookingRequest_id },
        { status: status }
      );
      const msg = statusMessages[status] || "Unknown status";     
  
      // calculate the admin charges and provider amount
      let adminFees = bookingData.admin_charges;
      let workerAmount = bookingData.total_price - adminFees;
  
      // update the wallet amount in admin and provider
      const admin = await user_model.findOne({ role: 0 });
      if (req.body.status == "4") {
        await user_model.findByIdAndUpdate(workerId, { $inc: { wallet: workerAmount } });
        await user_model.findOneAndUpdate({ role: 0 }, { $inc: { wallet: adminFees } });
      }
  
      // payment refund if the booking get rejected before accepted
      if (req.body && req.body.status == 0) {
        let FindTransactionId = await transactionModel.findOne({ bookingId: req.body.bookingRequest_id });
        const refund = await stripe.refunds.create({
          charge: FindTransactionId.transactionId,
        });
        let updateRefundId = await transactionModel.updateOne({ bookingId: req.body.bookingRequest_id },
          { refundId: refund.id }
        );
  
        let findDeviceToken = await user_model.findOne({ _id: FindTransactionId.userId });
        let adminDetail = await user_model.findOne({ role: 0 });
  
        let objToSend = {
          message: `Your money is refunded for this booking id ${FindTransactionId.bookingId}`,
          deviceToken: findDeviceToken.device_token,
          senderId: adminDetail._id,
          senderName: adminDetail.firstname,
          senderProfile: adminDetail.image,
          receiverId: findDeviceToken._id,
          bookingId: FindTransactionId.bookingId,
          type: 3
        };
        await notification_model.create(objToSend);
        await helper.send_push_notification(objToSend);
      }
  
      // get user provider data for push notification
      const sender = await user_model.findById(bookingData.workerId._id);
      const receiverId = await user_model.findOne({ _id: bookingData.userId });
      let payload = {};
      payload = sender;
      payload.title = "Message Sent ";
      payload.message = `${sender.firstname} ${msg}`;
      payload.bookingId = bookingData.id;
  
      let save_noti_data = {};
      save_noti_data.receiver = receiverId;
      save_noti_data.sender = sender;
      save_noti_data.type = 3;
      save_noti_data.bookingId = bookingData.id;
      save_noti_data.message = payload.message;
  
      const notify = await notification_model.create(save_noti_data);
      let objS = {
        device_type: receiverId.device_type,
        device_token: receiverId.device_token,
        sender_name: sender.firstname,
        sender_image: sender.image,
        message: payload.message,
        type: 3,
        payload,
        save_noti_data,
      };
      const updateStatusOfnotify = await notification_model.findByIdAndUpdate(
        { _id: notify.id },
        { status: status }
      );
      const push = await helper.send_push_notification(objS);
  
      const updatedStatus = await booking_model.findById({
        _id: bookingRequest_id,
      });
  
      return helper.success(res, "Booking status updated successfully.", {
        msg,
        updatedStatus,
      });
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error.", error);
    }
  },
  
};
