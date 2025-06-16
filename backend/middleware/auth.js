const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user.admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
};

const isCandidate = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user.candidate) {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isCandidate
}; 