// Lerato Sibanda u22705504 P14

const Project = require('../models/Project');
const Activity = require('../models/Activity');
const multer = require('multer');
const path = require('path');

// Helper function to check if user is a member
const isMemberOfProject = (project, userId) => {
  if (!userId || !project || !project.members) return false;
  return project.members.some(memberId => 
    memberId.toString() === userId.toString()
  );
};

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configure multer for project file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/files/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Combined storage for project creation (handles both image and files)
const combinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route image to uploads/, files to uploads/files/
    if (file.fieldname === 'image') {
      cb(null, 'uploads/');
    } else if (file.fieldname === 'files') {
      cb(null, 'uploads/files/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, Date.now() + path.extname(file.originalname));
    } else if (file.fieldname === 'files') {
      cb(null, Date.now() + '-' + file.originalname);
    } else {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }
});

const upload = multer({ storage: imageStorage });
const fileUpload = multer({ storage: fileStorage });
const combinedUpload = multer({ storage: combinedStorage });

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('ownerId', 'name username');
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get local projects (from friends)
exports.getLocalProjects = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.json({ success: true, data: [] });
    }
    
    const friendIds = user.friends || [];
    
    console.log('getLocalProjects - userId:', userId);
    console.log('getLocalProjects - friendIds:', friendIds);
    
    // Get projects where:
    // 1. User owns the project OR
    // 2. Project is owned by a friend OR
    // 3. User is a member AND the owner is a friend
    const projects = await Project.find({
      $or: [
        // User's own projects
        { ownerId: userId },
        // Projects owned by friends
        { ownerId: { $in: friendIds } },
        // Projects where user is a member but ONLY if owned by a friend
        { 
          members: userId,
          ownerId: { $in: friendIds }
        }
      ]
    })
      .populate('ownerId', 'name username profileImage')
      .sort({ createdAt: -1 });
    
    console.log('getLocalProjects - found projects:', projects.length);
    projects.forEach(p => {
      console.log(`  - ${p.name} (owner: ${p.ownerId?._id || p.ownerId})`);
    });
    
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('getLocalProjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get global projects 
exports.getGlobalProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('ownerId', 'name username profileImage')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    // Try to find by _id 
    let project = await Project.findOne({ _id: req.params.id })
      .populate('ownerId', 'name username profileImage')
      .populate('members', 'name username profileImage');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    console.log('Create project - userId:', userId);
    console.log('Create project - req.body:', req.body);
    console.log('Create project - req.files:', req.files);
    
    const { name, description, type, version, hashtags } = req.body;
    const hashtagsArray = JSON.parse(hashtags || '[]');
    
    // Handle initial files if present
    const files = [];
    if (req.files && req.files.files) {
      // req.files is an object when using upload.fields()
      req.files.files.forEach(file => {
        files.push({
          name: file.originalname,
          url: `/uploads/files/${file.filename}`,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: userId
        });
      });
    }
    
    // Get image from req.files 
    let imagePath = null;
    if (req.files && req.files.image && req.files.image.length > 0) {
      imagePath = `/uploads/${req.files.image[0].filename}`;
    }
    
    const project = new Project({
      name,
      description,
      type,
      version: version || '1.0.0',
      hashtags: hashtagsArray,
      ownerId: userId,
      members: [userId],
      image: imagePath,
      files: files,
      status: 'checked-in'
    });
    
    await project.save();
    
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { name, description, type } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    project.name = name || project.name;
    project.description = description || project.description;
    project.type = type || project.type;
    if (req.file) {
      project.image = `/uploads/${req.file.filename}`;
    }
    project.updatedAt = Date.now();
    
    await project.save();
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project 
exports.deleteProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the owner can delete this project' });
    }
    
    // Cascade delete: Remove project, activities, and discussions
    const Discussion = require('../models/Discussion');
    await Project.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ projectId: req.params.id });
    await Discussion.deleteMany({ projectId: req.params.id });
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Checkout project 
exports.checkoutProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check membership 
    const isMember = project.members.some(memberId => 
      memberId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }
    
    if (project.status === 'checked-out') {
      // Get who has it checked out
      const checkedOutUser = await require('../models/User').findById(project.checkedOutBy).select('name');
      return res.status(400).json({ 
        success: false, 
        message: `Project already checked out by ${checkedOutUser?.name || 'another user'}` 
      });
    }
    
    project.status = 'checked-out';
    project.checkedOutBy = userId;
    project.updatedAt = Date.now();
    await project.save();
    
    // Create activity
    const activity = new Activity({
      type: 'check-out',
      userId: userId,
      projectId: project._id
    });
    await activity.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Checkin project
exports.checkinProject = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { message, version } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.checkedOutBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the user who checked out can check in' 
      });
    }
    
    // Handle file uploads if present (updated/new files after editing)
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/files/${file.filename}`,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: userId,
        lastModifiedAt: new Date(),
        lastModifiedBy: userId
      }));
      project.files.push(...newFiles);
    }
    
    project.status = 'checked-in';
    project.checkedOutBy = null;
    project.version = version || project.version;
    project.updatedAt = Date.now();
    await project.save();
    
    // Create activity
    const activity = new Activity({
      type: 'check-in',
      userId: userId,
      projectId: project._id,
      message,
      versionNumber: version
    });
    await activity.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add member (any member can add, but only their friends)
exports.addMember = async (req, res) => {
  try {
    const currentUserId = req.userId || req.session.userId;
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!project.members.includes(currentUserId)) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }
    
    // Check if the user being added is a friend of the current user
    const User = require('../models/User');
    const currentUser = await User.findById(currentUserId);
    
    // Check if userId is in friends list (handle both string and ObjectId)
    const isFriend = currentUser.friends && currentUser.friends.some(friendId =>
      friendId.toString() === userId.toString()
    );
    
    if (!isFriend) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only add your friends as members' 
      });
    }
    
    // Check if already a member (handle both string and ObjectId)
    if (isMemberOfProject(project, userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already a member' 
      });
    }
    
    project.members.push(userId);
    await project.save();
    
    // Create activity
    const activity = new Activity({
      type: 'add-member',
      userId: currentUserId,
      projectId: project._id
    });
    await activity.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const currentUserId = req.userId || req.session.userId;
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Only owner can remove members' });
    }
    
    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transfer ownership
exports.transferOwnership = async (req, res) => {
  try {
    const currentUserId = req.userId || req.session.userId;
    const { newOwnerId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Only the owner can transfer ownership' });
    }
    
    if (!project.members.includes(newOwnerId)) {
      return res.status(400).json({ success: false, message: 'New owner must be a project member' });
    }
    
    project.ownerId = newOwnerId;
    await project.save();
    
    // Create activity
    const activity = new Activity({
      type: 'transfer-ownership',
      userId: currentUserId,
      projectId: project._id
    });
    await activity.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download project files (returns file list without locking project)
exports.downloadProjectFiles = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Anyone can view/download project files 
    res.json({ success: true, data: project.files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.userId || req.session.userId;
    console.log('Download file - projectId:', projectId, 'fileId:', fileId, 'userId:', userId);
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Allow download
    const isMember = project.members.some(memberId => 
      memberId.toString() === userId?.toString()
    );
    
    if (isMember && project.status === 'checked-out' && project.checkedOutBy?.toString() !== userId?.toString()) {
      const User = require('../models/User');
      const checkedOutUser = await User.findById(project.checkedOutBy).select('name');
      return res.status(403).json({ 
        success: false, 
        message: `Project is checked out by ${checkedOutUser?.name || 'another user'}. Members cannot download files while project is checked out by someone else.` 
      });
    }
    
    console.log('Project files:', project.files);
    
    const file = project.files.id(fileId);
    if (!file) {
      console.log('File not found with id:', fileId);
      console.log('Available file ids:', project.files.map(f => f._id));
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    console.log('File found:', file);
    const filePath = path.join(__dirname, '../..', file.url);
    console.log('File path:', filePath);
    
    res.download(filePath, file.name);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// View file contents in browser
exports.viewFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.userId || req.session.userId;
    const fs = require('fs');
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Allow view if:
    // 1. Project is not checked out, OR
    // 2. Project is checked out by the current user, OR  
    // 3. User is not a member (non-members can always view public projects)
    const isMember = project.members.some(memberId => 
      memberId.toString() === userId?.toString()
    );
    
    if (isMember && project.status === 'checked-out' && project.checkedOutBy?.toString() !== userId?.toString()) {
      const User = require('../models/User');
      const checkedOutUser = await User.findById(project.checkedOutBy).select('name');
      return res.status(403).json({ 
        success: false, 
        message: `Project is checked out by ${checkedOutUser?.name || 'another user'}. Members cannot view files while project is checked out by someone else.` 
      });
    }
    
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const filePath = path.join(__dirname, '../..', file.url);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    
    // Determine file type
    const ext = path.extname(file.name).toLowerCase();
    
    // Check if it's an image file
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    const isImage = imageExtensions.includes(ext);
    
    // For images, don't read contents just return URL
    if (isImage) {
      return res.json({
        success: true,
        data: {
          name: file.name,
          url: file.url,
          type: 'image',
          isImage: true,
          size: file.size,
          uploadedAt: file.uploadedAt,
          uploadedBy: file.uploadedBy,
          lastModifiedAt: file.lastModifiedAt,
          lastModifiedBy: file.lastModifiedBy
        }
      });
    }
    
    // For text files, read and return contents
    const fileContents = fs.readFileSync(filePath, 'utf8');
    let fileType = 'text';
    
    // Common code file extensions
    const codeExtensions = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bash': 'bash',
      '.txt': 'text'
    };
    
    fileType = codeExtensions[ext] || 'text';
    
    res.json({
      success: true,
      data: {
        name: file.name,
        contents: fileContents,
        type: fileType,
        isImage: false,
        size: file.size,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.uploadedBy,
        lastModifiedAt: file.lastModifiedAt,
        lastModifiedBy: file.lastModifiedBy
      }
    });
  } catch (error) {
    console.error('View file error:', error);
    
    // If file is binary or too large, return error with helpful message
    if (error.message.includes('Invalid string length') || error.code === 'ERR_STRING_TOO_LONG') {
      return res.status(400).json({ 
        success: false, 
        message: 'File is too large or binary. Please download instead.' 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add file to project
exports.addFile = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!isMemberOfProject(project, userId)) {
      return res.status(403).json({ success: false, message: 'Only project members can add files' });
    }
    
    // Check if project is checked out by someone else
    if (project.status === 'checked-out' && project.checkedOutBy.toString() !== userId.toString()) {
      const User = require('../models/User');
      const checkedOutUser = await User.findById(project.checkedOutBy).select('name');
      return res.status(403).json({ 
        success: false, 
        message: `Project is checked out by ${checkedOutUser?.name || 'another user'}. Cannot add files until it's checked in.` 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }
    
    // Add all uploaded files
    req.files.forEach(file => {
      project.files.push({
        name: file.originalname,
        url: `/uploads/files/${file.filename}`,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: userId,
        lastModifiedAt: new Date(),
        lastModifiedBy: userId,
        isCheckedOut: false
      });
    });
    
    await project.save();
    
    res.json({ success: true, data: project.files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit/Replace file
exports.editFile = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { projectId, fileId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!isMemberOfProject(project, userId)) {
      return res.status(403).json({ success: false, message: 'Only project members can edit files' });
    }
    
    // Check if project is checked out by someone else
    if (project.status === 'checked-out' && project.checkedOutBy.toString() !== userId.toString()) {
      const User = require('../models/User');
      const checkedOutUser = await User.findById(project.checkedOutBy).select('name');
      return res.status(403).json({ 
        success: false, 
        message: `Project is checked out by ${checkedOutUser?.name || 'another user'}. Cannot edit files until it's checked in.` 
      });
    }
    
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    if (file.isCheckedOut && file.checkedOutBy.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'File is checked out by another user' });
    }
    
    // Replace with new file
    if (req.file) {
      file.url = `/uploads/files/${req.file.filename}`;
      file.size = req.file.size;
      file.lastModifiedAt = new Date();
      file.lastModifiedBy = userId;
    }
    
    await project.save();
    
    res.json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete file 
exports.deleteFile = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { projectId, fileId } = req.params;
    const User = require('../models/User');
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user && user.isAdmin;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Admin can delete any file, members need to be part of the project
    if (!isAdmin && !isMemberOfProject(project, userId)) {
      return res.status(403).json({ success: false, message: 'Only project members can delete files' });
    }
    
    // Check if project is checked out by someone else (admin can override)
    if (!isAdmin && project.status === 'checked-out' && project.checkedOutBy.toString() !== userId.toString()) {
      const checkedOutUser = await User.findById(project.checkedOutBy).select('name');
      return res.status(403).json({ 
        success: false, 
        message: `Project is checked out by ${checkedOutUser?.name || 'another user'}. Cannot delete files until it's checked in.` 
      });
    }
    
    const file = project.files.id(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Admin can always delete
    if (!isAdmin && file.isCheckedOut && file.checkedOutBy && file.checkedOutBy.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Cannot delete a file that is checked out by another user' });
    }
    
    // Remove file from array
    project.files.pull(fileId);
    await project.save();
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create version snapshot
exports.createVersion = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { versionNumber, description } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!isMemberOfProject(project, userId)) {
      return res.status(403).json({ success: false, message: 'Only project members can create versions' });
    }
    
    const ProjectVersion = require('../models/ProjectVersion');
    
    const version = new ProjectVersion({
      projectId: project._id,
      versionNumber: versionNumber || project.version,
      description: description || `Version ${versionNumber || project.version}`,
      files: project.files.map(f => ({
        name: f.name,
        url: f.url,
        size: f.size,
        uploadedAt: f.uploadedAt,
        uploadedBy: f.uploadedBy
      })),
      projectData: {
        name: project.name,
        description: project.description,
        type: project.type,
        hashtags: project.hashtags
      },
      createdBy: userId
    });
    
    await version.save();
    
    res.json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get version history
exports.getVersionHistory = async (req, res) => {
  try {
    const ProjectVersion = require('../models/ProjectVersion');
    const versions = await ProjectVersion.find({ projectId: req.params.id })
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rollback to a specific version
exports.rollbackToVersion = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { projectId, versionId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the owner can rollback versions' });
    }
    
    const ProjectVersion = require('../models/ProjectVersion');
    const version = await ProjectVersion.findById(versionId);
    
    if (!version || version.projectId.toString() !== projectId) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    
    // Restore files and project data
    project.files = version.files.map(f => ({
      name: f.name,
      url: f.url,
      size: f.size,
      uploadedAt: f.uploadedAt,
      uploadedBy: f.uploadedBy,
      lastModifiedAt: new Date(),
      lastModifiedBy: userId,
      isCheckedOut: false
    }));
    
    project.name = version.projectData.name;
    project.description = version.projectData.description;
    project.type = version.projectData.type;
    project.hashtags = version.projectData.hashtags;
    project.version = version.versionNumber;
    
    await project.save();
    
    res.json({ success: true, data: project, message: 'Rolled back to version ' + version.versionNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.upload = upload;
exports.fileUpload = fileUpload;
exports.combinedUpload = combinedUpload;
