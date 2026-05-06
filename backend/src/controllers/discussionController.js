// Lerato Sibanda u22705504 P14

const Discussion = require('../models/Discussion');
const Project = require('../models/Project');

// Helper function to check if user is a member
const isMemberOfProject = (project, userId) => {
  if (!userId || !project || !project.members) return false;
  return project.members.some(memberId => 
    memberId.toString() === userId.toString()
  );
};

// Get discussions for a project (members and admin)
exports.getDiscussions = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const User = require('../models/User');
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user && user.isAdmin;
    
    // Check if user is a project member
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const isMember = isMemberOfProject(project, userId);
    
    // Admin can view any discussions, members need to be part of the project
    if (!isAdmin && !isMember) {
      return res.status(403).json({ success: false, message: 'Only project members can view discussions' });
    }
    
    const discussions = await Discussion.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username profileImage');
    
    res.json({ success: true, data: discussions });
  } catch (error) {
    console.error('getDiscussions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add discussion
exports.addDiscussion = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { message } = req.body;
    const User = require('../models/User');
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user && user.isAdmin;
    
    // Check if user is a project member
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Admin can add discussions to any project, members need to be part of the project
    if (!isAdmin && !isMemberOfProject(project, userId)) {
      return res.status(403).json({ success: false, message: 'Only project members can add discussions' });
    }
    
    const discussion = new Discussion({
      projectId: req.params.projectId,
      userId: userId,
      message
    });
    
    await discussion.save();
    await discussion.populate('userId', 'name username profileImage');
    
    res.status(201).json({ success: true, data: discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update discussion (author and admin)
exports.updateDiscussion = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { message } = req.body;
    const User = require('../models/User');
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user && user.isAdmin;
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    
    // Admin can edit any discussion, regular users can only edit their own
    if (!isAdmin && discussion.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the author can edit this discussion' });
    }
    
    discussion.message = message;
    await discussion.save();
    await discussion.populate('userId', 'name username profileImage');
    
    res.json({ success: true, data: discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete discussion (author and admin)
exports.deleteDiscussion = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const User = require('../models/User');
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user && user.isAdmin;
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    
    // Admin can delete any discussion, regular users can only delete their own
    if (!isAdmin && discussion.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the author can delete this discussion' });
    }
    
    await Discussion.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
