import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, text, html } = req.body;

  let transporter = nodemailer.createTransport({
    service: 'Zoho', 
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASSWORD, 
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL, 
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
