const asyncHandler = require("../utils/asyncHandler");
const { ErrorHandler } = require("../utils/errorHandlers");

/**
 * @param {Object} Model - pass the model name on which you're calling this middleware.
 * @description - This creates a new document in the databse in the specified collection (Model)
 * @Protected - true
 */

exports.create = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ status: "success", data: doc });
  });

/**
 * @param {Object} Model - pass the model name on which you're calling this middleware.
 * @description - This gets a document from the databse using id from specified collection (Model)
 * @Protected - depends
 */
exports.getById = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    res.status(200).json({
      status: "sucess",
      data: doc,
    });
  });

/**
 * @param {Object} Model - pass the model name on which you're calling this middleware.
 * @description - This gets all documents from the collection
 * @Protected - depends
 */
exports.getAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    const docs = await Model.find();
    res.status(200).json({
      status: "sucess",
      results: docs.length,
      data: docs,
    });
  });

/**
 * @param {Object} Model - pass the model name on which you're calling this middleware.
 * @description - This updates the specified document using id in the specified collection (Model)
 * @Protected - true
 */
exports.updateById = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return next(new ErrorHandler("Not doc found with that ID", 404));

    await doc.update(req.body, { new: true });
    res.status(200).json({
      status: "sucess",
      data: doc,
    });
  });

/**
 * @param {Object} Model - pass the model name on which you're calling this middleware.
 * @description - This deletes the specified document using id in the specified collection (Model)
 * @Protected - true
 */
exports.deleteById = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return next(new ErrorHandler("Not doc found with that ID", 404));

    await doc.remove();
    res.status(204).json({
      status: "sucess",
      mesage: "Doc deleted successfully!",
      data: doc,
    });
  });
