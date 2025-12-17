var express = require('express');
const addresscontroller = require('../controller/Api/addresscontroller');
var router = express.Router();
let Authcontroller = require('../controller/Api/Authcontroller');
const bankcontroller = require('../controller/Api/bankcontroller');
const cardcontroller = require('../controller/Api/cardcontroller');
const categorycontroller = require('../controller/Api/categorycontroller');
const cmscontroller = require('../controller/Api/cmscontroller');
const jobcontroller = require('../controller/Api/jobcontroller');
const reviewcontroller = require('../controller/Api/reviewcontroller');
const supportcontroller = require('../controller/Api/supportcontroller');
const usercontroller = require('../controller/Api/usercontroller');
const workercontroller = require('../controller/Api/workercontroller');
const authenticateJWT = require("../Helper/helper").authenticateJWT;
const authenticateHeader = require("../Helper/helper").authenticateHeader;
const FaQcontroller = require('../controller/Api/FaQcontroller');
var {session} = require('../Helper/helper');
const notificationcontroller = require('../controller/Api/notificationcontroller');
const transactioncontroller = require('../controller/Api/transactioncontroller');
const walletcontroller = require('../controller/Api/walletcontroller');
const worker_service_controller = require('../controller/Api/worker_service_controller');
const bookingcontroller = require('../controller/Api/bookingcontroller');
const availabilitycontroller = require('../controller/Api/availabilitycontroller');
const stripecontroller = require('../controller/Api/stripecontroller');
const Admin = require('../model/Admin');
const subcategory = require('../controller/Api/subcategory');

// router.use(authenticateHeader);
///////////// AUTHENTICATION //////////////
module.exports=function(io){
    // console.log("object,io",io);
    router.post('/signup_post', Authcontroller.signup_post)
    router.post('/signin_post', Authcontroller.signin_post)
// router.post('/signup', Authcontroller.signup)
// router.post('/socialLogin', Authcontroller.socialLogin)
    router.post('/signin', Authcontroller.signin)
    router.put('/complete/profile',authenticateJWT ,Authcontroller.complete_profile)
router.post('/create_profile', authenticateJWT, Authcontroller.create_profile)
// router.post('/Login', Authcontroller.Login)
router.post('/otpVerify' ,Authcontroller.otpVerify)
router.get('/privacy_Policy', cmscontroller.privacy_Policy)
router.get('/about_us', cmscontroller.about_us)
router.get('/terms_conditions', cmscontroller.terms_conditions)
router.post("/resend_otp", Authcontroller.resend_otp)
router.post("/logout", authenticateJWT, Authcontroller.apilogout)
router.post('/id_verification', authenticateJWT, usercontroller.id_verification)

//////////// USER ////////////////////////
router.get('/profileone', authenticateJWT, usercontroller.profile)
router.post('/edit_profile', authenticateJWT, usercontroller.edit_profile)
router.get('/worker_public_profile', authenticateJWT, usercontroller.worker_public_profile)
router.get('/jobsRequestedbyWorker', authenticateJWT, usercontroller.jobsRequestedbyWorker)
router.get('/jobsCompletedbyWorker', authenticateJWT, usercontroller.jobsCompletedbyWorker)
router.post('/role_change', authenticateJWT, usercontroller.role_change)
router.post('/deleted_account', authenticateJWT, usercontroller.deleted_account)
router.get('/ghjg', authenticateJWT, usercontroller.get_profile)
    router.post('/delete_image', authenticateJWT, usercontroller.delete_image)
    router.get('/Home_page', authenticateJWT, usercontroller.Home_page)

/////////// CARDS  ////////////////////////
router.post('/add_card', authenticateJWT, cardcontroller.add_card)
router.post('/edit_card', authenticateJWT, cardcontroller.edit_card)
router.delete('/delete_card', authenticateJWT, cardcontroller.delete_card)
router.get('/card_list',  authenticateJWT, cardcontroller.card_list)
router.post('/jobPayment', authenticateJWT, cardcontroller.jobPayment)
router.post('/add_card_link', cardcontroller.add_card_link)
router.get('/card_link', cardcontroller.card_link)


//////////// BOOKING REQUEST /////////////////
router.post('/post_booking_request', authenticateJWT, bookingcontroller.post_booking_request(io))
router.post('/delete_service_request', authenticateJWT, bookingcontroller.delete_service_request)
router.post('/update_booking_status', authenticateJWT, bookingcontroller. update_booking_status)
router.post('/booking_list', authenticateJWT, bookingcontroller.booking_list)
router.post('/booking_details', authenticateJWT, bookingcontroller. booking_details)
router.post('/worker_booking_list', authenticateJWT, bookingcontroller. worker_booking_list)

/////////// WORKER /////////////////////////
router.post('/edit_worker_profile', authenticateJWT, workercontroller.edit_worker_profile)
router.get('/worker_job_listing', authenticateJWT, workercontroller.worker_job_listing)
router.post('/update_Job_Status', authenticateJWT, workercontroller.update_Job_Status)
router.get('/user_public_profile', authenticateJWT, workercontroller.user_public_profile)
router.get('/worker_job_requests', authenticateJWT, workercontroller.worker_job_requests)
router.get('/completedAndNewJobs', authenticateJWT, workercontroller.completedAndNewJobs)

//////////////// AVAILABILITY ////////////////////////
router.post('/add_availability', authenticateJWT, availabilitycontroller.add_availability)

///////////  BANK  ///////////////////
router.post('/add_bank', authenticateJWT, bankcontroller.add_bank)
router.post('/edit_bank', authenticateJWT, bankcontroller.edit_bank)
router.post('/delete_bank', authenticateJWT, bankcontroller.delete_bank)
router.get('/bank_list', authenticateJWT, bankcontroller.bank_list)

/////////  CATEGORY  /////////////////////
router.get('/category_list',  authenticateJWT, categorycontroller.category_list)
    router.post('/service_provider_list', authenticateJWT, worker_service_controller.service_provider_list)
    



/////////  SUBCATEGORY  /////////////////////

    router.get('/sub',subcategory.subcategory_list)

/////////  SUPPORT  /////////////
router.post('/supportdfdfdf', authenticateJWT, supportcontroller.support)

////////////////// NOTIFICATION ///////////////////
router.get('/notificationList', authenticateJWT, notificationcontroller.notificationList)
router.post('/change_notification_status', authenticateJWT, notificationcontroller.change_notification_status)
router.get('/unread_notification_count', authenticateJWT, notificationcontroller.unread_notification_count)
router.post('/read_notification', authenticateJWT, notificationcontroller.read_notification)

/////////  JOB  /////////////////
router.get('/user_job_listing', authenticateJWT, jobcontroller.user_job_listing)
router.get('/get_job_types', authenticateJWT, jobcontroller.get_job_types)
router.get('/completed_jobs', authenticateJWT, jobcontroller.completed_jobs)
router.delete('/delete_job', authenticateJWT, jobcontroller.delete_job)
router.get('/job_details', authenticateJWT, jobcontroller.job_details)
router.post('/job_cancel', authenticateJWT, jobcontroller.job_cancel)
router.get('/jobAccToNameAndStatus', authenticateJWT, jobcontroller.jobAccToNameAndStatus)
router.get('/jobSearch', authenticateJWT, jobcontroller.jobSearch)
router.post('/applyjob', authenticateJWT, jobcontroller.applyjob)
router.post('/accept_Job', authenticateJWT, jobcontroller.accept_Job)
router.post('/update_jobSource_location', authenticateJWT, jobcontroller.update_jobSource_location)
router.post('/updateJobStatus', authenticateJWT, jobcontroller.updateJobStatus)
router.post('/delete_image', authenticateJWT, jobcontroller.delete_image)
router.post('/file_upload', jobcontroller.file_upload)
router.post('/changeJobAddress', authenticateJWT, jobcontroller.changeJobAddress)
router.post('/addImageByWorker', authenticateJWT, workercontroller.addImageByWorker)

///////////////  TRANSACTION /////////
router.post('/payment_transaction', authenticateJWT, transactioncontroller.payment_transaction)
router.get('/transaction_list', authenticateJWT, transactioncontroller.transaction_list)
router.get('/job_cancellation_charges', authenticateJWT, transactioncontroller.job_cancellation_charges)
router.get('/worker_transaction_history', authenticateJWT, transactioncontroller.worker_transaction_history)

////////////// WALLET ////////////////
router.post('/wallet_transaction', authenticateJWT, walletcontroller.wallet_transaction)
router.post('/transaction_history', authenticateJWT, walletcontroller.transaction_history)
router.get('/total_earning', authenticateJWT, walletcontroller. total_earning)


//////////  RATING  ///////////////////
router.post('/add_review',  authenticateJWT, reviewcontroller.add_review)
router.post('/review_listing', authenticateJWT, reviewcontroller.review_listing)

//////////  FAQ //////////////////
router.get('/faq_listing', authenticateJWT, FaQcontroller.faq_listing)

/////////  ADDRESS ///////////////
router.post('/add_address', authenticateJWT, addresscontroller.add_address)
router.post('/edit_address', authenticateJWT, addresscontroller.edit_address)
router.get('/address_list', authenticateJWT, addresscontroller.address_list)
router.delete('/delete_address', authenticateJWT, addresscontroller.delete_address)
router.get('/citystatecountry', authenticateJWT, addresscontroller.citystatecountry)
router.post('/getState', authenticateJWT, addresscontroller.getState)
router.post('/getCity', authenticateJWT, addresscontroller.getCity)

/////////// WORKER SERVICES ////////////////////////
router.post('/add_worker_services', authenticateJWT, worker_service_controller.add_worker_services)
router.post('/update_service', authenticateJWT, worker_service_controller.update_service)
router.post('/service_requested_by_user', authenticateJWT, worker_service_controller.service_requested_by_user)
router.post('/delete_services', authenticateJWT, worker_service_controller.delete_services)
router.get('/provider_services_details', authenticateJWT, worker_service_controller.provider_services_details)
router.post('/location_filter', authenticateJWT, worker_service_controller.location_filter)

//////////  PAYMENT .////////////////
router.post('/payment_intent',authenticateJWT, stripecontroller.payment_intent)

return router
}


// module.exports = router;





