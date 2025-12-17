let booking_model = require('../../model/Admin/booking_model')
let user_model = require('../../model/Admin/user_model')
let category_model = require('../../model/Admin/category_model')
let job_model = require('../../model/Admin/job_model')
let addCost = require('../../model/Admin/addCost_model')
const service_fee = require('../../model/Admin/service_fee_model')
const transactionModel = require('../../model/Admin/transaction_model')
let helper = require('../../Helper/helper')

module.exports = { 

  add_booking: async(req, res)=> {
      try {
          let title = "booking_list"
          let user = await user_model.find({role:1});
          let job_type =  await category_model.find();
          let worker = await user_model.find({role:2});
          res.render('Admin/booking/add_booking', {title, job_type, user, worker, session: req.session.user, msg: req.flash('msg')})
      } catch (error) {
          console.log(error) 
      }
  },

  create_booking: async (req, res) => {
      try {
  
      if (req.files && req.files.image) {
        var image = req.files.image;
  
        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }

      let user = await booking_model.create({
      categoryId: req.body.categoryId,
      userId: req.body.userId,
      workerId: req.body.workerId,
      image: req.body.image,
      SubCategoryId: req.body.SubCategoryId,
      price: req.body.price,
      description: req.body.description
      })
      req.flash("msg", " created successfully")
      res.redirect('/booking_list')
  
    } catch (error) {
        console.log(error)
    }
  },

  bookingsList: async(req, res)=>{
      try {
        let title = "bookingsList"
        let bookingdatas = await booking_model.find({deleted:false,}).sort({createdAt:-1}).populate("categoryId").populate("userId").populate("workerId").populate("SubCategoryId")
        res.render("Admin/booking/bookingsList", {title, bookingdatas, session: req.session.user, msg: req.flash('msg') })
       
      } catch (error) {   
        console.log(error)
      }
  },

  viewBooking: async(req, res)=> {
    try {
      let title = "bookingsList"
      const viewbooking = await booking_model.findById({_id: req.params.id}).populate("categoryId").populate("userId").populate("workerId").populate("SubCategoryId").populate('addressId');
      console.log(viewbooking, "jfkdjkfd")
     
      res.render("Admin/booking/viewBooking", {title, viewbooking, session: req.session.user, msg: req.flash('msg') })
     
    } catch (error) {   
      console.log(error)
    }
  }, 

  editBooking: async(req, res)=> {
    try {
        let title = "bookingsList"
        let user =  await user_model.find({role:1});
        let job_type = await category_model.find();
        let worker = await user_model.find({role:2});
        let editdata = await job_model.findById({_id: req.params.id})
        res.render('Admin/booking/editBooking', {title, user, job_type, worker, editdata, session: req.session.user, msg: req.flash('msg')})
    } catch (error) {
      console.log(error)  
    }
  },

  updateBooking: async(req, res)=> {
    try {

        if (req.files && req.files.image) {
            var image = req.files.image;
    
            if (image) {
              req.body.image = helper.imageUpload(image, "images");
            }
        }
         let update = await job_model.findByIdAndUpdate({_id: req.body.id}, 

            {   userId: req.body.userId,
                job_type: req.body.job_type,
                workerId: req.body.workerId,
                image: req.body.image,
                price: req.body.price,
                jobtitle: req.body.jobtitle,
              
            });

            req.flash("msg", "Updated successfully")  
            res.redirect('/bookingsList')

    } catch (error) {
      console.log(error);            
        }
  },

  bookingStatus: async (req, res) => {
    try {
      var check = await booking_model.updateOne(
        { _id: req.body.method_id },
        { status: req.body.status }
      );
      req.flash("msg", "Status update successfully");
      res.json(check);
    
      } catch (error) {
        console.log(error)
      }
  },

  filterData:async(req,res)=>{
      try{
        var where={}
        if(req.body.status!=""){
          where.status=req.body.status
        }
        var bookingsArr=await job_model.find(where).populate("userId").populate("workerId").populate("categoryId")
        return res.json(bookingsArr)
      }catch(error){
        console.log(error)
      }
  },

  deleteBooking: async(req, res)=> {
    try {
      let userid = req.body.id;
      let remove = await job_model.deleteOne({_id: userid})
      res.redirect('/bookingsList')
      
    } catch (error) {
      console.log(error)
    }
  },



}