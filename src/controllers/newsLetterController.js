const nodemailer = require("nodemailer");
const asyncHandler = require("../utils/asyncHandler");
const { ErrorHandler } = require("../utils/errorHandlers");
const factory = require("../controllers/factoryController");
const News = require("../models/newletterModel");
const { Email } = require("../utils/sendEmail");

exports.subscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const name = email.split("@")[0];

  const mailOptions = {
    to: req.body.email,
    from: process.env.GOODLE_EMAIL,
    subject: "EBC newsletter subscription",
  };

  const templateOptions = {
    templateName: "subscribenewsletter",
    name,
  };

  const mail = new Email(mailOptions, templateOptions);
  await mail.send();

  const newSubsriber = await News.create({ email, name });
  res.status(201).json({
    status: "succes",
    message: "you've subscribed successfully to EBC news letter!",
    newSubsriber,
  });
});

exports.newsLetter = asyncHandler(async (req, res, next) => {
  const news = await News.find({});
  for (let el of news) {
    const mailOptions = {
      to: el.email,
      from: process.env.ADMIN_EMAIL,
      subject: req.body.subject,
      text: req.body.text,
    };
    const templateOptions = {
      templateName: "news",
      text: req.body.text,
    };
    const mail = new Email(mailOptions, templateOptions);
    await mail.send();
  }
  res.json({
    status: "Success",
    message: "Newsletter Sent successfully!",
    data: news,
  });
});

exports.getAllSubscribers = factory.getAll(News);
exports.deleteNews = factory.deleteById(News);
