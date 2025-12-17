const transactionModel = require('../../model/Admin/transaction_model')
let helper = require('../../Helper/helper')

module.exports = {

    transaction_list: async(req, res)=> {
        try {
            title = "transaction_list"
            let transactionData = await transactionModel.find().sort({createdAt:-1})
            .populate('userId', 'firstname')
            .populate('workerId', 'firstname')
            res.render('Admin/transaction/transaction_list', {title, transactionData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
         console.log(error)
        }
    },

    view_transaction: async(req, res)=> {
        try {
            let title = "transaction_list"
            let transData = await transactionModel.findById({_id: req.params.id})
            .populate('userId', 'firstname')
            .populate('workerId', 'firstname')
            .populate('bookingId', 'status')
            res.render('Admin/transaction/view_transaction', { title, transData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },



}