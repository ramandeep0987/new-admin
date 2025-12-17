
let contactusModel = require('../../model/Admin/contactus')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator')

module.exports = {


    support_create: async(req, res)=> {
        try {
            const v = new Validator(req.body, {
                name: "required",
                email: "required",
                message: "required"
            });
            let error = await helper.checkValidation(v);
            if (error){
                return helper.failed(res, error);
            }
            // const userId = req.user._id
            
            let support = await contactusModel.create({ 
                // userId: userId,
               ...req.body
            })

            return helper.success(res, "Message sent successfully", support)
        } catch (error) {
            console.log(error)
            return helper.failed(res, "Internal server error", error)
        }

  },


    contact_list: async(req, res)=> {
        try {
            let title = "contact_list"
            let messagedata = await contactusModel.find().sort({ createdAt: -1})

            res.render('Admin/contact/contact_list', {title, messagedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },


    view_message: async(req, res)=> {
        try {
            let title = "contact_list"
            let messagesdata = await contactusModel.findById({_id: req.params.id})
            res.render('Admin/contact/view_message', {title, messagesdata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    delete_message: async(req, res)=> {
        try {
            let title = "contact_list"
            let userid = req.body.id;
            let remove = await contactusModel.deleteOne({_id: userid})
            res.redirect('/contact_list')
        } catch (error) {
            console.log(error)
        }
    },

    





}