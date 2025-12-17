let contactus = require('../../model/Admin/contactus')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');


module.exports = {
    
  support: async(req, res)=> {
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
            const userId = req.user._id
            
            let support = await contactus.create({ 
                userId: userId,
               ...req.body
            })

            return helper.success(res, "Message sent successfully", support)
        } catch (error) {
            console.log(error)
            return helper.failed(res, "Internal server error", error)
        }

  }


}