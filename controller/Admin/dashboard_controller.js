let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let review_model = require('../../model/Admin/review_model')
let job_model = require('../../model/Admin/job_model')
let booking_model = require('../../model/Admin/booking_model')
let FaQ_model = require('../../model/Admin/FaQ_model')
let report_model = require('../../model/socket/reportrequest')
const contactus = require('../../model/Admin/contactus')
let wallet = require ('../../model/Admin/wallet_model')


module.exports = {

    dashboard: async(req, res)=> {
        try {
            let title = "dashboard"
            let user = await category_model.count({facilities:"parking"})
            let worker = await category_model.count({facilities:"Wheel chair and trolly"})
            let category = await category_model.count({facilities:"Blood Collection Center"})
            let messages = await category_model.count({facilities:"X-R/CT Scan/MRI"})
            let reviews = await category_model.count({facilities:"Help Desk"})
            let booking = await category_model.count({facilities:"Registration Desk"})
            let completejobs = await category_model.count({facilities:"Nursing Care"})
            let withdraw = await category_model.count({facilities:"BP Counter"})
            let FAQ = await category_model.count({facilities:"OPD Waiting"})
            let reports = await category_model.count({facilities:"Doctor Consult"})
            let Pharmacy = await category_model.count({facilities:"Pharmacy Information About How To Take Your Medicines"})
            let Physiotherapy = await category_model.count({facilities:"Physiotherapy"})
            let Food = await category_model.count({facilities:"Food And Beverage Facilities"})
            let Cleanliness = await category_model.count({facilities:"Cleanliness"})
            let Security = await category_model.count({facilities:"Security"})
            let Safe = await category_model.count({facilities:"Safe & secure environment for treatment"})
            let Patient = await category_model.count({facilities:"Patient rights respected by staff"})
            let Hospital = await category_model.count({facilities:"Hospital staff communication"})
            let Other = await category_model.count({facilities:"Any Other"})
     
            res.render('Admin/dashboard', {title, Pharmacy, user,Physiotherapy,Food,Cleanliness,Security,Safe,Patient,Hospital,Other, worker, withdraw, category, messages, reviews, FAQ, booking, reports, completejobs, session: req.session.user, msg: req.flash('msg')  })
        } catch (error) {
            console.log(error)
        }
    },

    forgot_password: async(req, res)=> {
        try {
            let title = "forgot_password"
            res.render('Admin/forgot_password', {title, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {
            
        }
    }


}