const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'AAZ Medical <onboarding@resend.dev>', // Resend free tier restriction
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }

    console.log('Message sent via Resend: %s', data.id);
  } catch (err) {
    console.error('Email caught error:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
