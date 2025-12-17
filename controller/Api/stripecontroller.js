require("dotenv").config();
const stripe = require("stripe")(process.env.SECRETKEY);
const Model = require("../../model/Admin/index");
const transactionModel = require("../../model/Admin/transaction_model");
const userModel = require("../../model/Admin/user_model");
const helper = require("../../Helper/helper");
const booking_model = require("../../model/Admin/booking_model");

module.exports = {
  payment_intent: async (req, res) => {
    try {
      let totalAmount = req.body.total_amount;
      let findCustomerId = await userModel.findOne({ _id: req.user._id });

      //find bookingdetails to get admin charges and worker charges
      let bookingamount = await booking_model.findOne({_id: req.body.bookingId}) 
      let adminCharge = bookingamount.admin_charges
      let actualAmount = totalAmount - adminCharge

      const charge = await stripe.charges.create({
        amount: parseInt(req.body.total_amount)*100,
        currency: 'usd',
        description: 'Booking payment',
        source: req.body.cardId,
        customer:findCustomerId.stripe_customer
      });

        if(charge&&charge.status==='succeeded'){
          let objToSave = { 
            transactionId: charge.id,
            userId: req.user.id,
            workerId: req.body.workerId, 
            admin_charges: adminCharge,
            total_amount: req.body.total_amount,
            actual_amount: actualAmount,
            bookingId: req.body.bookingId,
            payment_status:charge.status
          };
          await transactionModel.create(objToSave);
          return helper.success(res, "Payment successful");
        }else{
          return helper.failed(res, "Payment failed");
        }
    } catch (error) {
      console.log("err : -", error);
      throw error;
    }
  },

  
};
