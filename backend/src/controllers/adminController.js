// Lerato Sibanda u22705504 P14
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const ProjectType = require('../models/ProjectType');
const Discussion = require('../models/Discussion');

// Get all users 
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user 
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Delete user's projects
    await Project.deleteMany({ ownerId: userId });
    
    // Delete user's activities
    await Activity.deleteMany({ userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user 
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Handle profile image upload
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all projects 
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('ownerId', 'name username profileImage')
      .populate('members', 'name username profileImage');
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project 
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Delete project activities
    await Activity.deleteMany({ projectId });
    
    // Delete project
    await Project.findByIdAndDelete(projectId);
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;
    
    // Handle project image upload
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }
    
    const project = await Project.findByIdAndUpdate(projectId, updates, { new: true })
      .populate('ownerId', 'name username profileImage')
      .populate('members', 'name username profileImage');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

// Update activity 
exports.updateActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const updates = req.body;
    
    const activity = await Activity.findByIdAndUpdate(activityId, updates, { new: true })
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    
    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    
    await Activity.findByIdAndDelete(activityId);
    
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all project types
exports.getAllProjectTypes = async (req, res) => {
  try {
    const types = await ProjectType.find().sort({ name: 1 });
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add project type
exports.addProjectType = async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingType = await ProjectType.findOne({ name });
    if (existingType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project type already exists' 
      });
    }
    
    const projectType = new ProjectType({ name });
    await projectType.save();
    
    res.status(201).json({ success: true, data: projectType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project type (admin)
exports.deleteProjectType = async (req, res) => {
  try {
    const typeId = req.params.id;
    
    await ProjectType.findByIdAndDelete(typeId);
    
    res.json({ success: true, message: 'Project type deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get verification requests (admin)
exports.getVerificationRequests = async (req, res) => {
  try {
    const users = await User.find({ 
      verificationRequested: true, 
      isVerified: false 
    }).select('-password');
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve verification request (admin)
exports.approveVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true, verificationRequested: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user, message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deny verification request (admin)
exports.denyVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { verificationRequested: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user, message: 'Verification request denied' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all discussions 
exports.getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    res.json({ success: true, data: discussions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update discussion 
exports.updateDiscussion = async (req, res) => {
  try {
    const discussionId = req.params.id;
    const updates = req.body;
    
    const discussion = await Discussion.findByIdAndUpdate(discussionId, updates, { new: true })
      .populate('userId', 'name username profileImage')
      .populate('projectId', 'name image');
    
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    
    res.json({ success: true, data: discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete discussion 
exports.deleteDiscussion = async (req, res) => {
  try {
    const discussionId = req.params.id;
    
    await Discussion.findByIdAndDelete(discussionId);
    
    res.json({ success: true, message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

