let category_model = require('../../model/Admin/category_model')
let helper = require('../../Helper/helper')


module.exports = { 

    add_category: async(req, res)=> {
        try {
            let title = "category_list"
            res.render('Admin/category/add_category', { msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },


    Create_category: async (req, res) => {
        try {
    
   
     let user = await category_model.create({
  name: req.body.name,
  mrdnumber: req.body.mrdnumber,
  date: req.body.date,
  number: req.body.number,
  doctorname: req.body.doctorname,
  services: req.body.services,
  facilities: req.body.facilities,
         Suggestion: req.body.Suggestion,
         abhaid:req.body.abhaid,
  
  
})
        req.flash("msg", "Category created successfully")
      
        res.json(user)
    
      } catch (error) {
          console.log(error)
      }
    },

    category_list: async(req, res)=> {
        try {
            title = "category_list"
            let catedata = await category_model.find().sort({createdAt:-1})
            res.render('Admin/category/category_list', {title, catedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },
   General_list: async(req, res)=> {
        try {
            title = "General_list"
            let catedata = await category_model.find({ services: "Gernal" }).sort({ createdAt: -1 })
            console.log(catedata,"catedatacatedata")
            res.render('Admin/category/General_list.ejs', {title, catedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },
      Private_list: async(req, res)=> {
        try {
            title = "Private_list"
            let catedata = await category_model.find({ services: "Private" }).sort({ createdAt: -1 })
            console.log(catedata,"catedatacatedata")
            res.render('Admin/category/Private_list.ejs', {title, catedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },
          Evening_list: async(req, res)=> {
        try {
            title = "Evening_list"
            let catedata = await category_model.find({ services: "Evening" }).sort({ createdAt: -1 })
            console.log(catedata,"catedatacatedata")
            res.render('Admin/category/Evening_list.ejs', {title, catedata, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },
    view_category: async(req, res)=> {
        try {
            let title = ""
            let cateData = await category_model.findById({_id: req.params.id})
            res.render('Admin/category/view_category', { title, cateData, session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    edit_category: async(req, res)=> {
        try {
            let title = ""
            let editData = await category_model.findById({_id: req.params.id})
            res.render('Admin/category/edit_category', { title, editData,  session: req.session.user, msg: req.flash('msg') })
        } catch (error) {
            console.log(error)
        }
    },

    update_category: async(req, res)=> {
        try {
            if (req.files && req.files.image) {
                var image = req.files.image;
          
                if (image) {
                  req.body.image = helper.imageUpload(image, "images");
                }
              }
            
            let user = await category_model.updateOne({_id: req.body.id},
                {
                    image: req.body.image,
                    name: req.body.name,

                } );
                req.flash("msg", "Updated successfully")
                res.redirect('/category_list')
                
            } catch (error) {
                console.log(error)
            }
    },

    delete_category: async(req, res)=> {
        try {
          let userid = req.body.id;
          let remove = await category_model.deleteOne({_id: userid})
          res.redirect('/category_list')
          
        } catch (error) {
          console.log(error)
        }
    },

    category_status: async (req, res) => {
        try {
          
        var check = await category_model.updateOne(
          { _id: req.body.id },
          { status: req.body.value }
        );
        
        req.flash("msg", "Status update successfully");
          
        if (req.body.value == 0) res.send(false);
        if (req.body.value == 1) res.send(true);
      
      
    
        } catch (error) {
          console.log(error)
        }
    },


    

   

    





}