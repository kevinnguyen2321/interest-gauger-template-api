import pool from '../../lib/db'; // Import the database connection
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';
// Initialize the cors middleware
const cors = initMiddleware(
  Cors({
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: process.env.CORS_ORIGIN,
  })
);

export default async function handler(req, res) {
  // Run cors middleware
  await cors(req, res);

  if (req.method === 'OPTIONS') {
    // If it's a preflight request, respond with 200
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { firstName, lastName, email } = req.body; // Get data from request

    // Basic validation
    if (!firstName || !lastName || !email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    try {
      // Insert into the waitlist_emails table
      const result = await pool.query(
        'INSERT INTO emails (firstName, lastName, email) VALUES ($1, $2, $3) RETURNING *',
        [firstName, lastName, email]
      );

      // Return success response
      res.status(200).json({
        message: 'Successfully added to waitlist',
        user: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error inserting data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
