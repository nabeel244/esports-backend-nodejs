const multer = require("multer");
const File = require("../models/fileModel");
const asyncHandler = require("../utils/asyncHandler");
const factory = require("../controllers/factoryController");
const { ErrorHandler } = require("../utils/errorHandlers");
const { codeGenerator } = require("../utils/codeGenerator");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/pdfs");
  },
  filename: function (req, file, cb) {
    console.log(file);
    const ext = file.mimetype.split("/")[1];
    const filename = `${
      file.originalname.split(".")[0]
    }-${codeGenerator()}.${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    console.log(file.mimetype);
    if (file.mimetype === "application/pdf") cb(null, true);
    else return cb(new ErrorHandler("Only .pdf files are supported"));
  },
});

exports.uploadFile = upload.fields([
  {
    name: "fines",
    maxCount: 1,
  },
  { name: "waiver", maxCount: 1 },
]);

exports.createFile = asyncHandler(async (req, res, next) => {
  const { body } = req;
  if (req.files.fines) req.body.fines = req.files.fines[0].filename;
  if (req.files.waiver) req.body.waiver = req.files.waiver[0].filename;
  const file = await File.create(body);
  res.json({
    status: "Success",
    message: "File uploaded successfully!",
    file,
  });
});

exports.updateFile = asyncHandler(async (req, res, next) => {
  if (req.body.fines) req.body.fines = req.files.fines[0].filename;
  if (req.body.waiver) req.body.waiver = req.files.waiver[0].filename;

  const file = await File.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({
    status: "Success",
    message: "Updated Successfully!",
    file,
  });
});

exports.getAllFiles = factory.getAll(File);
exports.getFile = factory.getById(File);
exports.deleteFile = factory.deleteById(File);
