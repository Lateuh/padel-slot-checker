const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();

// Transporteur SMTP pour Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.USERNAME,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmailNotification(toEmail, subject, text) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail,
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
