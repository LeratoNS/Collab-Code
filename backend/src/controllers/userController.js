// Lerato Sibanda u22705504 P14

const User = require('../models/User');
const Project = require('../models/Project');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { name, username, bio, birthday, work, contactInfo, relationship } = req.body;
    
    const updateData = {
      name,
      username,
      bio,
      birthday,
      work,
      contactInfo,
      relationship
    };
    
    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const Activity = require('../models/Activity');
    const FriendRequest = require('../models/FriendRequest');
    const Discussion = require('../models/Discussion');
    
    // Delete user's activities
    await Activity.deleteMany({ userId });
    
    // Delete user's projects and associated data
    const userProjects = await Project.find({ ownerId: userId });
    for (const project of userProjects) {
      // Delete project activities
      await Activity.deleteMany({ projectId: project._id });
      // Delete project discussions
      await Discussion.deleteMany({ projectId: project._id });
      // Delete the project
      await Project.findByIdAndDelete(project._id);
    }
    
    // Remove user from other projects' member lists
    await Project.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    
    // Delete friend requests sent or received by user
    await FriendRequest.deleteMany({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });
    
    // Remove user from other users' friend lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );
    
    // Remove user from other users' saved projects (if they saved this user's projects)
    // This happens automatically when we delete the projects above
    
    // Delete the user account
    await User.findByIdAndDelete(userId);
    
    // Destroy session
    req.session.destroy();
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request verification
exports.requestVerification = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user meets verification requirements
    const accountAge = Date.now() - user.createdAt.getTime();
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (accountAge < oneWeekInMs) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account must be at least one week old to request verification' 
      });
    }
    
    // Check if user has at least one project
    const userProjects = await Project.countDocuments({ ownerId: userId });
    if (userProjects < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must have created at least one project to request verification' 
      });
    }
    
    // Check if user has checked out at least one project (activity type: 'check-out')
    const Activity = require('../models/Activity');
    const checkoutActivity = await Activity.findOne({ 
      userId, 
      type: 'check-out' 
    });
    
    if (!checkoutActivity) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must have checked out at least one project to request verification' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your account is already verified' 
      });
    }
    
    if (user.verificationRequested) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already requested verification' 
      });
    }
    
    // Set verification requested flag
    user.verificationRequested = true;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Verification request submitted successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save a project
exports.saveProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { projectId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check if already saved
    if (user.savedProjects && user.savedProjects.includes(projectId)) {
      return res.status(400).json({ success: false, message: 'Project already saved' });
    }
    
    // Add to saved projects
    await User.findByIdAndUpdate(userId, {
      $addToSet: { savedProjects: projectId }
    });
    
    res.json({ success: true, message: 'Project saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unsave a project
exports.unsaveProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { projectId } = req.params;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { savedProjects: projectId }
    });
    
    res.json({ success: true, message: 'Project unsaved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get saved projects
exports.getSavedProjects = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId || req.session.userId;
    
    const user = await User.findById(userId).populate('savedProjects');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user.savedProjects || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
