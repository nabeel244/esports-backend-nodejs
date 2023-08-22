const asyncHandler = require("../utils/asyncHandler");
const factory = require("./factoryController");
const BlogPost = require("../models/blogModel");
const multer = require("multer");
const { ErrorHandler } = require("../utils/errorHandlers");
const { codeGenerator } = require("../utils/codeGenerator");

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/blogs/");
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
exports.upload = multerUpload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
/**
 * @description - returns all the popular posts
 * @route - GET api/v1/blogs/popular
 */

exports.popular = asyncHandler(async (req, res, next) => {
  const blogs = await BlogPost.find().sort({ date: -1 }).limit(8);
  res.status(200).json({
    status: "succes",
    results: blogs.length,
    data: blogs,
  });
});

/**
 * @description - returns all related posts written by the same author.
 * @route - GET api/v1/blogs/related
 */
exports.related = asyncHandler(async (req, res) => {
  let author;
  if (req.query.author) {
    ({ author } = req.query);
    // console.log(author);
  } else {
    const blogs = await BlogPost.find();
    author = blogs[`${Math.floor(Math.random() * blogs.length)}`].author;
    // console.log(author);
  }
  const posts = await BlogPost.find({ author }).limit(4);
  if (!posts) return next(new ErrorHandler("No doc found with that ID", 404));
  res.status(200).json({
    status: "succes",
    results: posts.length,
    data: posts,
  });
});

exports.fbShare = async (req, res) => {
  const { id } = req.params;
  res.redirect(
    `https://www.facebook.com/sharer/sharer.php?u=${req.get(
      "hostname"
    )}/api/v1/blogs${id}`
  );
};

exports.twitterShare = async (req, res) => {
  const { id } = req.params;
  res.redirect(
    `https://www.twitter.com/share?url=${req.protocol}://${req.get(
      "host"
    )}/api/v1/blogs/${id}`
  );
};

exports.instaShare = async (req, res) => {
  const { id } = req.params;
  res.redirect(
    `https://www.instagram.com/direct/inbox/${req.get(
      "host"
    )}/api/v1/blogs/${id}`
  );
};

exports.ytShare = async (req, res) => {
  const { id } = req.params;
  res.redirect(
    `https://studio.youtube.com/channel/content/podcasts${req.get(
      "host"
    )}/api/v1/blogs/${id}`
  );
};

exports.discordShare = async (req, res) => {
  const { id } = req.params;
  res.redirect(
    `https://discord.com/channels/${req.get("host")}/api/v1/blogs/${id}`
  );
};

exports.createBlog = asyncHandler(async (req, res, next) => {
  req.body.thumbnail = req.files["thumbnail"][0].filename;
  if (req.body.images) {
    req.body.images = req.files["images"].map((file) => {
      return file.filename;
    });
  }
  req.body.author = req.user.name;
  req.body.userId = req.user.id;
  const blog = await BlogPost.create(req.body);
  res.status(201).json({ status: "sucess", data: blog });
});

exports.updateBlog = asyncHandler(async (req, res, next) => {
  if (req.files["thumbnail"]) {
    req.body.thumbnail = req.files["thumbnail"][0].filename;
  }
  if (req.files["images"]) {
    req.body.images = req.files["images"].map((file) => {
      return file.filename;
    });
  }

  let doc = await BlogPost.findById(req.params.id);
  if (!doc) return next(new ErrorHandler("No doc found with that ID", 404));
  if (doc.userId.toHexString() !== req.user.id || req.user.role !== "admin") {
    return next(new ErrorHandler("Sorry You can't update"));
  }

  doc = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json({
    status: "sucess",
    data: doc,
  });
});

exports.getBlog = asyncHandler(async (req, res, next) => {
  const doc = await BlogPost.findById(req.params.id).populate("userId");
  if (!doc) return next(new ErrorHandler("No doc found with that ID", 404));
  res.status(200).json({
    status: "sucess",
    data: doc,
  });
});
exports.getAllBlogs = factory.getAll(BlogPost);
exports.deleteBlog = factory.deleteById(BlogPost);
