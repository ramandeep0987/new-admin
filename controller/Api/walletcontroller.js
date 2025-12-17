const { Validator } = require('node-input-validator');
const wallet = require('../../model/Admin/wallet_model');
const helper = require('../../Helper/helper');
const transactionModel = require('../../model/Admin/transaction_model');
const userModel = require('../../model/Admin/user_model')

module.exports = {

    wallet_transaction: async(req, res)=> {
        try {
            let workerId = req.user._id;
            const getwalletamount = await userModel.findOne({ _id: workerId });
            let walletAmount = getwalletamount.wallet;

            if (walletAmount < req.body.amount) {
                return helper.failed(res, "Insufficient balance.")
            }

            const lastTransactionStatus = await wallet.findOne({workerId, payment_status:'1'})
            if (lastTransactionStatus) {
                return helper.failed(res, "Request cannot proceed as your previous request is still pending approval from the Admin.")
            }

            const walletTransaction = await wallet.create({
                workerId,
                ...req.body
            })

            return helper.success(res, "Transaction status", walletTransaction)
        } catch (error) {
           console.log(error) 
           return helper.failed(res, "Internal server error")
        } 
    },

    transaction_history: async(req, res)=> {
        try {
            let workerId = req.user._id;
            const transactionDetails = await wallet.find({workerId })
            
            if(!transactionDetails) {
              return helper.failed(res, "No transaction details", [])
            }

            return helper.success(res, "All transaction details", transactionDetails)
        } catch (error) {
           console.log(error) 
        } 
    },

    total_earning: async (req, res) => {    
        try {
            const workerId = req.user._id;
            const userdetails = await userModel.findOne({ _id: workerId });
            
            let totalEarning = userdetails.wallet;
    
            const transactions = await wallet.find({workerId: workerId}).sort({createdAt: -1})
    
            return helper.success(res, "Total earning", {
                total_earning: totalEarning,
                transactions: transactions 
            });
        } catch (error) {
            return helper.failed(res, "Internal server error");
        }
    }


}