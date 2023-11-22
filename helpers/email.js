const nodemailer = require("nodemailer");

module.exports = {
  sendEmail: async (email) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.API_EMAIL,
        pass: process.env.API_EMAIL_PASSWORD,
      },
    });
    const random = Math.random().toString().substr(2, 6);
    await transporter.sendMail({
      from: '"ArkiRemit" <agetachew73@gmail.com>',
      to: email,
      subject: "Arkiremit Verification Code",
      text: "",
      html:
        "<p>This is your verification code <strong>" + random + "</strong></p>",
    });
    return random;
  },
};
