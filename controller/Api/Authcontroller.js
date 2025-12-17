let user_model = require("../../model/Admin/user_model");
let helper = require("../../Helper/helper");
const authenticateHeader = require("../../Helper/helper").authenticateHeader;
const bcrypt = require("bcrypt");
const { Validator } = require("node-input-validator");
var jwt = require("jsonwebtoken");
const secretCryptoKey = "secret@123";
const nodemailer = require("nodemailer");
const bankmodel = require("../../model/Admin/bankmodel");
let serviceModel = require("../../model/Admin/workerServices_model");
const stripe = require("stripe")(process.env.SECRETKEY);
const path = require("path");
module.exports = {
  signup_post: async (req, res) => {

    try {
      const a = req.body.country_code;
      const b = req.body.phone;
      let concatenatedValue = "";

      if (a && b) {
        concatenatedValue = a.concat(b);
      } else {
        return helper.error(res, "country code and phone are missing");
      }

      let v = new Validator(req.body, {
        email: "required",
        password: "required",
      });

      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      let user = await user_model.findOne({ email: req.body.email }).lean();

      if (user) {
        return helper.error(res, "email already exists");
      } else {
        let image = req.files.image.name;
        console.log(image);
        let uploadDir = path.join(__dirname, "../../public/images", image);
        if (req.files.image) {
          req.files.image.mv(uploadDir, (err) => {
            if (err) return res.status(500).send(err);
          });
        }

        // Hash password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        let newUser = await user_model.create({
          firstname: req.body.firstname,
          email: req.body.email,
          locations: req.body.locations,
          password: hashedPassword, // Save the hashed password
          image: image,
          country_code: req.body.country_code,
          phone: req.body.phone,
          phone_number: concatenatedValue,
          status: "1",
          role: "1",
          otp: 1111,
          deletedAt: null,
        });
   

        await newUser.save();

        const token = jwt.sign(
          {
            id: newUser._id,
            email: newUser.email,
            login_time: newUser.login_time,
            expiresIn: "720h",
          },
          "secret@123"
        );

        newUser.token = token;

        return helper.success(res, "signup successful", newUser);
      }
    } catch (error) {
      console.log(error, "error");
      return res.status(500).json({ msg: "internal server error" });
    }
  },

  signin_post: async (req, res) => {
    try {
      // Input validation
      let v = new Validator(req.body, {
        email: "required",
        password: "required",
      });

      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const { email, password, device_token, device_type } = req.body;

      // Find the user by email
      const user = await user_model.findOne({ email: email }); // .lean() to get a plain JS object

      if (!user) {
        return helper.error(res, "User not registered with us");
      }

      // Compare hashed password with the plain text password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return helper.error(res, "Password is incorrect");
      }

      // Update login details (login time, device token, device type)
      let singhup = await user_model.updateOne(
        { email: email },
        {
          loginTime: helper.unixTimestamp(),
          device_token,
          device_type,
        }
      );

      // Find the updated user
      const updatedUser = await user_model.findOne({ email });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: updatedUser._id,
          email: updatedUser.email,
          login_time: updatedUser.login_time,
          expiresIn: "720h",
        },
        "secret@123"
      );

      updatedUser.token = token;

      return helper.success(res, "Sign-in successfully", updatedUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  otpVerify: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        otp: "required",
        phone: "required",
        country_code: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let isUserExist = await user_model.findOne({
        phone: req.body.phone,
        country_code: req.body.country_code,
        deleted: false,
      });

      if (isUserExist) {
        if (req.body.otp == isUserExist.otp) {
          await user_model.updateOne(
            { _id: isUserExist._id },
            { otpverify: 1, otp: "" }
          );
        } else {
          return helper.failed(res, "OTP does not match.");
        }
        let userDetail = await user_model.findOne({ _id: isUserExist._id });

        const findWorkerService = await serviceModel.findOne({
          workerId: userDetail._id,
          deleted: false,
        });

        let time = await helper.unixTimestamp();
        let token = jwt.sign(
          {
            data: {
              _id: userDetail._id,
              email: userDetail.email,
              loginTime: time,
            },
          },
          "secret@123",
          { expiresIn: "365d" }
        );

        userDetail = JSON.stringify(userDetail);
        userDetail = JSON.parse(userDetail);
        userDetail.token = token;
        userDetail.serviceadded = findWorkerService ? 1 : 0;

        let obj = { userDetail };
        return await helper.success(res, "OTP verified successfully.", obj);
      } else {
        return await helper.failed(
          res,
          "Incorrect phone number / country code.",
          {}
        );
      }
    } catch (error) {
      console.log(error);
      return helper.failed(res, error);
    }
  },
  create_profile: async (req, res) => {
    try {
      const longitude = Number(req.body.longitude);
      const latitude = Number(req.body.latitude);
      // Handle image upload

      if (req.files && req.files.image) {
        var image = req.files.image;
        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }

      if (req.body.longitude && req.body.latitude) {
        if (
          longitude >= -180 &&
          longitude <= 180 &&
          latitude >= -90 &&
          latitude <= 90
        ) {
          req.body.location = {
            type: "Point",
            coordinates: [longitude, latitude],
          };
          req.body.latitude = latitude;
          req.body.longitude = longitude;
        } else {
          return helper.failed(
            res,
            "Longitude and latitude values are out of bounds."
          );
        }
      } else {
        req.body.location = {
          type: "Point",
          coordinates: [0, 0],
        };
        req.body.latitude = 0;
        req.body.longitude = 0;
      }

      const checkUserData = await user_model.findOne({
        $or: [{ phone: req.body.phone }, { email: req.body.email }],
      });

      if (checkUserData) {
        if (checkUserData.email === req.body.email) {
          return helper.failed(res, "This email is already used.");
        }

        if (checkUserData.phone === req.body.phone) {
          return helper.failed(res, "This phone number is already used.");
        }
      }

      // Create a Stripe customer
      const customer = await stripe.customers.create({
        name: req.body.firstname,
        email: req.body.email,
      });
      req.body.stripe_customer = customer.id;

      // Update user data
      const updatedData = await user_model.findByIdAndUpdate(
        req.user.id,
        { ...req.body, profile_completed: 1 },
        { new: true }
      );

      if (updatedData) {
        console.log("i am here in last condition");
        return helper.success(res, "Profile updated successfully", updatedData);
      }
    } catch (error) {
      helper.failed(res, error);
    }
  },

  // create_profile: async (req, res) => {
  //   try {

  //     if (req.files && req.files.image) {
  //       var image = req.files.image;

  //       if (image) {
  //         console.log("i ma here in files image");
  //         req.body.image = helper.imageUpload(image, "images");
  //       }
  //     }
  //     if (req.body.longitude && req.body.latitude) {
  //       req.body.location = {
  //         type: "Point",
  //         coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
  //       };

  //       req.body.latitude = Number(req.body.latitude);
  //       req.body.longitude = Number(req.body.longitude);
  //     } else {
  //       req.body.location = {
  //         type: "Point",
  //         coordinates: [0, 0], // Default coordinates
  //       };
  //       req.body.latitude = 0;
  //       req.body.longitude = 0;
  //     }

  //     const checkUserData = await user_modcel.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });

  //     if (checkUserData) {
  //       if (checkUserData.email === req.body.email) {
  //         return helper.failed(res, 'This email is already used.');
  //       }

  //       if (checkUserData.phone === req.body.phone) {
  //         return helper.failed(res, 'This phone number is already used.');
  //       }
  //     }

  //     const customer = await stripe.customers.create({
  //       name: req.body.firstname,
  //       email: req.body.email,
  //     });
  //      req.body.stripe_customer=customer.id
  //     // let stripe_customer=customer.id

  //       const updatedData = await user_model.findByIdAndUpdate(req.user.id,
  //         { ...req.body,
  //         profile_completed: 1},
  //         { new: true }
  //       );

  //     if (updatedData) {
  //       console.log("i ma here in last condition");
  //       return helper.success(res, "Profile updated successfully", updatedData);
  //     }
  //   } catch (error) {
  //     helper.failed(res, error);
  //   }
  // },

  resend_otp: async (req, res) => {
    try {
      // var otp = Math.floor(1000 + Math.random() * 9000);
      var otp = 1111;
      var update_otp = await user_model.findOneAndUpdate(
        { phone: req.body.phone, country_code: req.body.country_code },
        { otp: otp }
      );

      if (update_otp) {
        return await helper.success(res, "Resend otp successfully", { otp });
      } else {
        return helper.failed(res, "something went wrong");
      }
    } catch (error) {
      console.log(error);
      return helper.failed(res, error);
    }
  },

  apilogout: async (req, res) => {
    try {
      const id = req.user._id;
      var updatedUser = await user_model.findByIdAndUpdate(
        id, // User's ID
        { loginTime: "0" }, // Update loginTime to 0
        { new: true } // To return the updated document
      );

      if (!updatedUser) {
        return helper.failed(res, "Failed to update login time");
      }
      return helper.success(res, " User LoggedOut Successfully");
    } catch (error) {
      console.log(error, "===========================");
    }
  },

  ///////////////////////provider side ///////////////////////////////////

  signin: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        phone: "required",
        country_code: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      const { phone, country_code } = req.body;

      // Check if user already exists
      let existingUser = await user_model.findOne({
        phone,
        country_code,
        deleted: false,
      });

      if (existingUser) {
        if (existingUser.status == 0) {
          return helper.failed(res, "Admin approval is required for login.");
        }
        // If user exists, update OTP and device information
        const otp = 1111;

        const update_otp = await user_model.findOneAndUpdate(
          { phone, country_code, deleted: false },
          {
            otp,
            device_type: req.body.device_type,
            device_token: req.body.device_token,
          },
          { new: true }
        );

        if (update_otp) {
          const finadata = await user_model.findById(update_otp._id);
          const time = await helper.unixTimestamp();
          const token = jwt.sign(
            {
              id: finadata._id,
              phone: finadata.phone,
              loginTime: time,
            },
            "secret@123",
            { expiresIn: "365d" }
          );

          const responseData = {
            ...finadata.toObject(),
            token,
          };

          return await helper.success(
            res,
            "OTP updated successfully.",
            responseData
          );
        }
      } else {
        // If user doesn't exist, create a new user
        const otp = 1111;
        const time = helper.unixTimestamp();

        // Check if longitude and latitude are provided, otherwise use default coordinates
        if (req.body.longitude && req.body.latitude) {
          req.body.location = {
            type: "Point",
            coordinates: [
              Number(req.body.longitude),
              Number(req.body.latitude),
            ],
          };
          req.body.latitude = Number(req.body.latitude);
          req.body.longitude = Number(req.body.longitude);
        } else {
          // Default coordinates
          req.body.location = {
            type: "Point",
            coordinates: [0, 0], // Default coordinates
          };
          req.body.latitude = 0;
          req.body.longitude = 0;
        }

        const dataEnter = await user_model.create({
          phone,
          country_code,
          otp,
          device_type: req.body.device_type,
          device_token: req.body.device_token,
          loginTime: time,
          ...req.body,
        });

        const token = jwt.sign(
          {
            id: dataEnter._id,
            phone: dataEnter.phone,
            loginTime: time,
          },
          "secret@123",
          { expiresIn: "365d" }
        );
        console.log("🚀 ~ signin: ~ token:", token);

        const responseData = {
          ...dataEnter.toObject(),
          token,
        };

        return await helper.success(
          res,
          "User created and OTP sent successfully.",
          responseData
        );
      }
    } catch (error) {
      return helper.failed(res, error);
    }
  },

  complete_profile: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        firstname: "required",
        email: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      if (req.files) {
        let image = req.files.image;
        if (image) {
          req.body.image = await helper.imageUpload(image, "images");
        }
      }

      const userInfo = await user_model.findById(req.user._id);
      console.log("🚀 ~ complete_profile: ~ userInfo:", userInfo);

      let userdata = await user_model.findByIdAndUpdate(
        { _id: req.user._id },
        {
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          image: req.body.image,
          email: req.body.email,
          category_id: req.body.category_id,
          Iscomplete:true
        },
        { new: true }
      );

      console.log(userdata, "userdata");

      if (!userdata) {
        return helper.failed(res, "user not find ");
      }

      return helper.success(res, "complete profile successfully", userdata);
    } catch (error) {
      console.log(error, "==============================");
      // return helper.helper.error(res, error);
    }
  },

  signup: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        firstname: "required",
        email: "required",
        // phone: "required",
        // country_code: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      const isemailExist = await user_model.findOne({ email: req.body.email });

      if (isemailExist) {
        return helper.failed(res, "Email already exists");
      }

      const ismobileExist = await user_model.findOne({ phone: req.body.phone });

      if (ismobileExist) {
        return helper.failed(res, "Mobile already exists");
      }

      if (req.files && req.files.image) {
        let image = req.files.image;

        if (image) {
          values.inputs.image = helper.imageUpload(image, "images");
        }
      }

      var Otp = 1111;
      // var Otp = Math.floor(1000 + Math.random() * 9000);

      // let hash = await bcrypt.hash(req.body.password, 10);

      let time = helper.unixTimestamp();
      values.inputs.loginTime = time;
      values.inputs.otp = Otp;

      // Check if longitude and latitude are provided, otherwise use default coordinates
      if (req.body.longitude && req.body.latitude) {
        values.inputs.location = {
          type: "Point",
          coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
        };
        values.inputs.latitude = Number(req.body.latitude);
        values.inputs.longitude = Number(req.body.longitude);
      } else {
        // Default coordinates
        values.inputs.location = {
          type: "Point",
          coordinates: [0, 0], // Default coordinates
        };
        values.inputs.latitude = 0;
        values.inputs.longitude = 0;
      }

      const stripeCustmor = await helper.strieCustomer(req.body.email);
      values.inputs.stripe_customer = stripeCustmor;

      let dataEnter = await user_model.create({ ...values.inputs });

      const getUser = await user_model.findOne({ email: dataEnter.email });

      if (dataEnter) {
        let userInfo = await user_model.findOne({ _id: dataEnter._id });
        delete userInfo.password;

        return helper.success(res, "Signup Successfully", userInfo);
      }
    } catch (error) {
      console.log(error);
      return helper.error(res, "error");
    }
  },

  Login: async (req, res) => {
    try {
      var otp = 1111;
      var update_otp = await user_model.findOneAndUpdate(
        { phone: req.body.phone, deleted: false },
        {
          otp: otp,
          device_type: req.body.device_type,
          device_token: req.body.device_token, // Add this line to update the device_token
        },
        { new: true } // Use { new: true } to get the updated document
      );

      if (update_otp) {
        var finadata = await user_model.findById(update_otp._id);
        // let userCard = await cardmodel.findOne({ userId: finadata._id });

        let time = await helper.unixTimestamp();
        let token = jwt.sign(
          {
            data: {
              _id: finadata._id,
              phone: finadata.phone,
              loginTime: time,
            },
          },
          secretCryptoKey,
          { expiresIn: "365d" }
        );

        finadata = JSON.stringify(finadata);
        finadata = JSON.parse(finadata);
        finadata.token = token;
        // finadata.is_card = userCard ? 1 : 0;

        if (finadata) {
          return await helper.success(res, "OTP sent successfully", finadata);
        } else {
          return helper.failed(res, "Something went wrong");
        }
      } else {
        return helper.failed(res, "Account not found");
      }
    } catch (error) {
      return helper.failed(res, error);
    }
  },

  socialLogin: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        social_id: "required",
        role: "required",
        socialtype: "required", //1 for google , 2 for facebook, 3 for apple
        device_type: "required",
        device_token: "required",
      });
      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }
      let condition = {};
      if (req.body.socialtype == 1) {
        condition = {
          google: req.body.social_id,
          socialtype: req.body.socialtype,
          role: req.body.role,
        };
      } else if (req.body.socialtype == 2) {
        condition = {
          facebook: req.body.social_id,
          socialtype: req.body.socialtype,
          role: req.body.role,
        };
      } else if (req.body.socialtype == 3) {
        condition = {
          apple: req.body.social_id,
          socialtype: req.body.socialtype,
          role: req.body.role,
        };
      }
      var check_social_id = await user_model.findOne(condition);
      var check_email = await user_model.findOne({
        email: req.body.email,
      });

      if (check_social_id || check_email) {
        await user_model.findOneAndUpdate(
          {
            device_token: req.body.device_token,
            device_type: req.body.device_type,
            login_time: helper.unixTimestamp(),
          },
          {
            _id: check_social_id ? check_social_id._id : check_email._id,
          }
        );
        var get_user_data = await user_model.findOne({
          _id: check_social_id._id,
        });
        let token = jwt.sign(
          {
            _id: get_user_data._id,
            login_time: get_user_data.loginTime,
          },
          "secret",
          {
            expiresIn: "365d",
          }
        );
        get_user_data = JSON.stringify(get_user_data);
        get_user_data = JSON.parse(get_user_data);
        get_user_data.token = token;
        delete get_user_data.password;
        if (req.body.role == 2) {
          const account = await bankmodel.count({
            workerId: get_user_data._id,
          });
          var objs = {
            get_user_data,
            account,
          };
        } else {
          var objs = get_user_data;
        }
        return helper.success(res, "Social Login successfully", objs);
      } else {
        let condition = {};

        if (req.body.socialtype == 1) {
          condition = {
            google: req.body.social_id,
            socialtype: req.body.socialtype,
            role: req.body.role,
          };
        } else if (req.body.socialtype == 2) {
          condition = {
            facebook: req.body.social_id,
            socialtype: req.body.socialtype,
            role: req.body.role,
          };
        } else if (req.body.socialtype == 3) {
          condition = {
            apple: req.body.social_id,
            socialtype: req.body.social_type,
            role: req.body.role,
          };
        }
        var save_data = await user_model.create({
          name: req.body.name ? req.body.name : "",
          email: req.body.email ? req.body.email : "",
          phone: req.body.phone ? req.body.phone : "",
          image: req.body.image ? req.body.image : "",
          otp: 1111,
          login_time: await helper.unixTimestamp(),
          type: req.body.type,
          device_type: req.body.device_type ? req.body.device_type : "",
          device_token: req.body.device_token ? req.body.device_token : "",
          bio: req.body.bio ? req.body.bio : "",
          country_code: req.body.country_code ? req.body.country_code : "",
          ...condition,
        });
        var get_user_data = await user_model.findOne({
          _id: save_data._id,
        });
        let token = jwt.sign(
          {
            _id: get_user_data._id,
            login_time: get_user_data.loginTime,
          },
          "secret",
          {
            expiresIn: "365d",
          }
        );
        get_user_data = JSON.stringify(get_user_data);
        get_user_data = JSON.parse(get_user_data);
        get_user_data.token = token;
        delete get_user_data.password;
        if (req.body.role == 2) {
          const account = await bankmodel.count({
            workerId: get_user_data._id,
          });
          var objs = {
            get_user_data,
            account,
          };
        } else {
          var objs = get_user_data;
        }
        return helper.success(res, "Social Login successfully", objs);
      }
    } catch (error) {
      return helper.failed(res, error);
    }
  },
};
