
let helper = require('../../Helper/helper');
const { Validator } = require('node-input-validator');
const job_model = require('../../model/Admin/job_model');
const job_request = require('../../model/Admin/job_request')
const category_model = require('../../model/Admin/category_model')
const address_model = require('../../model/Admin/address_model');
const notification_model = require('../../model/Admin/notification_model');
const user_model = require('../../model/Admin/user_model');
const review_model = require('../../model/Admin/review_model')
const addCost_model = require('../../model/Admin/addCost_model')


module.exports = {


    get_job_types: async (req, res) => {     //list of categories/job type
        try {
            const jobTypeList = await category_model.find()

            if (!jobTypeList) {
                return helper.failed(res, "something went wrong", jobTypeList)
            }
            return helper.success(res, "job type listing", jobTypeList)
        } catch (error) {
            console.log(error)
        }
    },

    delete_job: async (req, res) => {
        try {
            let jobId = req.body.jobId;
            let removejob = await job_model.findByIdAndUpdate({ _id: jobId }, { deleted: true })

            if (!removejob) {
                return helper.failed(res, "job not found")
            }

            return helper.success(res, "job deleted successfully ", removejob)

        } catch (error) {
            console.log(error)
        }
    },

    completed_jobs: async (req, res) => {
        try {
            const userId = req.user._id;

            // Find completed jobs for the user
            const completedJobs = await job_model.find({ userId, job_status: 7 });

            if (!completedJobs) {
                return helper.failed(res, 'No completed job found', completedJobs);
            }

            // Find job reviews associated with the completed jobs
            const jobIds = completedJobs.map(job => job._id);
            const jobReviewData = await review_model.find({ jobId: { $in: jobIds } });

            // Create a dictionary to associate job reviews with their respective jobs
            const completedJobsWithReviews = completedJobs.map(job => {
                const reviewsForJob = jobReviewData.filter(review => review.jobId.equals(job._id));
                return {
                    ...job._doc,
                    reviews: reviewsForJob,
                };
            });

            return helper.success(res, 'Completed job list', {
                completedJobsWithReviews,
            });
        } catch (error) {
            console.log(error);
        }
    },

    job_cancel: async (req, res) => {
        try {
            const v = new Validator(req.body, {

                jobId: "required",
            });

            const value = JSON.parse(JSON.stringify(v));
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobCancel = await job_model.updateOne({ _id: req.body.jobId },
                { status: '4' })

            if (!jobCancel) {
                return helper.failed(res, " something went wrong", jobCancel);
            }

            return helper.success(res, " job cancelled successfully", jobCancel);
        } catch (error) {

        }
    },

    jobAccToNameAndStatus: async (req, res) => {
        try {
            const jobName = req.body.jobName;
            const jobStatus = req.body.jobStatus;
            const job_type = req.body.job_type;
            const date = req.body.date; // Date in format 'day/month/year'

            // Create a query object
            const query = {};

            // If a job name is provided, add it to the query
            if (jobName) {
                query.job_title = { $regex: '^' + jobName, $options: 'i' };
            }

            // If a status is provided, add it to the query
            if (jobStatus) {
                query.status = jobStatus;
            }

            // If a category is provided, add it to the query
            if (job_type) {
                query.job_type = job_type;
            }

            // If a date is provided, parse it and create a date range filter
            if (date) {
                const [day, month, year] = date.split('/'); // Split the date string
                const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
                const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
                query.createdAt = { $gte: startDate, $lte: endDate };
            }

            // If neither name, status, nor type is provided, retrieve all jobs
            if (!jobName && !jobStatus && !job_type && !date) {
                const allJobs = await job_model.find({});
                return helper.success(res, "All jobs", allJobs);
            }

            const jobsList = await job_model.find(query);

            if (!jobsList || jobsList.length === 0) {
                return helper.failed(res, "No jobs found");
            }

            return helper.success(res, "Jobs according to search", jobsList);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "An error occurred");
        }
    },

    jobSearch: async (req, res) => {
        try {
            const data = await job_model.aggregate([
                {
                    $lookup: {

                        from: "jobs",
                        localField: "category",
                        foreignField: "job_type",
                        as: "job details"
                    },

                }
            ])
            res.json(data)

        } catch (error) {
            console.log(error)
        }
    },

    accept_Job: async (req, res) => {
        try {

            const jobId = req.body.jobId;

            const jobRequest = await job_request.findOne({

                _id: jobId,
                job_status: '1'     // Assuming status 1 represents worker requested for this job
            });

            if (!jobRequest) {
                return helper.failed(res, "Job request not found or already accepted/rejected");
            }

            const jobstatus = await job_request.updateOne({ jobId, job_status: '2' })

            // You can also send a notification to the job creator if needed
            const jobData = await job_model.findById(jobRequest.jobId);

            const notification = {
                sender: req.user.id,
                receiver: jobRequest.workerId,
                message: `${req.user.firstname} has accepted your job request`,
                type: 2 // You can define the type for an acceptance notification
            };

            await helper.notificationData(notification);

            // Return a success response
            return helper.success(res, "Job request accepted successfully", jobData);
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    applyjob: async (req, res) => {
        try {
            const workerId = req.user._id;
            const status = 1;
            const jobId = req.body.jobid;

            const existingRequest = await job_request.findOne({ workerId, jobId });

            if (existingRequest) {
                existingRequest.job_status = status;
                await existingRequest.save();

                // Update the job status in job_model
                await job_model.updateOne({ _id: jobId }, { job_status: status });

                return helper.success(res, "Job status updated successfully.", {
                    job_request_id: existingRequest._id, // Include the job_request id in the response
                });
            } else {
            const obj = {
                ...req.body,
                workerId,
                status,
                jobId,
            };
            const data = await job_request.create(obj);

            const jobdataa = await job_model.findById(jobId);
            // Find the user to get device information for push notification
            const user = await user_model.findById(jobdataa.userId);
            const sender = await user_model.findOne({ _id: req.user.id });
            const receiverId = await user_model.findOne({ _id: jobdataa.userId });

            let payload = {};
            payload = sender;
            payload.title = "Message Sent ";
            payload.message = `${sender.firstname} has applied for your job`;
            payload.jobId = jobId;

            
            let save_noti_data = {};
            save_noti_data.receiver = receiverId;
            save_noti_data.sender = req.user.id ;
            save_noti_data.type = 3;
            save_noti_data.jobId = jobId;
            save_noti_data.message = payload.message;

            await notification_model.create(save_noti_data);
            let objS = {
                device_type: receiverId.device_type,
                device_token: receiverId.device_token,
                sender_name: sender.firstname,
                sender_image: sender.image,
                message : payload.message,
                type:3,
                payload,
                save_noti_data
            }
           
            await helper.send_push_notification(objS);
            return helper.success(res,
                "Applied for job successfully.",
                { data, job_request_id: data._id } // Include the job_request id in the response
            );
            }
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    delete_image: async (req, res) => {
        try {
            const jobId = req.body.id; // Assuming req.body.id is the job ID
            const imageId = req.body.imageId; // Assuming req.body.imageId is the image ID you want to delete

            // Find the job by ID
            const job = await job_model.findOne({ _id: jobId });

            if (!job) {
                return helper.failed(res, "Job not found");
            }

            // Use $pull to remove the image by its ID from the array
            job.image.pull(imageId);

            // Save the updated job document
            await job.save();

            const imageremoved = await job_model.findOne({ _id: jobId });

            return helper.success(res, "Image deleted successfully", imageremoved);

        } catch (error) {
            console.log(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    update_jobSource_location: async (req, res) => {
        try {

            const v = new Validator(req.body, {

                jobId: "required",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobId = req.body.jobId
            const updatelocation = await job_model.updateOne({ _id: jobId },

                {
                    location: {
                        coordinates: [Number(req.body.longitude),
                        Number(req.body.latitude)],
                    }
                }
            );
            if (!updatelocation) {
                return helper.failed(res, "something went wrong")
            }

            const updatedjoblocation = await job_model.findOne({ _id: req.body.jobId })

            return helper.success(res, "location updated successfully", updatedjoblocation)

        } catch (error) {
            console.log(error)
        }
    },

    file_upload: async (req, res) => {
        try {
            const image = await helper.imageUpload(req.files.image, "images")
            return helper.success(res, 'Image upload successfully', { image });

        }
        catch (err) {
            console.log("err --------------- ", err)
            return res.status(400).json({ status: 0, message: "Something went wrong" });
        }
    },

    changeJobAddress: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                jobId: "required",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }

            const jobId = req.body.jobId
            const jobaddress = await job_model.updateOne({ _id: jobId },
                { address: req.body.address })

            if (!jobaddress) {
                return helper.failed(res, "something went wrong")
            }

            const updatedjobaddress = await job_model.findOne({ _id: req.body.jobId })

            return helper.success(res, "Job address updated successfully", updatedjobaddress)


        } catch (error) {
            console.log(error)
        }
    },

    user_job_listing: async (req, res) => {
        try {
            const userId = req.user._id;
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.perPage) || 10;
            const date = req.query.date; // Date in format 'day/month/year'
            const jobStatus = req.query.job_status;

            // Build the filter object based on query parameters
            const filter = { userId: userId, deleted: false };

            if (req.query.search) {
                filter.job_title = { $regex: req.query.search, $options: 'i' };
            }

            if (req.query.job_status) {
                filter.job_status = req.query.job_status;
            }

            if (req.query.job_type) {
                filter.job_type = req.query.job_type;
            }

            if (date) {
                const currentDate = new Date()
                filter.exp_date = { $in: date }
                // filter.exp_date = { $gte: currentDate }
            } else {
                const currentDate = new Date();
                currentDate.setUTCHours(0, 0, 0, 0);

                filter.exp_date = { $gte: currentDate };
            }
           
            // Calculate the items to skip
            const skip = (page - 1) * perPage;
            // Query the database with pagination and filters
            const jobsData = await job_model.find(filter)
                .populate("job_type")
                .populate('address')
                .populate('servicefee', 'service_fee service_charge')
                .skip(skip)
                .limit(perPage)
                .sort({ createdAt: -1 })
                .populate("userId", "firstname image");


            const totalJobsCount = await job_model.countDocuments(filter);
            const totalPages = Math.ceil(totalJobsCount / perPage);

            if (!jobsData) {
                return helper.failed(res, "Something went wrong");
            }

            // If jobStatus is provided, filter jobs accordingly
            if (jobStatus) {
                if (jobStatus === '7') {
                    // If job_status is 7, fetch job reviews for completed jobs
                    const completedJobs = jobsData.filter(job => job.job_status === '7');

                    // Fetch job reviews for completed jobs
                    const jobReviewData = await Promise.all(completedJobs.map(async (job) => {
                        const jobReviews = await review_model.find({ jobId: job._id });
                        return {
                            ...job._doc,
                            jobReviews
                        };
                    }));

                    return helper.success(res, "Completed Jobs listing with Job Reviews", {
                        jobs: jobReviewData,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: totalJobsCount,
                        totalPages: totalPages
                    });
                } else {
                    // Filter jobs by the provided job_status
                    const filteredJobs = jobsData.filter(job => job.job_status === jobStatus);
                    return helper.success(res, "Jobs listing", {
                        jobs: filteredJobs,
                        page: page,
                        perPage: perPage,
                        totalJobsCount: filteredJobs.length,
                        totalPages: Math.ceil(filteredJobs.length / perPage)
                    });
                }
            } else {
                // If jobStatus is not provided, exclude jobs with job_status '7'
                const jobsWithoutCompletedStatus = jobsData.filter(job => job.job_status !== '7');

                // Fetch jobRequestedData for all jobs
                const jobsWithRequestedData = await Promise.all(jobsWithoutCompletedStatus.map(async (job) => {
                    let filter = { jobId: job._id };
                    const jobRequestData = await job_request.find(filter);

                    return {
                        ...job._doc,
                        jobRequestedData: jobRequestData
                    };
                }));

                return helper.success(res, "Jobs listing", {
                    jobs: jobsWithRequestedData,
                    page: page,
                    perPage: perPage,
                    totalJobsCount: jobsWithoutCompletedStatus.length,
                    totalPages: Math.ceil(jobsWithoutCompletedStatus.length / perPage)
                });
            }
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Something went wrong");
        }
    },

    updateJobStatus: async (req, res) => {
        try {
            const userId = req.user._id;
            const jobRequested_id = req.body.jobRequested_id;
            const job_id = req.body.job_id;
            const job_status = req.body.job_status;
    
            const statusMessages = {
                0: 'Open job request',
                1: 'Applied for job',       // applied by worker & pending request from user
                2: 'Accepted the job',      // User can accept or user can update this status
                3: 'has started a job',     // worker can update this status
                4: 'Rejected job request',  // User can update this status
                5: 'Cancelled the job request',   // worker can update this status
                6: 'has completed a job',   // worker can update this status
                7: 'Ended the job',         // user can update this status
                8: 'Start tracking',        // worker can update this status
                9: 'Reached on job location'    // worker can update this status
            };
    
            const requestedJob = await job_request.findOneAndUpdate(
                { _id: jobRequested_id },
                { job_status: job_status }
            );
    
            let workerId = requestedJob.workerId; 
            
            // if (job_status == 4 || job_status == 5) {
            //     workerId = null; 
            // }

            // Assuming userId and job_status are defined somewhere
            let users = await user_model.findById(userId);

            // Initialize user_job_cancellation_fee
            let user_job_cancellation_fee = users.user_job_cancellation_fee || 0;

            if (job_status == 4 && users.role == 1) {
                // Increment user_job_cancellation_fee by 1
              
                user_job_cancellation_fee = parseInt(user_job_cancellation_fee) + 1;

                // Update user_job_cancellation_fee
                await user_model.updateOne({ _id: userId }, { user_job_cancellation_fee });

                workerId = null; // Set workerId to null
            } else if (job_status == 5) {
                workerId = null; 
            }

            const jobStatus = await job_model.findOneAndUpdate(
                { _id: job_id },
                {
                    job_status: job_status,
                    workerId: workerId
                }
            );
    
            const msg = statusMessages[job_status] || 'Unknown status';
    
            let receiverId = null;
    
            if (job_status == 2 || job_status == 4  || job_status == 7) {
                receiverId = requestedJob.workerId;
            } else if (job_status == 3 || job_status == 5 || job_status == 6 || job_status == 8 || job_status == 9) {
                receiverId = jobStatus.userId;
            }
    
            const user = await user_model.findById(receiverId);
            const sender = await user_model.findOne({ _id: req.user.id });
            const receiverObj = await user_model.findOne({ _id: receiverId });
            const jobdataa = await job_model.findById(job_id);
            if (user && user.device_token) {
                let payload = {};
                payload = sender;
                payload.title = "Message Sent ";
                payload.message = `${sender.firstname} ${msg}`;
                payload.jobId = job_id;
    
                const { device_token, device_type, type, firstname, image } = receiverObj;
    
                let save_noti_data = {};
                save_noti_data.receiver = receiverId;
                save_noti_data.sender = userId;
                save_noti_data.type = 1;
                save_noti_data.jobId = job_id;
                save_noti_data.message = payload.message;
    
                await notification_model.create(save_noti_data);
                let objS = {
                    device_type: receiverObj.device_type,
                    device_token: receiverObj.device_token,
                    sender_name: sender.firstname,
                    sender_image: sender.image,
                    message : payload.message,
                    type:1,
                    payload,
                    save_noti_data
                }
                
                await helper.send_push_notification(objS);
            }
    
            if (job_status === 1) {
                await job_model.findOneAndUpdate({ _id: requestedJob.job_id }, { job_status: 6 });
                // Perform payment processing logic here if needed
            }
    
            return helper.success(res, 'Job status updated successfully', { job_status, msg });
        } catch (error) {
            console.error(error);
            return helper.failed(res, 'Something went wrong', error);
        }
    },

    job_details: async (req, res) => {
        try {
          const v = new Validator(req.body, {
            jobId: "required",
          });
          const errorResponse = await helper.checkValidation(v);
          if (errorResponse) {
            return helper.failed(res, errorResponse);
          }
      
          const jobId = req.body.jobId;
          const userId = req.user.id;
          const getdetails = await job_model
            .findOne({ _id: jobId, deleted: false })
            .populate("job_type")
            .populate("address")
            .populate("userId", "firstname lastname image bio user_job_cancellation_fee")
            .populate("workerId", "firstname lastname image worker_job_cancellation_fee");
      
          if (!getdetails) {
            return helper.failed(res, "No job found");
          }
      
          // Fetch and populate information about users who have requested the job
          const jobRequestedData = await job_request
            .find({ jobId: jobId })
            .populate("workerId", "firstname image");
      
          const completedJobsByWorker = getdetails.workerId
            ? await job_model
                .find({ workerId: getdetails.workerId._id, job_status: "7" })
                .select("image")
            : [];
      
          const jobreviewData = await review_model.find({ jobId: jobId });
      
          let filter = {};
      
          if (req.user.role == 1) {
            // Logged-in user is a worker
            filter = { workerId: getdetails.workerId?._id, rater_role: 1 };
          } else if (req.user.role == 2) {
            // Logged-in user is a user
            filter = { userId: getdetails.userId?._id, rater_role: 2 };
          }
      
          const Ratings = await review_model.find(filter);
          const Counts = Ratings.length;
          const TotalRatings = Ratings.reduce(
            (sum, rating) => Number(sum) + Number(rating.rating),
            0
          );
          const AverageRatings = Counts > 0 ? TotalRatings / Counts : 0;
      
          // Assuming you have a payment_transaction field in getdetails
          const payment_transaction = getdetails.payment_transaction;
      
          // Check if payment_transaction exists and has the paymentAmount property
          let transactionFeePercent = {"service_fee": 3.5, "service_charge": 3.5};
         
          if (payment_transaction && payment_transaction.paymentAmount !== undefined) {
            // Calculate transactionFeePercent based on paymentAmount (adjust this based on your actual payment data)
            const paymentAmount = payment_transaction.paymentAmount;
            transactionFeePercent = calculateTransactionFee(paymentAmount);
          }
      
          // Check if the worker is working on other jobs
          let isWorkerWorking = null;
          if (getdetails.workerId && getdetails.workerId._id) {
            isWorkerWorking = await job_model.exists({
              workerId: getdetails.workerId._id,
              job_status: { $in: ["3"] },
            });
          }
          const otherJob = jobId == isWorkerWorking ? null : isWorkerWorking;
      
          const response = {
            getdetails,
            payment_transaction: payment_transaction,
            jobRequestedData: jobRequestedData,
            completedJobsByWorker: completedJobsByWorker,
            jobreviewData: jobreviewData,
            RatingData: { counts: Counts, averageRatings: AverageRatings },
            transactionFeePercent: transactionFeePercent,
            isWorkerWorking: { jobId: jobId, OtherJob: otherJob },
          };
      
          // Fetch additional_cost_list for the logged-in worker
          const additionalCostList = await addCost_model.find({ jobId: req.body.jobId });
      
          if (additionalCostList) {
            response.additional_cost_list = additionalCostList;
          }
      
          return helper.success(res, "Job Details", response);
        } catch (error) {
          console.log(error);
          return helper.failed(res, "Something went wrong");
        }
    },
      
    
}