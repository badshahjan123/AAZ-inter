const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Use Ethereal for dev if no real credentials, BUT user wants strict validation.
  // We need real SMTP or at least a structure that attempts it.
  // For now, I will use a placeholder configuration that user must update in .env
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'AAZ Medical'} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
