
let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
const notification_model = require('../../model/Admin/notification_model');
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');
const review_model = require('../../model/Admin/review_model');
const job_request = require('../../model/Admin/job_request');
const cardmodel = require('../../model/Admin/cardmodel')
const serviceModel = require('../../model/Admin/workerServices_model')
let bankmodel = require('../../model/Admin/bankmodel')

module.exports = {

  id_verification: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bio: "required",
      });

      const values = JSON.parse(JSON.stringify(v));
      let error = await helper.checkValidation(v);

      if (error) {
        return helper.failed(res, error);
      }

      // Upload image
      let imagedata = "";
      let IdproofImage = "";
      if (req.files && req.files.selfie) {
        imagedata = await helper.imageUpload(req.files.selfie, "images");
      }
      if (req.files && req.files.idproof) {
        IdproofImage = await helper.imageUpload(req.files.idproof, "images");
      }

      userId = req.user._id;

      let data = await user_model.findById(userId);

      // Assuming 'tools' is an array of tools names in the request body
      const tools = req.body.tools;
      const skill = req.body.skill;

      let adddocument = await user_model.updateOne(
        { _id: userId },
        {
          selfie: imagedata ? imagedata : "",
          idproof: IdproofImage ? IdproofImage : "",
          bio: req.body.bio,
          skill: req.body.skill ? req.body.skill.split(",") : [],
          tools: req.body.tools ? req.body.tools.split(",") : [],
        });

      const findUserData = await user_model.findOne({ _id: userId }).populate("skill").populate("tools").lean();

      let userCard = await cardmodel.findOne({ userId: findUserData._id });

      findUserData.is_card = userCard ? 1 : 0;

      return helper.success(res, "Details uploaded successfully", findUserData);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "An error occurred while processing the request");
    }
  },

  get_profile: async (req, res) => {    //get profile or user or provider
    try {
      const v = new Validator(req.body, {
        profileId: "required",
      });
      let error = await helper.checkValidation(v);
      if (error) {
        return helper.failed(res, error);
      }

      const profiledetail = await user_model.findById({_id: req.body.profileId})
      if (!profiledetail) {
        return helper.error(res, "User not found");
      }
      const workerServices = await serviceModel.findOne({workerId: req.body.profileId}, {availability: 0})

      return helper.success(res, "User Profile",  {
        profiledetail: profiledetail,
        workerService: workerServices});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },


  // get one pofile only token
  profile: async (req, res) => {  
    try {
      const userId = req.user.id;
      const profiledata = await user_model.findById(userId).populate("category_id")

      if (!profiledata) {
        return helper.error(res, "User not found");
      }

      let responseData;
      if (profiledata.role == '1') {
        responseData = { profiledata };
      } else if (profiledata.role == '2') {
        const serviceData = await serviceModel.findOne({ workerId: userId });
        responseData = { profiledata, serviceData };
      } else {
        return helper.error(res, "Invalid user role");
      }

      return helper.success(res, "User Profile", responseData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // edit_profile: async (req, res) => {
  //   try {
  //     //update image in usermodel
  //     if (req.files && req.files.image) {
  //       var image = req.files.image;

  //       if (image) {
  //         req.body.image = helper.imageUpload(image, "images");
  //       }
  //     }
  //     const object = req.body
  //     const checkUserData = await user_model.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });
  
  //     if (checkUserData) {
  //       if (checkUserData.email == req.body.email && checkUserData._id.toString() != req.user._id.toString()) {
  //         return helper.failed(res, 'This email is already used.');
  //       }
  //       if (checkUserData.phone == req.body.phone && checkUserData._id.toString() != req.user._id.toString()) {
  //         return helper.failed(res, 'This phone number is already used.');
  //       }
  //     }
  //     let editdata = await user_model.updateOne({ _id: req.user.id },
  //       object);

  //       //update work_photos in service Model
  //       if(req.files && req.files.work_photos){
  //         let imgdata = [];
  //       if (req.files && req.files.work_photos && Array.isArray(req.files.work_photos))
  //           for (i in req.files.work_photos) {
  //               let work_photos = req.files.work_photos[i];
  //               imgdata.push({ url: helper.imageUpload(work_photos, "images") });
  //           }
  //       else {
  //           req.files && req.files.work_photos;
  //           let work_photos = req.files.work_photos;
  //           imgdata.push({ url: helper.imageUpload(work_photos, "images") });
  //       }
  //       req.body.work_photos = imgdata;
  //       }

  //       let updatWorkPhotos = await serviceModel.findOneAndUpdate({workerId: req.user.id},
  //       {work_photos:req.body.work_photos,
  //         description: req.body.description});

  //     let editdatas = await user_model.findById(req.user.id);
  //     let updateserviceimg = await serviceModel.findOne({workerId: req.user.id});

  //     if (editdatas) {
  //       return helper.success(res, "Profile updated successfully", {editdatas, updateserviceimg})
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // },

  deleted_account: async(req, res) => {
  try {
    let userId = req.user._id;
    const deleteProfile = await user_model.findByIdAndUpdate({_id: userId},
    {deleted: true});

    return helper.success(res, "Profile deleted successfully.", {})
  } catch (error) {
    console.log(error)
  }
  },

  worker_public_profile: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        workerId: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      const workerId = req.body.workerId;
      const workerDetails = await user_model.findOne({ _id: workerId }).populate("skill").populate("tools");

      if (!workerDetails) {
        return helper.failed(res, "Worker details not found");
      }
      // Fetch completed jobs by the worker
      const completedJobs = await job_request.find({ workerId: workerId, job_status: 7 }).limit(5).populate({
        path: 'jobId',
        populate: [
            { path: 'job_type', model: 'category', select: 'name image' }, 
            { path: 'servicefee', model: 'service_fee', select: 'service_fee service_charge' }
        ]
      });
      const ratings = await review_model.find({ workerId, rater_role: "1" });
      const count = ratings.length;
      const totalRating = ratings.reduce((sum, rating) => Number(sum) + Number(rating.rating), 0);
      const averageRating = count > 0 ? totalRating / count : 0;

      return helper.success(res, "Worker details", {
        workerDetails,
        ratingdata: { count, averageRating },
        completedJobs: completedJobs
      });
    } catch (error) {
      console.log(error);
    }
  },

  jobsCompletedbyWorker: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;

      const v = new Validator(req.body, {
        workerId: "required",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
      const skip = (page - 1) * perPage;

      const findcompletedjob = await job_request.find({ workerId: req.body.workerId, job_status: "7" }).skip(skip).limit(perPage).populate("jobId")
        .populate({
          path: 'jobId',
          populate: [
            { path: 'job_type', model: 'category', select: 'name image' }, 
            { path: 'servicefee', model: 'service_fee', select: 'service_fee service_charge' }
        ]
       });

      const totalJobsCount = await job_request.countDocuments();
      const totalPages = Math.ceil(totalJobsCount / perPage);

      if (!findcompletedjob) {
        return helper.failed(res, "something went wrong")
      }
      return helper.success(res, "jobs completed by worker", {
        findcompletedjob,
        page: page,
        perPage: perPage,
        totalPages: totalPages
      })
    } catch (error) {
      console.log(error)
    }
  },

  jobsRequestedbyWorker: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        jobId: "required",
      });
  
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }
  
      const findJobRequests = await job_request.find({ jobId: req.body.jobId }).populate("workerId");
  
      if (!findJobRequests || findJobRequests.length === 0) {
        return helper.failed(res, "No job requests found for the specified job ID");
      }
  
      const responseList = [];
  
      for (const jobRequest of findJobRequests) {
        const workerId = jobRequest.workerId;
  
        const workerAvgRatings = await review_model.find({ workerId: workerId, rater_role: "1" });
  
        // Calculate the average rating for the worker
        let totalRating = 0;
        let count = 0;
  
        workerAvgRatings.forEach((review) => {
          // Ensure that review.rating is treated as a number
          totalRating += Number(review.rating);
          count += 1;
        });
  
        const averageRating = count > 0 ? totalRating / count : 0;
  
        const workerResponse = {
          jobRequest: jobRequest,
          workerAvgRating: parseFloat(averageRating.toFixed(2)),
        };
  
        responseList.push(workerResponse);
      }
  
      return helper.success(res, "Jobs requested by worker", responseList);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },

  role_change: async (req, res) => {
    try {
      const v = new Validator(req.body, {
          role: "required",
      });
      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.failed(res, errorResponse);
      }

      const object = req.body
      let updaterole = await user_model.updateOne({ _id: req.user.id },
      object);

      // Update user_To_Worker and worker_To_User fields based on the role
      let updateFields = {};
      if (req.user.role == 1) {
        updateFields = { $set: { user_To_Worker: 1, worker_To_User: 0 } };
      } else {
        updateFields = { $set: { worker_To_User: 1, user_To_Worker: 0 } };
      }
      const updateRole = await user_model.updateOne({ _id: req.user.id }, updateFields);
    
      const account = await bankmodel.count({ workerId: req.user.id});
      let updatedrole = await user_model.findById(req.user.id);
      let obj = {
        updatedrole,
        account
      }

      return helper.success(res, "Role updated successfully", obj);
    } catch (error) {
      console.log(error)
    }
  },

  // edit_profile: async (req, res) => {
  //   try {
  //       // Update image in user model
  //       if (req.files && req.files.image) {
  //         var image = req.files.image;
  //         if (image) {
  //           req.body.image = helper.imageUpload(image, "images");
  //         }
  //       }

  //       const object = req.body;
  //       const checkUserData = await user_model.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });

  //       if (checkUserData) {
  //         if (checkUserData.email === req.body.email && checkUserData._id.toString() !== req.user._id.toString()) {
  //           return helper.failed(res, 'This email is already used.');
  //         }
  //         if (checkUserData.phone === req.body.phone && checkUserData._id.toString() !== req.user._id.toString()) {
  //           return helper.failed(res, 'This phone number is already used.');
  //         }
  //       }

  //       await user_model.updateOne({ _id: req.user.id }, object);

  //       // Update work_photos in service model
  //       let imgdata = [];
  //       if (req.files && req.files.work_photos) {
  //           if (Array.isArray(req.files.work_photos)) {
  //               for (let i in req.files.work_photos) {
  //                   let work_photos = req.files.work_photos[i];
  //                   imgdata.push({ url: helper.imageUpload(work_photos, "images") });
  //               }
  //           } else {
  //               let work_photos = req.files.work_photos;
  //               imgdata.push({ url: helper.imageUpload(work_photos, "images") });
  //           }
  //       }

  //       const existingService = await serviceModel.findOne({ workerId: req.user.id });
  //       if (existingService) {
  //           existingService.work_photos = existingService.work_photos.concat(imgdata);
  //           existingService.description = req.body.description || existingService.description;
  //           await existingService.save();
  //       } else {
  //           await serviceModel.create({
  //               workerId: req.user.id,
  //               work_photos: imgdata,
  //               description: req.body.description
  //           });
  //       }

  //       const editdatas = await user_model.findById(req.user.id);
  //       const updateserviceimg = await serviceModel.findOne({ workerId: req.user.id });
  //       if (editdatas) {
  //           return helper.success(res, "Profile updated successfully", { editdatas, updateserviceimg });
  //       }
  //   } catch (error) {
  //       console.log(error);
  //       return helper.failed(res, 'An error occurred while updating the profile.');
  //   }
  // },


  edit_profile: async (req, res) => {
    try {
      if (req.files) {
        let image = req.files.image;
        if (image) {
          req.body.image = await helper.imageUpload(image, "images");
        }
      }

      const userInfo = await user_model.findById(req.user._id);

      let userdata = await user_model.findByIdAndUpdate(
        { _id: req.user._id },
        {
          firstname: req.body.firstname,
          country_code: req.body.country_code,
          phone: req.body.phone,
          image: req.body.image,
          category_id: req.body.category_id,
        },
        { new: true }
      );

      console.log(userdata, "userdata");

      if (!userdata) {
        return helper.failed(res, "user not update");
      }

      return helper.success(res, "update user", userdata);
    } catch (error) {
      console.log(error, "==============================");
      // return helper.helper.error(res, error);
    }
  },

  delete_image: async (req, res) => {
    try {
      const imageId = req.body.imageId;

      const workerService = await serviceModel.findOne({workerId: req.user._id });

      if (!workerService) {
        return helper.failed(res, "Worker service not found");
      }

      // Use $pull to remove the image by its ID from the array
      workerService.work_photos.pull(imageId);

      // Save the updated job document
      await workerService.save();

      const imageremoved = await serviceModel.findOne({ workerId: req.user._id });

      return helper.success(res, "Image deleted successfully", imageremoved);
    } catch (error) {
      console.log(error);
      return helper.failed(res, "Something went wrong");
    }
  },


  Home_page : async(req, res)=> { 
    try {
      let userId = req.user;
      let categoryList = await category_model.find({deleted:false, status:1})
      if (!categoryList) {
        return helper.failed(res, "Something went wrong");    
      }
      const notificationpending = await notification_model.find({receiver: userId, isRead:"0"})
      let pendingNotifications = notificationpending.length > 0;
     
        return helper.success(res, "Category list",{ categoryList, pendingNotifications } );
    } catch (error) {
        console.log(error)
    }
  },

 

}