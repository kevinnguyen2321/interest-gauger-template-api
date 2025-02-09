import jwt from 'jsonwebtoken';

export default function authenticateToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return true; //Stop execution//
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    return false; // No error, continue execution
  } catch (err) {
    res.status(403).json({ error: 'Forbidden - Invalid token' });
    return true; //Stop execution//
  }
}
