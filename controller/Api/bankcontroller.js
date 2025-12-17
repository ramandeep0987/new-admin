let bankmodel = require('../../model/Admin/bankmodel')
let user_model = require('../../model/Admin/user_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')

module.exports = {

    add_bank: async(req, res)=> {
        try {
            const v = new Validator(req.body, {
                account_holder_name: "required",
                bank_name: "required",
                account_number: "required",
            });
    
            let error = await helper.checkValidation(v);
            if (error) {
              return helper.failed(res, error);
            }
            userId = req.user._id
            let addbank = await bankmodel.create({

                workerId: req.user._id,
              ...req.body
            })

            if(!addbank) {
                return helper.failed(res, "Unable to add bank account", addbank)    
            }

            return helper.success(res, "Bank account added successfully", addbank)
        } catch (error) {
            console.log(error)
        }
    },

    edit_bank: async(req, res)=> {
        try {
            const v = new Validator(req.body, {
                bankId: "required",
                account_holder_name: "required",
                bank_name: "required",
                account_number: "required",
            });
    
            let error = await helper.checkValidation(v);
            if (error) {
              return helper.failed(res, error);
            }

            const _id = req.body.Id
            
            let editbank = await bankmodel.updateOne({_id},{
                account_holder_name: req.body.account_holder_name,
                bank_name: req.body.bank_name,
                account_number: req.body.account_number,
            })

            const updatedbank = await bankmodel.findOne({ _id: _id })
            return helper.success(res, "Bank details updated successfully", updatedbank)

        } catch (error) {
            console.log(error)
        }
    },

    bank_list: async(req, res)=> {
        try {
            let banklist = await bankmodel.find({workerId: req.user.id, deleted: false})

            if(!banklist) {
                return helper.failed(res,"No bank account available")
                }

            return helper.success(res,"Bank list", {banklist:banklist})
        } catch (error) {
            console.log(error)
        }
    },

    delete_bank: async(req, res)=> {
      try {
        let remove = await bankmodel.findByIdAndUpdate({_id: req.body.bankId}, {deleted: true});

        if(remove.length == 0) {
        return helper.failed(res,"Something went wrong")
        }
        let deletedbank = await bankmodel.findById({_id: req.body.bankId})

        return helper.success(res,"Bank details deleted successfully", deletedbank)
        
      } catch (error) {
        console.log(error)
      }
    },

    
}