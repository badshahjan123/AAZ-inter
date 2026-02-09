require('dotenv').config();
const nodemailer = require('nodemailer');

const sendTestEmail = async () => {
  console.log('TEST_START');
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD 
      }
    });

    console.log(`Sending from: ${process.env.SMTP_EMAIL}`);
    
    await transporter.verify();
    console.log('SMTP Connection Verified');

    const info = await transporter.sendMail({
      from: `"Test" <${process.env.SMTP_EMAIL}>`,
      to: process.env.SMTP_EMAIL,
      subject: 'Test Email',
      text: 'Works!',
    });
    console.log('SENT_SUCCESS');
  } catch (error) {
    console.log('SENT_FAILED');
    console.error(error.message);
    if (error.response) console.error(error.response);
    process.exit(1); 
  }
};

sendTestEmail();
