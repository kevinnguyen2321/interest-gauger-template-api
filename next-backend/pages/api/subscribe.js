import pool from '../../lib/db'; // Import the database connection
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';
import authenticateToken from '../../lib/authMiddleware'; // ✅ Import the auth middleware

// Initialize the cors middleware
// const cors = initMiddleware(
//   Cors({
//     methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
//     origin: process.env.CORS_ORIGIN,
//   })
// );

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
  // Run cors middleware
  await cors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    try {
      const result = await pool.query(
        'INSERT INTO emails (firstName, lastName, email) VALUES ($1, $2, $3) RETURNING *',
        [firstName, lastName, email]
      );

      // ✅ Send an email confirmation
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sendEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Thank You for Joining the Waitlist!',
          text: `Dear ${firstName},

  Thank you for signing up for our waitlist! We’re excited to have you on board and appreciate your interest in ConcertTrack.

  Stay tuned for future announcements, including updates on our progress and the official launch date. We can't wait to share more with you soon!

  If you have any questions or feedback, feel free to reply directly to me at kevin.nguyen9703@gmail.com.

  Best regards,  
  Kevin Nguyen`,
          html: `<p>Dear ${firstName},</p>
                   <p>Thank you for signing up for our waitlist! We’re excited to have you on board and appreciate your interest in <strong>ConcertTrack</strong>.</p>
                   <p>Stay tuned for future announcements, including updates on our progress and the official launch date. We can't wait to share more with you soon!</p>
                   <p>If you have any questions or feedback, feel free to email me directly at kevin.nguyen9703@gmail.com.</p>
                   <p>Best regards,<br><strong>Kevin Nguyen</strong></p>`,
        }),
      });

      res.status(200).json({
        message: 'Successfully added to waitlist and email sent',
        user: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error inserting data' });
    }
  } else if (req.method === 'GET') {
    // 🔒 Protect the GET request
    const authError = authenticateToken(req, res);
    if (authError) return authError;

    try {
      const result = await pool.query('SELECT * FROM emails');

      res.status(200).json({
        message: 'Emails retrieved successfully',
        emails: result.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching data' });
    }
  } else if (req.method === 'DELETE') {
    // 🔒 Protect the DELETE request
    const authError = authenticateToken(req, res);
    if (authError) return authError;

    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await pool.query(
        'DELETE FROM emails WHERE email = $1 RETURNING *',
        [email]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }

      res.status(200).json({
        message: `Successfully deleted the email: ${email}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
