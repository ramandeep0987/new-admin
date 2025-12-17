let cardmodel = require("../../model/Admin/cardmodel");
let cardLink_model = require("../../model/Admin/cardLink_model");
let helper = require("../../Helper/helper");
const { Validator } = require("node-input-validator");
const { token } = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  // add_card: async (req, res) => {
  //   try {
  //     const currentUser = req?.user;
  //     const v = new Validator(req.body, {
  //       cardToken: "required",
  //     });
  //     let errorsResponse = await helper.checkValidation(v);
  //     if (errorsResponse) {
  //       return helper.failed(res, errorsResponse);
  //     }

  //     const userCards = await helper.stripePayment.card.getAllCard(
  //       currentUser?.stripe_customer
  //     );
  //     const isDefault = userCards?.data[0] ? true : false;
  //     const newCard = await helper.stripePayment.card.createCard(
  //       currentUser?.stripe_customer,
  //       req?.body?.cardToken,
  //       isDefault
  //     );
     
  //     return helper.success(res, "Card added succesfully", newCard);
  //   } catch (error) {
  //     console.log("Error :-", error);
  //     return helper.error(res, "Invalid card number / details");
  //   }
  // },

  edit_card: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        cardHolder_name: "required",
        card_number: "required",
        expire_year: "required",
        expire_month: "required",
        cvv: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let _id = req.body.cardId;

      const checkCard = await cardmodel.findById({ _id });

      if (!checkCard) {
        return helper.failed(res, "card not found");
      }

      let updateCard = await cardmodel.updateOne(
        { _id },
        {
          cardHolder_name: req.body.cardHolder_name,
          card_number: req.body.card_number,
          expire_year: req.body.expire_year,
          expire_month: req.body.expire_month,
          cvv: req.body.cvv,
        }
      );

      if (!updateCard) {
        return helper.failed(res, "Something went wrong", updateCard);
      }

      const updatedcard = await cardmodel.findOne({ _id: req.body.cardId });

      return helper.success(res, "Card updated successfully", updatedcard);
    } catch (error) {
      return helper.error(res, error);
    }
  },

  // delete_card: async (req, res) => {
  //   try {
  //     let cardId = req.body.cardId;
  //     const currentUser = req?.user;
  //     await helper.stripePayment.card.deleteCard(
  //       currentUser?.stripe_customer,
  //       cardId
  //     );
  //     return helper.success(res, "Card deleted successfully.", {});
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },

  // card_list: async (req, res) => {
  //   try {
  //     const currentUser = req.user;
      
  //     // Check if the currentUser and stripe_customer are valid
  //     if (!currentUser?.stripe_customer) {
  //       return helper.failed(res, "No Stripe customer ID found", []);
  //     }
  
  //     const cardList = await helper.stripePayment.card.getAllCard(currentUser.stripe_customer);
      
  //     if (!cardList || !cardList.data || cardList.data.length === 0) {
  //       return helper.success(res, "No card found", []);
  //     }
      
  //     return helper.success(res, "Saved cards", cardList.data);
  //   } catch (error) {
  //     if (error.type === 'StripeInvalidRequestError') {
  //       return helper.failed(res, "Invalid request to Stripe API", []);
        
  //     }
  //     console.log(error);
  //     return helper.failed(res, "An unexpected error occurred", []);
  //   }
  // },
  
  jobPayment: async (req, res) => {
    try {
      const errors = await bookTableValidator(req, res);
      if (!errors.isEmpty())
        return res.status(400).json({
          success: 0,
          code: 400,
          message: errors.array().map((err) => err.msg),
        });
      const {
        restaurentId,
        tableId,
        date,
        bookingStartTime,
        totalMember,
        paymentMethod,
        total,
      } = req.body;
      const bookingData = await booking.create({
        userId: req.user._id,
        restaurentId: restaurentId,
        tableId: tableId,
        date: date,
        bookingStartTime: bookingStartTime,
        totalMember: totalMember,
        paymentMethod: paymentMethod,
        total: total,
      });

      const stripePayment = await stripeController.stripePayment(bookingData);

      return helper.success(res, "Payment Url", stripePayment.url);
    } catch (error) {
      helper.failed(res, error.message);
    }
  },

  add_card_link: async (req, res) => {
    try {
      let create = await cardLink_model.create({
        title: req.body.title,
        description: req.body.description,
      });

      // res.json({create})
      return helper.success(res, "Card Added successfully", create);
    } catch (error) {
      console.log(error);
    }
  },

  card_link: async (req, res) => {
    try {
      const whycardrequired = await cardLink_model.findOne();

      if (!whycardrequired) {
        return helper.failed(res, "details not found");
      }

      return helper.success(res, "why card required", whycardrequired);
    } catch (error) {
      console.log(error);
    }
  },



  add_card: async (req, res) => {
    try {
      // Validate request body
      const v = new Validator(req.body, {
        card_number: "required",
        card_holder_name: "required",
        expiry_date: "required",
        cvv: "required",
      });
      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      // Extract user ID from the request

      // Create payment record
      const add_data = await cardmodel.create({
        userId: req.user._id,
        card_number: req.body.card_number,
        card_holder_name: req.body.card_holder_name,
        expiry_date: req.body.expiry_date,
        cvv: req.body.cvv,
      });

      // Check if payment record was created successfully
      if (!add_data) {
        return helper.failed(res, "Card not found");
      }

      return helper.success(res, "Card added", add_data);
    } catch (error) {
      console.log(error, "uuuuuuuuuuuuuuuuuuuuuuuuu");
    }
  },

  card_list: async (req, res) => {
    try {
      const id = req.user._id;
      const paymentinfo = await cardmodel.find({ userId: id }).populate("userId")


      if (!paymentinfo || paymentinfo.length === 0) {
        return res.status(201).send({
          message: "Card List  is empty",
          success: true,
          code: 200,
          body: {},
        });
      }

      return helper.success(res, "All card found", paymentinfo);
    } catch (error) {
      console.log(error);
      return helper.error(res, "Internal Server Error");
    }
  },

  delete_card: async (req, res) => {
    try {
      const { id } = req.query;

      const delete_data = await cardmodel.findByIdAndDelete(id);

      if (!delete_data) {
        return helper.success(res, "card is not found");

      }

      return helper.success(res, "card deleted successfully");

      // return res.send({
      //   message: "data will   be deleted",
      //   data: {},
      // });
    } catch (error) {
      console.log(error);
      return res.send({
        message: error,
        data: {},
      });
    }
  },
};
