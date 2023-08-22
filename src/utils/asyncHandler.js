// It will catch async error, so we don't need to use try/catch blocks.
const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = asyncHandler;
