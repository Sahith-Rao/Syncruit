const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user.adminId) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin }; 