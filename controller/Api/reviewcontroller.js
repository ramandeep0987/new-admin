let review_model = require('../../model/Admin/review_model')
let user_model = require('../../model/Admin/user_model')
let booking_model = require('../../model/Admin/booking_model')
let notification_model = require('../../model/Admin/notification_model')
let helper = require('../../Helper/helper')
const { Validator } = require('node-input-validator');

module.exports = {

    review_listing: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; 
            const perPage = parseInt(req.query.perPage) || 10; 

            const v = new Validator(req.body, {
                workerId: "required",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.failed(res, errorResponse);
            }
            const workerId = req.body.workerId;

            const totalCount = await review_model.countDocuments({ workerId: workerId });
            const skip = (page - 1) * perPage;
            const totalPages = Math.ceil(totalCount / perPage);

            // Find reviews for the specified user and paginate the results
            const reviewData = await review_model
                .find({ workerId: workerId })
                .populate("userId", 'firstname image')
                .skip(skip).limit(perPage).sort({ "createdAt": -1 });

            if (!reviewData) {
                return helper.failed(res, "Internal server error");
            }

            let totalRatingSum = 0;
            let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            reviewData.forEach(review => {
                const roundedRating = Math.floor(parseFloat(review.rating));
                totalRatingSum = totalRatingSum + roundedRating;
                ratingCounts[roundedRating] = ratingCounts[roundedRating] + 1;
            });

            let averageRating = totalRatingSum / reviewData.length;
            averageRating = Number(averageRating.toFixed(1));

            let ratingAndReviewsData = {
                reviews: reviewData,
                totalRatingCount: reviewData.length,
                averageRating: averageRating,
                ratingCounts: ratingCounts
            };

            return helper.success(res, "Review list", {
                ratingAndReviewsData,
                page: page,
                perPage: perPage,
                totalPages: totalPages,
                totalCount: totalCount 
            });
        } catch (error) {
            console.error(error);
            return helper.failed(res, "Internal server error", error);
        }
    },

    add_review: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                workerId: "required",
                rating: "required",
                comment: "required",
                bookingId: "required"
            });
            let error = await helper.checkValidation(v);
            if (error) {
                return helper.failed(res, error);
            }

            let userId = req.user._id;
            let review = await review_model.create({
                userId,
            ...req.body
            })

             // count the Average rating of the worker
             const Ratings = await review_model.find({ workerId: req.body.workerId });
             const Counts = Ratings.length;
             const TotalRatings = Ratings.reduce(
                 (sum, rating) => Number(sum) + Number(rating.rating),
                 0
             );
             const AverageRatings = Counts > 0 ? TotalRatings / Counts : 0;
             const updateRatingData = await user_model.findByIdAndUpdate({_id: req.body.workerId},
            { rating: AverageRatings });

            const bookingData = await booking_model.findById({_id: req.body.bookingId});

            // Find the user to get device information for push notification
            const sender = await user_model.findOne({ _id: req.user.id });
            var receiverId = await user_model.findOne({ _id: req.body.workerId });

            let payload = {};
            payload = sender;
            payload.title = "Message Sent ";
            payload.message = `${sender.firstname} added review to ${receiverId.firstname}`;
            const { device_token, device_type, type, firstname, image } = receiverId;

            let save_noti_data = {};
                save_noti_data.receiver = receiverId;
                save_noti_data.sender = req.user.id ;
                save_noti_data.type = 1;
                save_noti_data.bookingId = bookingData._id;
                save_noti_data.message = payload.message;

                await notification_model.create(save_noti_data);
                let objS = {
                    device_type: receiverId.device_type,
                    device_token: receiverId.device_token,
                    sender_name: sender.firstname,
                    sender_image: sender.image,
                    message : payload.message,
                    type:1,
                    payload,
                    save_noti_data
                }
            // await helper.send_push_notification(objS);

            return helper.success(res, "review submitted successfully", review)

        } catch (error) {
            console.log(error)
        }
    },

    
}