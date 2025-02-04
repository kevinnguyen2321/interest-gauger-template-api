import pool from '../../lib/db'; // Import the database connection
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';
// Initialize the cors middleware
const cors = initMiddleware(
  Cors({
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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
  } else if (req.method === 'GET') {
    try {
      // Fetch all emails from the database
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
    const { email } = req.query; // Extract email from query params

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      // Delete the email from the database
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
