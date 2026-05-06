// Lerato Sibanda u22705504 P14

// Authentication middleware
const auth = (req, res, next) => {
  // Check for custom session header
  const sessionUserId = req.headers['x-session-id'];

  // Allow if either session cookie OR custom session header is present
  if ((req.session && req.session.userId) || sessionUserId) {
    // Store userId in request for use in controllers
    req.userId = sessionUserId || req.session.userId;
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    // Check for custom session header 
    const sessionUserId = req.headers['x-session-id'];
    const userId = sessionUserId || (req.session && req.session.userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
    
    // Store userId in request for use in controllers
    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { auth, adminAuth };
