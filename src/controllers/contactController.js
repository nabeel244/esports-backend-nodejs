const path = require("path");

const nodemailer = require("nodemailer");
const { default: isEmail } = require("validator");

const ContactUsForm = require("../models/contactModel");
const factory = require("./factoryController");
const asyncHandler = require("../utils/asyncHandler");
const { ErrorHandler } = require("../utils/errorHandlers");
const { Email } = require("../utils/sendEmail");

exports.createUserResponse = asyncHandler(async (req, res, next) => {
  const { name, email, message } = req.body;
  const subject = "New Query from website contact form";

  const mailOptions = {
    from: email,
    to: process.env.ADMIN_EMAIL,
    subject,
    text: message,
  };
  const templateOptions = {
    name,
    subject,
    templateName: "contact",
    text: message,
  };

  const mail = new Email(mailOptions, templateOptions);
  await mail.send();

  const response = await ContactUsForm.create(req.body);
  res.status(201).json({
    status: "success",
    message: "Message sent successfully!",
    data: response,
  });
});

exports.getAllQueries = factory.getAll(ContactUsForm);
exports.deleteContact = factory.deleteById(ContactUsForm);
exports.getContact = factory.getById(ContactUsForm);
