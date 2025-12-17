const bankmodel = require("../../model/Admin/bankmodel");
const user_model = require("../../model/Admin/user_model");
let Withdraw = require("../../model/Admin/wallet_model");

module.exports = {
  add_Withdraw: async (req, res) => {
    try {
      title = "faq_list";
      res.render("Admin/Withdraw/add_faq", {
        title,
        session: req.session.user,
        msg: req.flash("msg"),
      });
    } catch (error) {
      console.log(error);
    }
  },
  create_Withdraw: async (req, res) => {
    try {

      let addfaq = await Withdraw.create({
        workerId: req.body.workerId,
        amount: req.body.amount,
        status: req.body.status,
      });
  

      res.redirect("faq_list");
    } catch (error) {
      console.log(error);
    }
  },



  Withdraw_list: async (req, res) => {
    try {
      title = "Withdraw_list";
      let listing = await Withdraw.find()
        .populate("workerId")
        .sort({ createdAt: -1 });
      
      res.render("Admin/withdrawl/Withdraw_list", {
        title,
        listing,
        session: req.session.user,
        msg: req.flash("msg"),
      });
     
    } catch (error) {
      console.log(error);
    }
  },




  view_Withdraw: async (req, res) => {
    try {
      let title = "Withdraw_list";
      let withdrawdetail = await Withdraw.findById({
        _id: req.params.id,
      }).populate("workerId");

      let bankdetails = await bankmodel.findOne({
        workerId: withdrawdetail.workerId,
      });

      res.render("Admin/withdrawl/view_Withdraw", {
        title,
        withdrawdetail,
        bankdetails,
        session: req.session.user,
        msg: req.flash("msg"),
      });
    } catch (error) {
      console.log(error);
    }
  },
  edit_Withdraw: async (req, res) => {
    try {
      let title = "faq_list";
      let editData = await Withdraw.findById({ _id: req.params.id });
      res.render("Admin/Withdraw/edit_faq", {
        title,
        editData,
        session: req.session.user,
        msg: req.flash("msg"),
      });
    } catch (error) {
      console.log(error);
    }
  },
  update_Withdraw: async (req, res) => {
    try {
      let user = await Withdraw.updateOne(
        { _id: req.body.id },
        {
          question: req.body.question,
          answer: req.body.answer,
        }
      );
      req.flash("msg", "Updated successfully");
      res.redirect("/faq_list");
    } catch (error) {
      console.log(error);
    }
  },

  status_change: async (req, res) => {
    try {
      var withdrawId = await Withdraw.findOne({ _id: req.body.method_id });
      let workerId = withdrawId.workerId;
      const workerdata = await user_model.findOne({ _id: workerId });
      let wallet_amount = workerdata.wallet;
      let deducted_amount = wallet_amount - withdrawId.amount;

      var check = await Withdraw.updateOne(
        { _id: req.body.method_id },
        { payment_status: req.body.status }
      );

      if (req.body.status == 2) {
      const updateWalletAmount = await user_model.findOneAndUpdate(
        { _id: workerId },
        { wallet: deducted_amount}
      );
      if(!updateWalletAmount){
        console.log('Unble to update amount in wallet');
      }
    }   
      req.flash("msg", "Status update successfully");
      res.json(check);
    } catch (error) {
      console.log(error);
    }
  },

  delete_Withdraw: async (req, res) => {
    try {
      let userid = req.body.id;
      let remove = await Withdraw.deleteOne({ _id: userid });
      res.redirect("/faq_list");
    } catch (error) {
      console.log(error);
    }
  },
};
