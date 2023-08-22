const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const { ErrorHandler } = require("../utils/errorHandlers");
const asyncHandler = require("../utils/asyncHandler");
// const Token = require("../models/token");
const User = require("../models/userModel");
const factory = require("./factoryController");
const { Email } = require("../utils/sendEmail");

/**
 * Generates a JWT token for the given user ID
 * @param {String} id - The user ID to generate the token for
 * @returns {String} The JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SEC, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Sends the JWT token in a cookie
 * @param {Object} user - The user object to generate the token for
 * @param {Number} statusCode - The HTTP status code to send in the response
 * @param {Object} res - The response object
 */
const sendCookieToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    maxAge: process.env.JWT_MAX_AGE * 24 * 60 * 60 * 1000,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  res.cookie("token", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

/**
 * Controller for user registration
 * @param {String} role - The user role to register (either "user" or "admin")
 */
exports.userRegistration = (role) =>
  asyncHandler(async (req, res, next) => {
    const { name, username, email, password } = req.body;

    // Check if user with this email and username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return next(new ErrorHandler("User already exists", 400));
    }

    // Create new user in the database
    const newUser = await User.create({
      name,
      username,
      email,
      password,
      role,
    });

    // Generate verification token and send verification email
    // const verificationToken = jwt.sign({ email }, process.env.JWT_SEC);

    // const verificationLink = `${req.protocol}://${req.hostname}:${process.env.PORT}${req.baseUrl}/verify/${newUser.id}/${verificationToken}`;

    const mailOptions = {
      from: process.env.GOOGLE_EMAIL,
      to: newUser.email,
      subject: "Verify Email",
    };

    const templateOptions = {
      title: "Account Verification",
      link: verificationLink,
      templateName: "emailVerification",
      subject: "Verify Email",
    };

    const mail = new Email(mailOptions, templateOptions);
    await mail.send();

    // Remove password from response and send the JWT token in a cookie
    newUser.password = undefined;
    sendCookieToken(newUser, 201, req, res);
  });

/**
 * Middleware to check if the user has verified their email
 */
exports.isVerified = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select("verified");

  if (!user || !user.verified) {
    return res.status(401).json({
      status: "error",
      message: "Please verify your email before proceeding",
    });
  }

  next();
});

/**
 * Controller to verify a user's email
 */
exports.verify = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id });
  const token = req.params.token;
  if (!user || !token) {
    return res.status(400).send("Invalid link");
  }

  await User.updateOne({ _id: user._id, verified: true });
  return res.status(201).json({
    status: "success",
    message: "Account verified successfully.",
  });
});

/**

    @description This is a login controller.
    @route POST /api/v1/users/login
    @middleware isVerified
    @protected false
    */
exports.userLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  if (user.role !== "admin")
    return next(
      new ErrorHandler("sorry only admin can login through this route.")
    );

  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  sendCookieToken(user, 200, req, res);
});

/**

    @description This is a reset password controller.
    @route POST /api/v1/users/resetPassword
    @middleware isVerified
    @protected false
    */
exports.resetMail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  let token = await Token.findOne({ userId: user._id });
  if (!token) {
    token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
  }

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${user._id}/${token.token}`;

  const mailOptions = {
    to: user.email,
    from: process.env.GOOGLE_EMAIL,
    subject: "Password Reset",
  };

  const templateOptions = {
    templateName: "passReset",
    resetLink: resetPasswordUrl,
  };

  const mail = new Email(mailOptions, templateOptions);
  await mail.send();

  return res.status(201).json({
    status: "success",
    message: "Check your email to reset password.",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid link or expired", 404));
  }

  const token = await Token.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!token) {
    return next(new ErrorHandler("Invalid link or expired", 404));
  }

  if (await user.comparePassword(req.body.password, user.password)) {
    return res.json("Cannot use old password! Choose a new one");
  }

  user.password = req.body.password;
  await user.save();
  await token.delete();

  return res.status(201).json({
    status: "success",
    message: "Password reset successfully",
    data: user,
  });
});

/**

/**
 * @description Update currently logged in user's password
 * @route PUT api/v1/users/updateMyPassword
 */
exports.updateMyPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isSame = await user.comparePassword(
    req.body.oldPassword,
    user.password
  );

  if (!isSame) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  user.password = undefined;
  return res.status(201).json({
    status: "success",
    message: "Password updated successfully",
    data: user,
  });
});

/**
 * @description Delete currently logged in user
 * @route DELETE api/v1/users/deleteMe
 */
exports.deleteMe = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ status: "success", message: "User deleted successfully!" });
});

/**
 * @param {Object} obj The request body to be filtered
 * @param {Array} allowedFields The fields to be allowed
 * @returns {Object} An object that is to be updated
 */
// const filterObj = (obj, ...restrictedFields) => {
//   const newObj = {};
//   Object.keys(obj).forEach((field) => {
//     if (restrictedFields.includes(field)) {
//       newObj[field] = undefined;
//     } else {
//       newObj[field] = obj[field];
//     }
//   });
//   return newObj;
// };

/**
 * @description Update currently logged in user's data
 * @route PATCH api/v1/users/updateMe
 */
exports.updateMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (req.body.password) {
    return next(new ErrorHandler("Please use /updateMyPassword route instead"));
  }

  const allowedFields = ["name", "paypal", "metamask", "info"];
  for (let key in req.body) {
    if (!allowedFields.includes(key))
      return next(new ErrorHandler(`${key} is not allowed to update`, 403));
  }

  let filteredBody = {};
  Object.entries(req.body).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      Object.entries(key).forEach(([key1, value1]) => {
        if (["location", "friendCode", "socialLinks"].includes(key1)) {
          filteredBody[key.key1] = value1;
        }
      });
      filteredBody[key] = value;
    }
  });
  console.log(filteredBody);

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: updatedUser,
  });
});

/**
 * @description Protect routes from unauthenticated users
 */
exports.protectRoutes = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt || req.cookies.token) {
    token = req.cookies.jwt || req.cookies.token;
  }

  if (!token) {
    return next(new ErrorHandler("Please Log in to get access", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SEC);
  const { name, role, id, email, username } = await User.findById(decoded.id);
  const currentUser = { name, role, id, email, username };

  req.user = currentUser;
  next();
});

/**
 * @description This route restricts access to only users with an admin role.
 * @route GET api/v1/users
 * @access Private/Admin
 */
exports.adminOnly = asyncHandler(async (req, res, next) => {
  const { role } = await User.findById(req.user.id);
  if (role !== "admin") {
    return next(new ErrorHandler("Admin only route", 401));
  }
  next();
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getById(User);
exports.updateUser = factory.updateById(User);
exports.deleteUser = factory.deleteById(User);
