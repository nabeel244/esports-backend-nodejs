const asyncHandler = require("../utils/asyncHandler");
const factory = require("./factoryController");
const Product = require("../models/productModel");
const multer = require("multer");
const { ErrorHandler } = require("../utils/errorHandlers");
const { codeGenerator } = require("../utils/codeGenerator");

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/products/");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const filename = `${
      file.originalname.split(".")[0]
    }-${codeGenerator()}.${ext}`;
    cb(null, filename);
  },
});
const multerUpload = multer({ storage: storage });

exports.uploadImgs = multerUpload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

exports.createProduct = asyncHandler(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files["thumbnail"]) {
    return next(new ErrorHandler("thumbnail is required", 400));
  }
  req.body.thumbnail = req.files["thumbnail"][0].filename;
  if (req.files["images"]) {
    req.body.images = req.files["images"].map((file) => {
      return file.filename;
    });
  }
  req.body.owner = {
    name: req.user.name,
    userId: req.user.id,
  };
  // console.log(req.body);
  const product = await Product.create(req.body);
  res.status(201).json({ status: "sucess", data: product });
});

exports.byCategory = asyncHandler(async (req, res, next) => {
  const docs = await Product.find({ category: req.query.category });
  res.status(200).json({
    status: "sucess",
    results: docs.length,
    data: docs,
  });
});

exports.bySubcategory = asyncHandler(async (req, res, next) => {
  const docs = await Product.find({
    category: req.query.category,
    subCategory: req.query.subCategory,
  });
  res.status(200).json({
    status: "sucess",
    results: docs.length,
    data: docs,
  });
});

exports.update = asyncHandler(async (req, res, next) => {
  const doc = await Product.findById(req.params.id);
  if (!doc) return next(new ErrorHandler("No product found with that ID", 404));
  if (doc.owner.userId.toHexString() !== req.user.id) {
    return next(new ErrorHandler("You cannot edit this product", 403));
  }

  if (req.files["thumbnail"]) {
    req.body.thumbnail = req.files["thumbnail"][0].filename;
  }
  if (req.files["images"]) {
    req.body.images = req.files["images"].map((file) => {
      return file.filename;
    });
  }
  await doc.updateOne(req.body, { new: true, runValidators: true });
  res.status(200).json({
    status: "sucess",
    data: doc,
  });
});

exports.getProduct = factory.getById(Product);
exports.getAllProducts = factory.getAll(Product);
exports.delete = factory.deleteById(Product);
