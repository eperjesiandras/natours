const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Andras Eperjesi <${process.env.EMAIL_FROM}>`;
  }

  createProductionTransport() {
    if (process.env.NODE_ENV === "production") {
      /*🖥️SENDGRID*/
      return nodemailer.createTransport({
        service: "Sendgrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      //service: "Gmail",
      /*for gmail you should activate "less secure app" in gmail, but instead use sendGrid or mailgun*/
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /*🗃️SEND THE ACTUAL EMAIL: */
  async send(template, subject) {
    /*⚙️RENDER HTML BASED ON A PUG TEMPLATE*/
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    }); /*we pass this object to personalize the email with the custom name and url and subject*/

    /*⚙️DEFINE EMAIL OPTIONS*/
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
      // html:
    };

    /*⚙️CREATE A TRANSPORT AND SEND EMAIL*/
    await this.createProductionTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send("passwordReset", "Your password reset token (valid for 10 minutes)");
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
