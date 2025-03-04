const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();
const { writeEmailHistory, checkSpam } = require('./mail_service');

// Transporteur SMTP pour Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.PADEL_USERNAME,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmailNotification(subject, text) {
  let toEmails = process.env.EMAIL_SUBSCRIBERS.split(',');
  if (process.env.NODE_ENV === 'debug') toEmails = toEmails[0];

  const mailOptions = {
    from: process.env.PADEL_USERNAME,
    to: toEmails,
    subject: subject,
    text: text,
  };

  try {
    const isSpamming = await checkSpam();

    if (!isSpamming) {
      await transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès');
      await writeEmailHistory();
    } else {
      if (process.env.NODE_ENV === 'debug') console.log('Email non envoyé car spamming détecté');
    }

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
  }
}



module.exports = { sendEmailNotification };
