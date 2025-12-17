let user_model = require("../../model/Admin/user_model");
let category_model = require("../../model/Admin/category_model");
let serviceModel = require("../../model/Admin/workerServices_model");
let helper = require("../../Helper/helper");
const { Validator } = require("node-input-validator");
const booking_model = require("../../model/Admin/booking_model");
const moment = require("moment");

module.exports = {
  // worker side
  add_worker_services: async (req, res) => {
    try {
      let workerId = req.user._id;

      let imgdata = [];
      if (req.files && req.files.work_photos) {
        if (Array.isArray(req.files.work_photos)) {
          for (let work_photos of req.files.work_photos) {
            imgdata.push({ url: helper.imageUpload(work_photos, "images") });
          }
        } else {
          req.files && req.files.work_photos;
          let work_photos = req.files.work_photos;
          imgdata.push({ url: helper.imageUpload(work_photos, "images") });
        }
      }

      let services = JSON.parse(req.body.servicesData);
      let servicesData = [];
      if (Array.isArray(services)) {
        for (let service of services) {
          servicesData.push({
            categoryId: service.categoryId,
            hourly_price: service.hourly_price,
          });
        }
      }

      let availability = JSON.parse(req.body.availabilityData); // Parsing availability data
      let availabilityData = [];
      if (Array.isArray(availability)) {
        for (let available of availability) {
          availabilityData.push({
            days: available.days,
            start_time: available.start_time,
            end_time: available.end_time,
          });
        }
      }

      let workerService = await serviceModel.create({
        workerId: workerId,
        availability: availabilityData,
        services: servicesData,
        description: req.body.description,
        work_photos: imgdata,
      });

      if (!workerService) {
        return helper.failed(res, "Unable to add service");
      }
      return helper.success(res, "Service added successfully", workerService);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "An error occurred");
    }
  },

  // worker side
  update_service: async (req, res) => {
    try {
      let imgdata = [];
      if (
        req.files &&
        req.files.work_photos &&
        Array.isArray(req.files.work_photos)
      ) {
        for (let i = 0; i < req.files.work_photos.length; i++) {
          let work_photos = req.files.work_photos[i];
          imgdata.push({ url: helper.imageUpload(work_photos, "images") });
        }
      } else if (req.files && req.files.work_photos) {
        let work_photos = req.files.work_photos;
        imgdata.push({ url: helper.imageUpload(work_photos, "images") });
      }

      const serviceId = req.body.serviceId;
      // Find the existing service
      const existingService = await serviceModel.findOne({ _id: serviceId });

      if (!existingService) {
        return helper.failed(res, "Service not found");
      }

      // Update work photos
      existingService.work_photos = [
        ...existingService.work_photos,
        ...imgdata,
      ];

      if (req.body.servicesData) {
        let services = JSON.parse(req.body.servicesData);
        if (Array.isArray(services)) {
          for (let service of services) {
            // Find the index of the existing service if categoryId exists
            const index = existingService.services.findIndex(
              (existing) =>
                existing.categoryId.toString() === service.categoryId.toString()
            );

            if (index !== -1) {
              // If categoryId already exists, check hourly_price
              if (
                existingService.services[index].hourly_price ==
                service.hourly_price
              ) {
                return helper.failed(
                  res,
                  `Category with ID ${service.categoryId} is already added with same hourly price`
                );
              } else {
                // Update the hourly_price if categoryId exists with different hourly_price
                existingService.services[index].hourly_price =
                  service.hourly_price;
              }
            } else {
              // If categoryId doesn't exist, push it into existingService.services
              existingService.services.push({
                categoryId: service.categoryId,
                hourly_price: service.hourly_price || "",
              });
            }
          }
        }
      }
      if (req.body.availabilityData) {
        let availability = JSON.parse(req.body.availabilityData); // Parsing availability data
        let availabilityData = [];
        if (Array.isArray(availability)) {
          for (let available of availability) {
            availabilityData.push({
              days: available.days,
              start_time: available.start_time,
              end_time: available.end_time,
            });
          }
        }
        existingService.availability = availabilityData;
      }
      // Save the updated job document
      const updatedService = await existingService.save();

      return helper.success(
        res,
        "Service updated successfully.",
        updatedService
      );
    } catch (error) {
      return helper.failed(res, "Internal server error.");
    }
  },

  // user side with filter
  // service_provider_list: async (req, res) => {
  //   try {
      
  //     const v = new Validator(req.body, {
  //       categoryId: "required",
  //     });
  //     const errorResponse = await helper.checkValidation(v);
  //     if (errorResponse) {
  //       return helper.failed(res, errorResponse);
  //     }

  //     let filter = { "services.categoryId": req.body.categoryId, deleted: false};

  //     if (req.body.date) {
  //       // Check if date is provided
  //       const providedDate = moment(req.body.date, "DD-MM-YYYY");
  //       const dayOfWeek = providedDate.format("ddd");
  //       filter["availability.days"] = dayOfWeek;
  //     }
  //     if (req.body.time) {
  //       // Check if time is provided
  //       const providedTime = req.body.time;
  //       filter["availability.start_time"] = { $lte: providedTime };
  //       filter["availability.end_time"] = { $gte: providedTime };
  //     }
  //     let ratings = {};
  //     if (req.body.rating) {
  //       ratings = {
  //         rating: {
  //           $gte: parseInt(req.body.rating),
  //           $lte: parseInt(req.body.rating) + 1,
  //         },
  //       };
  //     }

  //      const nearbyWorkers = await user_model.aggregate([
  //       {
  //         $geoNear: {
  //           near: {
  //             type: "Point",
  //             coordinates: [
  //               req.user.location.coordinates[0],
  //               req.user.location.coordinates[1],
  //             ],
  //           },
  //           distanceField: "dist.calculated",
  //           maxDistance: 50000, // 50 KM
  //           spherical: true,
  //           key: "location",
  //         },
  //       },
  //       {
  //         $match: ratings,
  //       },
  //       {
  //         $project: { _id: 1 }
  //       }
  //     ]);
    
  //     const nearbyWorkerIds = nearbyWorkers.map(worker => worker._id);
  
  //     if (nearbyWorkerIds.length === 0) {
  //       return helper.success(res, "No nearby workers found", []);
  //     }
  //     filter.workerId = { $in: nearbyWorkerIds };
  //     let getServiceProviders = await serviceModel
  //       .find(filter)
  //       .populate({
  //         path: "services",
  //         match: { categoryId: req.body.categoryId },
  //         select: "categoryId hourly_price",
  //         populate: {
  //           match: { _id: req.body.categoryId },
  //           path: "categoryId",
  //           select: "name image",
  //         },
  //       })
  //       .populate({
  //         path: "workerId",
  //         select: "firstname image rating address location",
  //         match: { ...ratings }, //
  //       })
  //       .populate("availability", "days start_time end_time")

  //     if (getServiceProviders.length == 0) {
  //       return helper.success(res, "No service provider available", []);
  //     }

  //     for (let i = 0; i < getServiceProviders.length; i++) {
  //       const updatedSR = [];
  //       const { services } = getServiceProviders[i];
  //       if (Array.isArray && services[0]) {
  //         for (let b = 0; b < services.length; b++) {
  //           const { categoryId } = services[b];
  //           if (categoryId !== null) updatedSR.push(services[b]);
  //         }
  //         getServiceProviders[i]["services"] = updatedSR[0];
  //       }
  //     }
  //     return helper.success(res, "Service Provider list", getServiceProviders);
  //   } catch (error) {
  //     console.log(error);
  //     return helper.failed(res, "Internal server error", error);
  //   }
  // },

  // worker side with filter
  service_requested_by_user: async (req, res) => {
    try {
      const workerId = req.user._id;
      const status = req.body.status;
      const categoryId = req.body.categoryId;
      const date = req.body.date;

      const filter = { workerId: workerId, status: "1", deleted: false };

      if (req.body.status) {
        filter.status = req.body.status;
      }
      if (req.body.categoryId) {
        filter.categoryId = req.body.categoryId;
      }
      if (req.body.date) {
        filter.date = req.body.date;
      }

      const servicerequests = await booking_model
        .find(filter)
        .populate("userId", "firstname image address")
        .populate("workerId", "firstname image")
        .populate("categoryId", "name image")
        .populate("addressId", "houseNo address state country");

      if (servicerequests.length == 0) {
        return helper.success(res, "No service request available", []);
      }

      return helper.success(res, "Service requested by user", servicerequests);
    } catch (error) {
      console.error(error);
      return helper.failed(res, "Internal server error");
    }
  },

  delete_services: async (req, res) => {
    try {
      const serviceId = req.body.serviceId;
      const categoryId = req.body.categoryId; //_id in services not categoryId

      const serviceData = await serviceModel.findOne({ _id: serviceId });

      if (!serviceData) {
        return helper.failed(res, "Service not found");
      }

      // Use filter method to remove the service object with matching categoryId
      serviceData.services = serviceData.services.filter(
        (service) => service._id.toString() !== categoryId
      );

      await serviceData.save();

      const updatedServices = await serviceModel.findOne({ _id: serviceId });

      return helper.success(
        res,
        "Service deleted successfully",
        updatedServices
      );
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },

  provider_services_details: async (req, res) => {
    try {
      const workerId = req.user._id;

      const servicerequests = await serviceModel
        .findOne({ workerId })
        .populate("workerId", "firstname image")
        .populate({
          path: "services",
          populate: {
            path: "categoryId",
            select: "name",
          },
        });

      if (servicerequests.length == 0) {
        return helper.success(res, "No service available");
      }

      return helper.success(res, "Service requested by user", servicerequests);
    } catch (error) {
      return helper.failed(res, "Internal server error");
    }
  },

  location_filter: async (req, res) => {
    try {
      let filter = { deleted: false};
      
       const nearbyWorkers = await user_model.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                Number(req.body.longitude),
                Number(req.body.latitude),
              ],
            },
            distanceField: "dist.calculated",
            maxDistance: 5000, // 50 KM
            spherical: true,
            key: "location",
          },
        },
        {
          $project: { _id: 1 }
        }
      ]);
    
      const nearbyWorkerIds = nearbyWorkers.map(worker => worker._id);
  
      if (nearbyWorkerIds.length === 0) {
        return helper.success(res, "No nearby workers found", []);
      }
      filter.workerId = { $in: nearbyWorkerIds };
      let getServiceProviders = await serviceModel
        .find(filter)

      return helper.success(res, "Service Provider list", getServiceProviders);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Internal server error", error);
    }
  },

  service_provider_list: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        categoryId: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
  
      let filter = { "services.categoryId": req.body.categoryId, deleted: false };
  
      if (req.body.date) {
        // Check if date is provided
        const providedDate = moment(req.body.date, "DD-MM-YYYY");
        const dayOfWeek = providedDate.format("ddd");
        filter["availability.days"] = dayOfWeek;
      }
      if (req.body.time) {
        // Check if time is provided
        const providedTime = req.body.time;
        filter["availability.start_time"] = { $lte: providedTime };
        filter["availability.end_time"] = { $gte: providedTime };
      }
      let ratings = {};
      if (req.body.rating) {
        ratings = {
          rating: {
            $gte: parseInt(req.body.rating),
            $lte: parseInt(req.body.rating) + 1,
          },
        };
      }
  
      // Check if latitude and longitude are provided for location-based filtering
      if (req.body.longitude && req.body.latitude) {
        const nearbyWorkers = await user_model.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  Number(req.body.longitude),
                  Number(req.body.latitude),
                ],
              },
              distanceField: "dist.calculated",
              maxDistance: 50000, // 50 KM
              spherical: true,
              key: "location",
            },
          },
          {
            $match: ratings,
          },
          {
            $project: { _id: 1 }
          }
        ]);
  
        const nearbyWorkerIds = nearbyWorkers.map(worker => worker._id);
  
        if (nearbyWorkerIds.length === 0) {
          return helper.success(res, "No nearby workers found", []);
        }
        filter.workerId = { $in: nearbyWorkerIds };
      } else {
        // Fall back to the original filtering logic without location-based filtering
        const nearbyWorkers = await user_model.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  req.user.location.coordinates[0],
                  req.user.location.coordinates[1],
                ],
              },
              distanceField: "dist.calculated",
              maxDistance: 50000, // 50 KM
              spherical: true,
              key: "location",
            },
          },
          {
            $match: ratings,
          },
          {
            $project: { _id: 1 }
          }
        ]);
  
        const nearbyWorkerIds = nearbyWorkers.map(worker => worker._id);
  
        if (nearbyWorkerIds.length === 0) {
          return helper.success(res, "No nearby workers found", []);
        }
        filter.workerId = { $in: nearbyWorkerIds };
      }
  
      let getServiceProviders = await serviceModel
        .find(filter)
        .populate({
          path: "services",
          match: { categoryId: req.body.categoryId },
          select: "categoryId hourly_price",
          populate: {
            match: { _id: req.body.categoryId },
            path: "categoryId",
            select: "name image",
          },
        })
        .populate({
          path: "workerId",
          select: "firstname image rating address location",
          match: { ...ratings, deleted: false},
        })
        .populate("availability", "days start_time end_time");
  
      if (getServiceProviders.length == 0) {
        return helper.success(res, "No service provider available", []);
      }
  
      for (let i = 0; i < getServiceProviders.length; i++) {
        const updatedSR = [];
        const { services } = getServiceProviders[i];
        if (Array.isArray && services[0]) {
          for (let b = 0; b < services.length; b++) {
            const { categoryId } = services[b];
            if (categoryId !== null) updatedSR.push(services[b]);
          }
          getServiceProviders[i]["services"] = updatedSR[0];
        }
      }
      return helper.success(res, "Service Provider list", getServiceProviders);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Internal server error", error);
    }
  },
  
  
};
