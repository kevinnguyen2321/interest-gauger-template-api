import pool from '../../lib/db'; // Import the database connection
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';
import jwt from 'jsonwebtoken';

// Initialize the cors middleware
const cors = initMiddleware(
  Cors({
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    origin: process.env.CORS_ORIGIN,
  })
);

// Middleware to check JWT token
function authenticateToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
}

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

      res.status(200).json({
        message: 'Successfully added to waitlist',
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
