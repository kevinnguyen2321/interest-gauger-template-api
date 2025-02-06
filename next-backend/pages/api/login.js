import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Check if credentials are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // Verify credentials using environment variables
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate a JWT token
  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });

  res.status(200).json({ token });
}
