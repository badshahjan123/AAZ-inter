const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendTestEmail = async () => {
  console.log('TEST_START');
  try {
    const { data, error } = await resend.emails.send({
      from: 'AAZ Medical <onboarding@resend.dev>',
      to: process.env.SMTP_EMAIL,
      subject: 'Resend Test Email',
      html: '<p>Resend is working!</p>',
    });

    if (error) {
       console.error('RESEND_ERROR', error);
       process.exit(1);
    }

    console.log('SENT_SUCCESS', data.id);
  } catch (error) {
    console.log('SENT_FAILED');
    console.error(error.message);
    process.exit(1);
  }
};

sendTestEmail();
