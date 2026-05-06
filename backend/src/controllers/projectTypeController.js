// Lerato Sibanda u22705504 P14

const ProjectType = require('../models/ProjectType');

// Get all project types
exports.getProjectTypes = async (req, res) => {
  try {
    const types = await ProjectType.find().sort({ name: 1 });
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add project type (admin only)
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
