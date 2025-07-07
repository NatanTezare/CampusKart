// src/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // We are using Gmail, but this can be configured for other services
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'CampusKart Admin <campuskart2@gmail.com>', // Sender addrss
        to: options.email, // List of receivers
        subject: options.subject, // Subject line
        html: options.message, // HTML body
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;