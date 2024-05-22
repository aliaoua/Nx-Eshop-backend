const { Product } = require("../models/product");
const { Category } = require("../models/category");
const mongoose = require("mongoose");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValidFile = FILE_TYPE_MAP[file.mimetype];
    let uploadEroor = new Error("invalid image type");
    if (isValidFile) {
      uploadEroor = null;
    }
    cb(uploadEroor, `../back-end/public/uploads`);
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(/\s+/g, "-"); // Replace all spaces with "-"
    const extension = FILE_TYPE_MAP[file.mimetype];
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, ""); // Remove existing extension
    const newFileName = `${fileNameWithoutExtension}-${Date.now()}.${extension}`;
    cb(null, newFileName);
  },
});

const uploadOptions = multer({ storage: storage });

//Get products
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }
  const productLists = await Product.find(filter).populate("category"); //Fill the related field
  if (!productLists) {
    res.status(500).json({ success: false });
  }
  res.send(productLists);
});

//Get product
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});

// Create Product
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send("Invalid category");
    const file = req.file;
    if (!file) return res.status(400).send("No image in the request ");

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let product = new Product({
      name: req.body.name,
      image: `${basePath}${fileName}`,
      countInStock: req.body.countInStock,
      description: req.body.description,
      richDescription: req.body.richDescription,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();
    if (!product) {
      return res.status(500).send("The product cannot be created");
    } else {
      res.send(product);
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err });
  }
});

//Update a product
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product ID");
  }
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid category");
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid product");
  const file = req.file;

  let imagePath;
  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = product.image;
  }
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      image: imagePath,
      countInStock: req.body.countInStock,
      description: req.body.description,
      richDescription: req.body.richDescription,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );
  if (!updatedProduct) {
    res.status(400).send("the product can not be updated!");
  }
  res.send(updatedProduct);
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    let product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      return res
        .status(200)
        .json({ success: true, message: "the product is deleted" });
    } else {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
});

// Get products count
router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({ count: productCount });
});

//Get featured products
router.get("/get/featured/:count?", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredProducts = await Product.find({ isFeatured: true }).limit(
    +count
  );

  if (!featuredProducts) {
    res.status(500).json({ success: false });
  }
  res.send(featuredProducts);
});
router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).send("Invalid Product ID");
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send("Invalid product");
    const files = req.files;
    let imagesPaths;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    if (files) {
      imagesPaths = files.map((file) => {
        return `${basePath}${file.filename}`;
      });
    } else {
      return res.status(400).send("No images in the request");
    }

    const productWithGalleryImages = await Product.findByIdAndUpdate(
      req.params.id,
      { images: imagesPaths },
      { new: true }
    );
    if (!productWithGalleryImages) {
      res.status(400).send("Images couldn't be uploaded!");
    }
    res.send(productWithGalleryImages);
  }
);

module.exports = router;
