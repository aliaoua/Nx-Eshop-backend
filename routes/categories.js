const { Category } = require("../models/category");

const express = require("express");
const router = express.Router();
//Get categories
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(categoryList);
});
// Get category by id
router.get(`/:id`, async (req, res) => {
  let category = await Category.findById(req.params.id);
  if (!category) {
    res.status(500).send("The category with the given ID was not found!");
  }
  res.status(200).send(category);
});

// Add new Category
router.post(`/`, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();
  if (!category) {
    res.status(404).send("the category can not be created!");
  }
  res.send(category);
});

//Update category
router.put("/:id", async (req, res) => {
  const { name, icon, color } = req.body;
  const updatedCategory = {
    name,
    color,
    icon,
  };

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    updatedCategory,
    { new: true }
  );
  if (!category) {
    res.status(400).send("the category can not be updated!");
  }
  res.send(category);
});
//Delete category by id
router.delete("/:id", async (req, res) => {
  try {
    let category = await Category.findByIdAndDelete(req.params.id);
    if (category) {
      return res
        .status(200)
        .json({ success: true, message: "the category is deleted" });
    } else {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
});

module.exports = router;
