const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Handle contact form submission - sends email to admin
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, email, subject, message)',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Build the email HTML
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f7fa; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0d47a1, #1976d2); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">📩 New Contact Inquiry</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">AAZ International - Contact Form</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 32px 24px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; width: 120px; vertical-align: top;">From:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; vertical-align: top;">Email:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                <a href="mailto:${email}" style="color: #1976d2; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; vertical-align: top;">Subject:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #555; vertical-align: top;">Message:</td>
              <td style="padding: 12px 0; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>

          <!-- Reply Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
               style="display: inline-block; background: #1976d2; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Reply to ${name}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 16px; color: #999; font-size: 12px;">
          <p>This message was sent via the AAZ International website contact form.</p>
        </div>
      </div>
    `;

    // Send email to admin
    const adminEmail = process.env.CONTACT_EMAIL || process.env.SMTP_EMAIL || 'aazint808@gmail.com';

    await sendEmail({
      email: adminEmail,
      subject: `[Contact Form] ${subject} - from ${name}`,
      html: htmlContent,
    });

    // Send auto-reply to the user
    const autoReplyHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0d47a1, #1976d2); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Thank You for Contacting Us</h1>
        </div>
        <div style="background: white; padding: 32px 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Dear <strong>${name}</strong>,
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Thank you for reaching out to AAZ International. We have received your inquiry regarding 
            "<strong>${subject}</strong>" and our team will get back to you within 24 hours.
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            If your matter is urgent, please contact us directly at <a href="tel:+923453450644" style="color: #1976d2;">+92 345 3450644</a> 
            or via WhatsApp.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 13px;">
            Best regards,<br>
            <strong>AAZ International</strong><br>
            Your Trusted Partner in Medical Equipment
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: email,
      subject: `Thank you for contacting AAZ International`,
      html: autoReplyHtml,
    });

    console.log(`✅ Contact form submitted by: ${name} (${email})`);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you shortly.',
    });

  } catch (error) {
    console.error('❌ Contact form error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or contact us directly.',
    });
  }
};

module.exports = { submitContactForm };
