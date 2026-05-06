// Lerato Sibanda u22705504 P14
const Activity = require('../models/Activity');
const User = require('../models/User');

// Get all activities
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get local activities 
exports.getLocalActivities = async (req, res) => {
  try {
    // Get userId from either session or custom header
    const userId = req.userId || req.session.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.json({ success: true, data: [] }); // Return empty array if user not found
    }
    
    const friendIds = user.friends || [];
    
    const activities = await Activity.find({
      userId: { $in: [...friendIds, userId] }
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get global activities
exports.getGlobalActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get project activities
exports.getProjectActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profileImage');
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
