let category_model = require("../../model/Admin/category_model");
let helper = require("../../Helper/helper");
let SubCategory = require("../../model/Admin/subcategory_model");

module.exports = {
  addSubCategory: async (req, res) => {
    try {
      let title = "occupation_listing";
      const get_data = await category_model
        .find({ deleted: false })
        .sort({ createdAt: -1 });

      res.render("Admin/subCategory/add_subCategory.ejs", {
        title,
        get_data,
        session: req.session.user,
        msg: req.flash("msg"),
      });
    } catch (error) {
      console.log(error);
    }
  },

  add_SubCategory: async (req, res) => {
    try {
      if (req.files && req.files.image) {
        var image = req.files.image;

        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }

      let addSubCategory = await SubCategory.create({
        name: req.body.name,
        image: req.body.image,
        categoryId: req.body.categoryId,
      });
      console.log(addSubCategory, "addSubCategory");
      // return
      res.redirect("/subcategory_listing");
    } catch (error) {
      console.log(error);
    }
  },

  subCategory_listing: async (req, res) => {
    try {
      const title = "occupation_listing";
      const categoryId = req.query.categoryId;

      const get_data = await category_model
        .find({ deleted: false })
        .sort({ createdAt: -1 });

      let occupationlist;

      if (categoryId) {
        occupationlist = await SubCategory.find({
          deleted: false,
          categoryId: categoryId,
        })
          .populate("categoryId", "name")
          .sort({ createdAt: -1 });
      } else {
        // If no categoryId is selected, show all subcategories
        occupationlist = await SubCategory.find({ deleted: false })
          .populate("categoryId", "name")
          .sort({ createdAt: -1 });
      }

      // Render the page with filtered data and pass the categoryId
      res.render("Admin/subCategory/subCategory_list.ejs", {
        title,
        occupationlist,
        get_data, // All categories for the dropdown
        session: req.session.user,
        msg: req.flash("msg"),
        categoryId, // Pass categoryId to the view
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  },

  // const occupationlist = await subCategoryModel.find({ deleted: false}).populate("categoryId", "name").sort({ createdAt: -1 });

  // view_tools: async (req, res) => {
  //     try {
  //         let title = "tools_listing"
  //         let occupationData = await tools_model.findById({ _id: req.params.id })
  //         res.render('Admin/Occupation/view_tools', { title, occupationData, session: req.session.user, msg: req.flash('msg') })
  //     } catch (error) {
  //         console.log(error)
  //     }
  // },

  edit_SubCategory: async (req, res) => {
    try {
      let title = "tools_listing";
      let editData = await SubCategory.findById({ _id: req.params.id });

      res.render("Admin/subCategory/edit_subCategory.ejs", {
        title,
        editData,
        session: req.session.user,
        msg: req.flash("msg"),
      });
    } catch (error) {
      console.log(error);
    }
  },

  update_SubCategory: async (req, res) => {
    try {
      if (req.files && req.files.image) {
        var image = req.files.image;

        if (image) {
          req.body.image = helper.imageUpload(image, "images");
        }
      }

      await SubCategory.updateOne(
        { _id: req.body.id },
        {
          name: req.body.name,
          image: req.body.image,
        }
      );
      req.flash("msg", "Updated successfully");
      res.redirect("/subcategory_listing");
    } catch (error) {
      console.log(error);
    }
  },

  delete_SubCategory: async (req, res) => {
    try {
      let userid = req.body.id;
      // await occupation_model.deleteOne({ _id: userid })
      await SubCategory.updateOne(
        { _id: req.body.id },
        {
          deleted: true,
        }
      );
      res.redirect("/occupation_listing");
    } catch (error) {
      console.log(error);
    }
  },

  SubCategory_status: async (req, res) => {
    try {
      await SubCategory.updateOne(
        { _id: req.body.id },
        { status: req.body.value }
      );
      req.flash("msg", "Status update successfully");

      if (req.body.value == 0) res.send(false);
      if (req.body.value == 1) res.send(true);
    } catch (error) {
      console.log(error);
    }
  },
};
