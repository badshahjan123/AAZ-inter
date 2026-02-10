const axios = require('axios');

/**
 * Send email using Resend HTTP API
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.message - Plain text (optional)
 * @returns {Promise<void>}
 */
const sendEmail = async (options) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    console.log(`📧 Sending email to: ${options.email}`);

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: process.env.FROM_EMAIL || 'AAZ International <onboarding@resend.dev>',
        to: [options.email],
        subject: options.subject,
        html: options.html,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Email sent successfully! ID:', response.data.id);
  } catch (error) {
    console.error('❌ Failed to send email:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('  Error:', error.message);
    }
    // Don't throw - let registration continue even if email fails
  }
};

module.exports = sendEmail;
