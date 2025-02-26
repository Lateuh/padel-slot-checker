const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();

// Transporteur SMTP pour Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.PADEL_USERNAME,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmailNotification(subject, text) {
  const toEmails = process.env.EMAIL_SUBSCRIBERS.split(',');

  const mailOptions = {
    from: process.env.PADEL_USERNAME,
    to: toEmails,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
  }
}

module.exports = { sendEmailNotification };
