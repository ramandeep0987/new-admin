let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let serviceModel = require('../../model/Admin/workerServices_model')
let helper = require('../../Helper/helper')
const bcrypt = require('bcrypt');


module.exports = {
     
    

    worker_service_list: async(req, res)=>{
        try {
            let title = "worker_list"
            let workerservicedata = await serviceModel.find({workerId: req.params.id})
            
             res.render('Admin/worker/worker_list', {title, workerservicedata, session: req.session.user, msg: req.flash('msg')})
        } catch (error) {   
          console.log(error)
        }
    },


}