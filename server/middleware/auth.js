import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // Check for token in cookies first
  const cookieToken = req.cookies.adminToken;
  
  // Then check Authorization header as fallback
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No token provided'
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Add isAdmin flag to all authenticated users for now
    user.isAdmin = true;
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      // Clear the cookie if it's expired
      res.clearCookie('adminToken');
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    // Clear invalid cookie
    res.clearCookie('adminToken');
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Invalid authentication token'
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};
