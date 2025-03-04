import nodemailer from 'nodemailer';
import pool from '../../lib/db'; // Your database connection
import authenticateToken from '../../lib/authMiddleware'; // JWT auth middleware
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';

const allowedOrigins = [
  'https://jointhewaitlist.netlify.app',
  'http://localhost:5173',
];

const cors = initMiddleware(
  Cors({
    methods: ['POST', 'OPTIONS'],
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin); // ✅ Allow if origin is in the list
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // ✅ Allows authentication headers
  })
);

export default async function handler(req, res) {
  // Run CORS middleware
  await cors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 🔒 Authenticate request
  const authError = authenticateToken(req, res);
  if (authError) {
    console.log('Authentication failed. Stopping execution.');
    return; // Stop execution if authentication fails
  }

  try {
    console.log('Authentication successful. Proceeding to send emails.');

    // Fetch all email addresses from the database
    const result = await pool.query('SELECT email FROM emails');
    const emailList = result.rows.map((row) => row.email);

    if (emailList.length === 0) {
      return res.status(404).json({ error: 'No emails found in database' });
    }

    const { subject, text, html } = req.body;

    let transporter = nodemailer.createTransport({
      service: 'Zoho',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_FROM_EMAIL,
      bcc: emailList.join(','),
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Emails sent successfully.');

    return res.status(200).json({ message: 'Bulk email sent successfully' });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return res.status(500).json({ error: 'Failed to send bulk email' });
  }
}
