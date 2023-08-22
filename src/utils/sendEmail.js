const nodemailer = require("nodemailer");
const asyncHandler = require("./asyncHandler");
const path = require("path");
const ejs = require("ejs");

class Email {
  constructor(mailOptions, templateOptions) {
    this.mailOptions = mailOptions;
    this.templateOptions = templateOptions;
  }

  transporter() {
    return nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_PASSWORD,
      },
    });
  }

  async send() {
    const pathToTemplate = path.resolve(
      process.cwd(),
      `views/${this.templateOptions.templateName}.ejs`
    );
    console.log();

    const html = await ejs.renderFile(pathToTemplate, this.templateOptions);
    this.mailOptions.html = html;

    await this.transporter().sendMail(this.mailOptions);
  }
}

module.exports = { Email };

// module.exports = sendEmail;
