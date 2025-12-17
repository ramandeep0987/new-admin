const availability = require('../../model/Admin/availability_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')

module.exports = {

    add_availability: async(req, res)=> {
        try {
          let workerId = req.user._id;

                let addAvailability = await availability.create({
                    workerId: workerId,
                    // categoryId: req.body.categoryId,
                    days: req.body.days,
                    start_time: req.body.start_time,
                    end_time: req.body.end_time,
                  })

            if (!addAvailability) {
                return helper.failed(res, "unable to add service")
            }
            return helper.success(res, "Service added successfully", addAvailability)
        } catch (error) {
            console.log(error)
        }
    },

}