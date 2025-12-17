var { v4: uuid } = require("uuid");
var path = require("path");
const { Validator } = require("node-input-validator");
const helper = require("./helper");
const user_model = require("../model/Admin/user_model");
const bcrypt = require("bcrypt");
const review_model = require("../model/Admin/review_model");
const notification_model = require("../model/Admin/notification_model");
var jwt = require("jsonwebtoken");
const secretCryptoKey = process.env.jwtSecretKey;
const stripe = require("stripe")(process?.env?.SECRETKEY);
const SECRET_KEY = process.env.SECRET_KEY;
const PUBLISH_KEY = process.env.PUBLISH_KEY;
var FCM = require("fcm-node");
var serverKey =
  "AAAAwS9BkG8:APA91bHy4wzjoLwcYEhnDrbt1D1TavsyfKxsGMc3cRmR2Iciq-gxQlahfKq9B-s7nXVPg_cQnFv7nTy0p_cnx9uayMRbBwO2aG4HOB3gfZ0sDnetGOUYjX8IgwvYko-wf6naHzJJKnjm";
// let hash =  bcrypt.hash("secret_KeyFor_jobbie_@#!$", 10).then((res)=>{

//   console.log("🚀  file: ApiController.js:31  hash:", res)
// })
var fcm = new FCM(serverKey);
module.exports = {
  imageUpload: (file, folder = "user") => {
    if (file.name == "") return;

    let file_name_string = file.name;
    var file_name_array = file_name_string.split(".");
    var file_extension = file_name_array[file_name_array.length - 1];
    var letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
    var result = "";

    result = uuid();
    let name = result + "." + file_extension;
    file.mv("public/" + folder + "/" + name, function (err) {
      if (err) throw err;
    });
    return "/" + folder + "/" + name;
  },

  session: async (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      return res.redirect("/login_Page");
    }
  },

  success: function (res, message = "", body = {}) {
    return res.status(200).json({
      success: true,
      code: 200,
      message: message,
      body: body,
    });
  },

  error: function (res, err, req) {
    let code = typeof err === "object" ? (err.code ? err.code : 403) : 403;
    let message =
      typeof err === "object" ? (err.message ? err.message : "") : err;

    if (req) {
      req.flash("flashMessage", {
        color: "error",
        message,
      });

      const originalUrl = req.originalUrl.split("/")[1];
      return res.redirect(`/${originalUrl}`);
    }

    return res.status(code).json({
      success: false,
      message: message,
      code: code,
      body: {},
    });
  },

  error2: function (res, err, req) {
    let code = typeof err === "object" ? (err.code ? err.code : 200) : 200;
    let message =
      typeof err === "object" ? (err.message ? err.message : "") : err;

    if (req) {
      req.flash("flashMessage", {
        color: "error",
        message,
      });

      const originalUrl = req.originalUrl.split("/")[1];
      return res.redirect(`/${originalUrl}`);
    }

    return res.status(code).json({
      success: true,
      message: message,
      code: code,
      body: [],
    });
  },

  failed: function (res, message = "") {
    message =
      typeof message === "object"
        ? message.message
          ? message.message
          : ""
        : message;
    return res.status(400).json({
      success: false,
      code: 400,
      message: message,
      body: {},
    });
  },

  failed403: function (res, message = "") {
    message =
      typeof message === "object"
        ? message.message
          ? message.message
          : ""
        : message;
    return res.status(403).json({
      success: false,
      code: 403,
      message: message,
      body: {},
    });
  },

  unixTimestamp: function () {
    var time = Date.now();
    var n = time / 1000;
    return (time = Math.floor(n));
  },

  findUserDeviceToken: async (userid) => {
    try {
      let data = await user_model.find({ _id: { $in: userid } });
      console.log(
        "🚀  file: helper.js:153  findUserDeviceToken:async ~ data:",
        data
      );
      return data;
    } catch (error) {}
  },

  readFile: async (path) => {
    console.log("  ********** readFile *****************");
    console.log(path, "  ********** pathreadFile *****************");
    return new Promise((resolve, reject) => {
      const readFile = util.promisify(fs.readFile);
      readFile(path)
        .then((buffer) => {
          resolve(buffer);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  writeFile: async (path, buffer) => {
    console.log("  ********** write file *****************");
    return new Promise((resolve, reject) => {
      const writeFile1 = util.promisify(fs.writeFile);
      writeFile1(path, buffer)
        .then((buffer) => {
          resolve(buffer);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  //function createVideoThumb(fileData, thumbnailPath){
  createVideoThumb: async (fileData, thumbnailPath) => {
    var VIDEO_THUMBNAIL_TIME = "00:00:02";
    var VIDEO_THUMBNAIL_SIZE = "300x200";
    var VIDEO_THUMBNAIL_TYPE = "video";
    return new Promise(async (resolve, reject) => {
      Thumbler(
        {
          type: VIDEO_THUMBNAIL_TYPE,
          input: fileData,
          output: thumbnailPath,
          time: VIDEO_THUMBNAIL_TIME,
          size: VIDEO_THUMBNAIL_SIZE, // this optional if null will use the desimention of the video
        },
        function (err, path) {
          if (err) reject(err);
          resolve(path);
        }
      );
    });
  },

  fileUploadMultiparty: async function (FILE, FOLDER, FILE_TYPE) {
    console.log(FILE, FOLDER, FILE_TYPE, "[----------data-------]");
    try {
      var FILENAME = FILE.name; // actual filename of file
      var FILEPATH = FILE.tempFilePath; // will be put into a temp directory

      THUMBNAIL_IMAGE_SIZE = 300;
      THUMBNAIL_IMAGE_QUALITY = 100;

      let EXT = fileExtension(FILENAME); //get extension
      EXT = EXT ? EXT : "jpg";
      FOLDER_PATH = FOLDER ? FOLDER + "/" : ""; // if folder name then add following "/"
      var ORIGINAL_FILE_UPLOAD_PATH = "/public/uploads/" + FOLDER_PATH;
      var THUMBNAIL_FILE_UPLOAD_PATH = "/public/uploads/" + FOLDER_PATH;
      var THUMBNAIL_FILE_UPLOAD_PATH_RETURN = "/uploads/" + FOLDER_PATH;
      var NEW_FILE_NAME = new Date().getTime() + "-" + "file." + EXT;
      var NEW_THUMBNAIL_NAME =
        new Date().getTime() +
        "-" +
        "thumbnail" +
        "-" +
        "file." +
        (FILE_TYPE == "video" ? "jpg" : EXT);

      let NEWPATH = path.join(
        __dirname,
        "../",
        ORIGINAL_FILE_UPLOAD_PATH,
        NEW_FILE_NAME
      );
      console.log(NEWPATH, "[=======NEWPATH======]");
      let THUMBNAIL_PATH = path.join(
        __dirname,
        "../",
        ORIGINAL_FILE_UPLOAD_PATH,
        NEW_THUMBNAIL_NAME
      );

      let FILE_OBJECT = {
        image: "",
        thumbnail: "",
        fileName: FILENAME,
        folder: FOLDER,
        file_type: FILE_TYPE,
      };

      console.log(FILEPATH, "====================FILEPATH");
      // return

      let BUFFER = await this.readFile(FILEPATH); //read file from temp path
      await this.writeFile(NEWPATH, BUFFER); //write file to destination

      FILE_OBJECT.image = THUMBNAIL_FILE_UPLOAD_PATH_RETURN + NEW_FILE_NAME;

      let THUMB_BUFFER = "";

      if (FILE_TYPE == "image") {
        // image thumbnail code
        var THUMB_IMAGE_TYPE = EXT == "png" ? "png" : "jpeg";
        THUMB_BUFFER = await sharp(BUFFER)
          .resize(THUMBNAIL_IMAGE_SIZE)
          .toFormat(THUMB_IMAGE_TYPE, {
            quality: THUMBNAIL_IMAGE_QUALITY,
          })
          .toBuffer();
        // FILE_OBJECT.thumbnail = THUMBNAIL_FILE_UPLOAD_PATH + NEW_THUMBNAIL_NAME;
        FILE_OBJECT.thumbnail =
          THUMBNAIL_FILE_UPLOAD_PATH_RETURN + NEW_THUMBNAIL_NAME;
        await this.writeFile(THUMBNAIL_PATH, THUMB_BUFFER);
      } else if (FILE_TYPE == "video") {
        // video thumbnail code
        await this.createVideoThumb(
          NEWPATH,
          THUMBNAIL_PATH,
          NEW_THUMBNAIL_NAME
        );
        FILE_OBJECT.thumbnail =
          THUMBNAIL_FILE_UPLOAD_PATH_RETURN + NEW_THUMBNAIL_NAME;
      } else {
        FILE_OBJECT.thumbnail = "";
      }
      return FILE_OBJECT;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
  checkValidation: async (v) => {
    var errorsResponse;

    await v.check().then(function (matched) {
      if (!matched) {
        var valdErrors = v.errors;
        var respErrors = [];
        Object.keys(valdErrors).forEach(function (key) {
          if (valdErrors && valdErrors[key] && valdErrors[key].message) {
            respErrors.push(valdErrors[key].message);
          }
        });
        errorsResponse = respErrors.join(", ");
      }
    });
    return errorsResponse;
  },
  authenticateHeader: async function (req, res, next) {
    const v = new Validator(req.headers, {
      secret_key: "required|string",
      publish_key: "required|string",
    });

    let errorsResponse = await module.exports.checkValidation(v); // Use the stored reference

    if (errorsResponse) {
      await module.exports.failed(res, errorsResponse);
    }

    if (
      req.headers.secret_key !== SECRET_KEY ||
      req.headers.publish_key !== PUBLISH_KEY
    ) {
      await module.exports.failed(res, "Key not matched!"); // Assuming failed function is defined somewhere
    }
    next();
  },
  authenticateJWT: async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, "secret@123", async (err, payload) => {
        if (err) {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "invalid token",
            body: {},
          });
        }
      

        const existingUser = await user_model.findOne({
          _id: payload.id,
          // loginTime: payload.data.loginTime,
        });
  
        if (existingUser) {
          req.user = existingUser;

          next();
        } else {
          return res.status(401).json({
            success: false,
            code: 401,
            message: "Unauthorized token",
            body: {},
          });
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        code: 403,
        message: "Token required",
        body: {},
      });
    }
  },

  verifyUser: async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      console.log("object");
      jwt.verify(token, SECRETCRYPTO_KEY, async (err, payload) => {
        if (err) {
          return res.sendStatus(403);
        }
        console.log("object,,,,,,,,", payload.data.id);
        const existingUser = await users.findOne({
          where: {
            id: payload.data.id,
            login_time: payload.data.login_time,
          },
        });
        console.log("existingUser,,,,,,,,,,,,,,,,,", existingUser);

        // const existingUser = await users.findOne({
        //   where: {
        //     id: payload.id,
        //     login_time: payload.login_time,
        //   },
        // });
        if (existingUser) {
          req.user = existingUser;
          next();
        } else {
          res.sendStatus(401);
        }
      });
    } else {
      res.sendStatus(401);
    }
  },

  //////////////////  STRIPE  /////////////////////
  strieCustomer: async (email) => {
    console.log(email);
    const customer = await stripe.customers.create({
      email: email,
    });
    return customer ? customer.id : "0";
  },

  stripeToken: async (req) => {
    const token = await stripe.tokens.create({
      card: {
        number: req.body.card_number,
        exp_month: req.body.expire_month,
        exp_year: req.body.expire_year,
      },
    });
    const source = await stripe.customers.createSource(
      req.user.stripe_customer,
      {
        source: token.id,
      }
    );

    return source ? source.id : "0";
  },

  stripePayment: async (req, res) => {
    var charge = await stripe.charges.create({
      amount: req.body.total * 1000,
      currency: "usd",
      customer: req.auth.customer_id,
      source: req.body.card_token,
      description: "sunday",
    });
    return charge;
  },

  paypalPayment: (order, req, item) => {
    return new Promise(async (resolve, reject) => {
      try {
        var formattedProducts = item.map((product) => {
          return {
            price: parseFloat(product.price).toFixed(2),
            quantity: parseInt(product.quantity),
          };
        });
        var totalQuantity = formattedProducts.reduce(
          (sum, product) => sum + product.quantity,
          0
        );

        await paypal.payment.create(
          {
            intent: "sale",
            payer: {
              payment_method: "paypal",
            },
            redirect_urls: {
              return_url: `${req.protocol}://${req.get(
                "host"
              )}/api/paypalSuccessURL?amount=${parseFloat(
                order.total
              )}&orderId=${parseInt(order.id)}&status=1`,
              cancel_url: `${req.protocol}://${req.get(
                "host"
              )}/api/cancleUrl?status=0`,
            },
            transactions: [
              {
                item_list: {
                  items: [
                    {
                      name: "",
                      price: order.total,
                      currency: "USD",
                      quantity: 1,
                    },
                  ],
                },
                amount: {
                  total: order.total,
                  currency: "USD",
                },
                description: "Payment description",
              },
            ],
          },
          (error, payment) => {
            if (error) {
              reject(error);
            } else {
              const approval_url = payment.links.find(
                (link) => link.rel === "approval_url"
              ).href;
              resolve(approval_url);
            }
          }
        );
      } catch (error) {
        console.error("PayPal API Error:", error);
        reject(error);
      }
    });
  },

  SMTP: function (object) {
    var transporter = nodemailer.createTransport(config.mail_auth);
    var mailOptions = object;
    transporter.sendMail(mailOptions, function (error, info) {
      if (err) {
        throw error;
      } else {
        throw message;
      }
    });
  },

  calculateAverageRating: async (spot_id) => {
    try {
      const averageRatingPipeline = [
        {
          $match: {
            workerId: spot_id,
          },
        },
        {
          $group: {
            _id: "$workerId",
            averageRating: { $avg: "$rating" },
            ratingCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            averageRating: 1,
            ratingCount: 1,
          },
        },
      ];

      const spotAverageRatings = await review_model.aggregate(
        averageRatingPipeline
      );
      const result = spotAverageRatings[0];

      return result;
    } catch (error) {
      console.log(error);
    }
  },

  notificationData: async (data) => {
    const notificationObj = {
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      bookingId: data.bookingData,
      type: data.type,
      status: 1,
    };
    const notify = await notification_model.create(notificationObj);
    return notify;
  },

  // push notification for chat
  send_push_notifications: async (payLoad) => {
    try {
      if (payLoad && payLoad.device_token && payLoad.device_token != "") {
        var message = {
          to: payLoad.device_token,
          notification: {
            title: "sunday",
            body: payLoad.message,
            content_available: true,
            priority: "high",
            bookingId: payLoad.bookingId,
            notificationType: payLoad.type,
            sender_name: payLoad.sender_name,
            sender_image: payLoad.sender_image,
          },

          data: {
            title: "sunday",
            body: payLoad.message,
            content_available: true,
            priority: "high",
            bookingId: payLoad.bookingId,
            notificationType: payLoad.type,
            sender_name: payLoad.sender_name,
            sender_image: payLoad.sender_image,
            sender_id: payLoad.sender_id,
            receiver_id: payLoad.receiver_id,
          },
        };

        var server_key =
          "AAAAOl116A8:APA91bERWOGXQuZsA42HrPXi0s5dqwlGJQu_tVuWT5Epf6Key-EoHmkMHRHRyvVHLsqfoQhZTus7-UBHUGumhp34jHHrcvXz9RK_-tc57eGgw0SiqI_FSvB2UIRK3SeR_wNK5JKlE_Uz";
        var fcm = new FCM(server_key);
        console.log(message, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>");

        fcm.send(message, function (err, response) {
          console.log(response, "PUSH.....FCM . SEND............!!!");

          if (err) {
            console.log("Something has gone wrong!", err);
          } else {
            console.log("Successfully sent with response: ", response);
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  // push notification for posting booking request
  send_push_notification: async (payLoad) => {
    if (payLoad && payLoad.device_token && payLoad.device_token != "") {
      var message = {
        to: payLoad.device_token,
        notification: {
          title: "sunday",
          body: payLoad.message,
          content_available: true,
          priority: "high",
          bookingId: payLoad.save_noti_data.bookingId,
          notificationType: payLoad.type,
          sender_name: payLoad.sender_name,
        },

        data: {
          title: "sunday",
          body: payLoad.message,
          content_available: true,
          priority: "high",
          bookingId: payLoad.save_noti_data.bookingId,
          notificationType: payLoad.type,
          sender_name: payLoad.sender_name,
        },
      };

      var server_key =
        "AAAAOl116A8:APA91bERWOGXQuZsA42HrPXi0s5dqwlGJQu_tVuWT5Epf6Key-EoHmkMHRHRyvVHLsqfoQhZTus7-UBHUGumhp34jHHrcvXz9RK_-tc57eGgw0SiqI_FSvB2UIRK3SeR_wNK5JKlE_Uz";
      var fcm = new FCM(server_key);
      console.log(message, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>");

      fcm.send(message, function (err, response) {
        // console.log(response, "PUSH.....FCM . SEND............!!!");

        if (err) {
          console.log("Something has gone wrong!", err);
        } else {
          console.log("Successfully sent with response: ", response);
        }
      });
    }
  },

  //push notification for exceeding 5 minuts after booking request if request not approved
  pushNotificationForExceeding5mints: async (payLoad) => {
    if (payLoad && payLoad.device_token && payLoad.device_token != "") {
      var message = {
        to: payLoad.device_token,
        notification: {
          title: "sunday",
          body: payLoad.message,
          content_available: true,
          priority: "high",
          notificationType: payLoad.type,
          receiver_name: payLoad.receiver_name,
        },

        data: {
          title: "sunday",
          body: payLoad.message,
          content_available: true,
          priority: "high",
          notificationType: payLoad.type,
          receiver_name: payLoad.receiver_name,
        },
      };

      var server_key =
        "AAAAOl116A8:APA91bERWOGXQuZsA42HrPXi0s5dqwlGJQu_tVuWT5Epf6Key-EoHmkMHRHRyvVHLsqfoQhZTus7-UBHUGumhp34jHHrcvXz9RK_-tc57eGgw0SiqI_FSvB2UIRK3SeR_wNK5JKlE_Uz";
      var fcm = new FCM(server_key);
      // console.log(message, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>");

      fcm.send(message, function (err, response) {
        console.log("PUSH.....FCM . SEND............!!!");

        if (err) {
          console.log("Something has gone wrong!", err);
        } else {
          console.log("Successfully sent with response: ", response);
        }
      });
    }
  },

  /////////// STRIPE PAYMENT //////////////
  stripePayment: (stripePayment = {
    /**
     *
     * @param {Object} custemeData = Object | {name , email , phone , description , balance}
     * @returns
     */
    createStripeCustemer: async (custemeData) => {
      try {
        const error = { message: "", statusCode: 501 };
        if (!custemeData?.name) {
          error.message = "name is required for create stripe custemer";
        }
        if (!custemeData?.email) {
          error.message = "email is required for create stripe custemer";
        }
        if (!custemeData?.phone) {
          error.message = "phone is required for create stripe custemer";
        }
        if (!custemeData?.description) {
          error.message = "name is required for create stripe custemer";
        }
        if (!custemeData?.balance) custemeData.balance = 0;
        const customer = await stripe.customers.create(custemeData);
        return customer?.id;
      } catch (err) {
        throw err;
      }
    },
    getCustemerDetails: async (custemerId) => {
      try {
        const customer = await stripe.customers.retrieve(custemerId);
        return customer;
      } catch (err) {
        throw err;
      }
    },
    /**
     * @param {Object}
     */
    card: {
      createCard: async (custemerId, cardToken, isFirstCard) => {
        try {
          let isDefault = false;
          if (isFirstCard) isDefault = true;
          const card = await stripe.customers.createSource(custemerId, {
            source: cardToken,
            metadata: { cardToken, isDefault, paymentId: null },
          });
          return card;
        } catch (err) {
          throw err;
        }
      },

      getCard: async (custemerId, cardId) => {
        try {
          const card = await stripe.customers.retrieveSource(
            custemerId,
            cardId
          );
          return card;
        } catch (err) {
          throw err;
        }
      },
      getAllCard: async (custemerId, limit) => {
        try {
          const option = { object: "card" };
          if (limit) option.limit = parseInt(limit);
          const cards = await stripe.customers.listSources(custemerId, option);
          return cards;
        } catch (err) {
          throw err;
        }
      },
      updateCard: async (custemerId, cardId, data) => {
        try {
          const card = await stripe.customers.updateSource(
            custemerId,
            cardId,
            data ? (typeof data === "object" ? data : {}) : {}
          );
          return card;
        } catch (err) {
          throw err;
        }
      },
      deleteCard: async (custemerId, cardId) => {
        try {
          const deleted = await stripe.customers.deleteSource(
            custemerId,
            cardId
          );
          return deleted;
        } catch (err) {
          throw err;
        }
      },
    },
    payment: {
      createPaymentMethodForCard: async (cardToken) => {
        try {
          const paymentMethod = await stripe.paymentMethods.create({
            type: "card",
            card: { token: cardToken },
          });
          return paymentMethod;
        } catch (err) {
          throw err;
        }
      },
      atachPaymentMethodToCustemer: async (customerId, paymentMethodId) => {
        try {
          const paymentMethod = await stripe.paymentMethods.attach(
            paymentMethodId,
            { customer: customerId }
          );
          return paymentMethod;
        } catch (err) {
          throw err;
        }
      },
      detachPaymentMethodToCustemer: async (paymentMethidId) => {
        try {
          const paymentMethod = await stripe.paymentMethods.detach(
            paymentMethidId
          );
          return paymentMethod;
        } catch (err) {
          throw err;
        }
      },
      getAllPaymentMethod: async (customerId) => {
        try {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
          });
          return paymentMethods;
        } catch (err) {
          throw err;
        }
      },
      verifyPaymenyIntent: async (paymentid, payment_method) => {
        try {
          const paymentIntent = await stripe.paymentIntents.confirm(paymentid, {
            payment_method,
            return_url: "https://www.example.com",
          });
        } catch (err) {
          throw err;
        }
      },
      createPaymentIntent: async (amount, cardId, customerId, orderId) => {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            payment_method_types: ["card"],
            amount: Math.round(amount * 100),
            payment_method: cardId,
            currency: "INR",
            customer: customerId,
            confirm: true,
            description: "My order payment",
            metadata: {
              orderId,
            },
          });
          paymentIntent.url = "";
          if (paymentIntent.next_action) {
            paymentIntent.url =
              paymentIntent.next_action.use_stripe_sdk.stripe_js;
          }
          return paymentIntent;
        } catch (err) {
          throw err;
        }
      },
      confirmPaymentIntent: async (paymentIntent) => {
        try {
          const intent = await stripe.paymentIntents.confirm(paymentIntent, {
            payment_method: ["card"],
          });
          return intent;
        } catch (err) {
          throw err;
        }
      },
    },
    bank: {
      addBankAccound: async (stripeCustemerId, bankDetails, isDefault) => {
        try {
          if (!isDefault) isDefault = false;
          const validationSchemaStripeCumtemerId = Joi.string().required();
          const validationSchameBankDetails = Joi.object()
            .required()
            .keys({
              object: Joi.string().valid("bank_account"),
              account_holder_name: Joi.string().required(),
              account_holder_type: Joi.string().required(),
              account_number: Joi.string().required(),
              routing_number: Joi.string().required(),
              country: Joi.string().required(),
              currency: Joi.string().required(),
            });
          this.dataValidator(
            validationSchemaStripeCumtemerId,
            stripeCustemerId
          );
          bankDetails.object = "bank_account";
          this.dataValidator(validationSchameBankDetails, bankDetails);
          let maskAccountNumber = bankDetails?.account_number;
          maskAccountNumber = maskAccountNumber.slice(
            maskAccountNumber.length - 4
          );
          maskAccountNumber = `XXXXXXXX${maskAccountNumber}`;
          const status = await this.stripe.customers.createSource(
            stripeCustemerId,
            {
              bank_account: bankDetails,
              metadata: { isDefault, maskAccountNumber },
            }
          );
          return status;
        } catch (err) {
          throw err;
        }
      },
      getAllBankList: async (custemertId) => {
        try {
          const response = await axios.get(
            `https://api.stripe.com/v1/customers/${custemertId}/bank_accounts`,
            {
              params: {
                limit: "4",
              },
              auth: {
                username: this.STRIPE_SECRET_KEY,
              },
            }
          );
          return response?.data;
        } catch (err) {
          throw err;
        }
      },
      setDefaultBank: async (custemerId, bankId, isDefault) => {
        try {
          if (!custemerId) throw "custemerId required";
          if (!bankId) throw "bankId required";
          if (!isDefault) throw "isDefault required";
          if (typeof isDefault !== "boolean")
            throw "isDefault should we boolien";
          const customerSource = await stripe.customers.updateSource(
            custemerId,
            bankId,
            {
              metadata: {
                isDefault,
              },
            }
          );
          return customerSource;
        } catch (err) {
          throw err;
        }
      },
      deleteBank: async (custemerId, bankId) => {
        try {
          const customerSource = await this.stripe.customers.deleteSource(
            custemerId,
            bankId
          );
          return customerSource;
        } catch (err) {
          throw err;
        }
      },
      verifyBankAccount: async (custemerId, bankId) => {
        try {
          if (!custemerId) throw "custemerId required";
          if (!bankId) throw "bankId required";
          const bankAccount = await stripe.customers.verifySource(
            custemerId,
            bankId,
            {
              amounts: [32, 45],
            }
          );
          return bankAccount;
        } catch (err) {
          throw err;
        }
      },
    },
    walet: {
      addamountToWalet: async (custemerId, amount) => {
        if (!custemerId) throw "addamountToWalet required";
        if (!amount) throw "amount is required";
        if (typeof amount !== "number") throw "amount should we number";
        const custemerDetails = await this.stripePayment.getCustemerDetails(
          custemerId
        );
        if (!custemerDetails) throw "Invalid custemerId not found";
        let currentAmount = custemerDetails?.balance;
        currentAmount = currentAmount + parseInt(amount);
        try {
          const customer = await stripe.customers.update(custemerId, {
            balance: currentAmount,
          });
          return customer;
        } catch (err) {
          throw err;
        }
      },
      transferCustomerBalanceToBank: async (customerId, amount) => {
        try {
          const cutemereBalance = await this.stripePayment.getCustemerDetails(
            customerId
          );
          if (cutemereBalance?.balance === 0) {
            throw "You don't have sufficient fund for transfer";
          }
          if (cutemereBalance?.balance < parseInt(amount)) {
            throw "You don't have sufficient fund for transfer";
          }
          const updatedAmount = cutemereBalance?.balance - amount;
          const updatedStatus = await stripe.customers.update(customerId, {
            balance: updatedAmount,
          });
          return cutemereBalance;
        } catch (error) {
          console.error("Error transferring customer balance:", error);
          throw error;
        }
      },
    },
  }),
};
