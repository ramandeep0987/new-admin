const address_model = require('../../model/Admin/address_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper')
let csc = require('country-state-city').default;
let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

module.exports = {
  





  add_address: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        city: "required",
        state: "required",
        country: "required",
        // longitude: "required",
        // latitude: "required"
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      let time = helper.unixTimestamp();
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
      userId = req.user._id
      let address = await address_model.create({
        userId,
        ...req.body
      })

      if (!address) {
        return helper.failed(res, "Failed to add address")
      }
      return helper.success(res, "Address added succesfully", address);
    } catch (error) {
      console.log(error)
    }
  },

  edit_address: async (req, res) => {

    try {
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };

      const addressId = req.body.addressId
      delete req.body.latitude
      delete req.body.longitude

      const address = await address_model.updateOne(
        { _id: req.body.addressId },
        { ...req.body }
      );
      if (!address) {
        return helper.failed(res, "Address not found");
      }

      const updatedaddress = await address_model.findOne({ _id: req.body.addressId })
      return helper.success(res, "Address updated successfully", updatedaddress);

    } catch (error) {
      return helper.failed(res, "Error updating address");
    }
  },

  address_list: async (req, res) => {
    try {
      const userId = req.user._id
      let useraddress = await address_model.find({ userId: userId, deleted: false })
      .populate('userId', 'firstname image')
      .sort({ createdAt: -1 });

      if (!useraddress) {
        return helper.failed(res, "Address not found");
      }

      return helper.success(res, 'User address list', useraddress);
    } catch (error) {
      console.log(error)
    }
  },

  delete_address: async (req, res) => {
    try {
      let addressId = req.body.addressId;
      let removeaddress = await address_model.findByIdAndUpdate({ _id: addressId }, { deleted: true })
      
      if (!removeaddress) {
        return helper.failed(res, "Address not found")
      }
      let deletedaddress = await address_model.findOne({ _id: addressId })
      return helper.success(res, "Address deleted successfully", deletedaddress)
    } catch (error) {
      console.log(error)
      return helper.failed(res, "Internal server error ")
    }
  },

  citystatecountry: async (req, res) => {
    try {

      let count = await Country.getAllCountries()
      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `listing fetched successfully.`, count);
    } catch (err) {
      return helper.error(res, err);
    }
  },

  getState: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        countrycode: 'required'
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      let city = await State.getStatesOfCountry(req.body.countrycode);
      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `listing fetched successfully.`, city);
    } catch (err) {
      return helper.error(res, err);
    }
  },

  getCity: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        countrycode: 'required',
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      let city;
      if (req.body.countrycode && req.body.statecode) {
        city = City.getCitiesOfState(req.body.countrycode, req.body.statecode)
      } else {
        city = City.getCitiesOfCountry(req.body.countrycode)
      }

      // let modelItems = await module.exports.findAll(req, res, {
      // userId: req.user.id,
      // });

      return helper.success(res, `listing fetched successfully.`, city);
    } catch (err) {
      return helper.error(res, err);
    }
  },

}