const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied: no token provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Access denied: malformed token format' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token expired — please log in again'
        : 'Invalid token';
    return res.status(401).json({ error: message });
  }
}

module.exports = authMiddleware;