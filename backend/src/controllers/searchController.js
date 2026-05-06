// Lerato Sibanda u22705504 P14

const User = require('../models/User');
const Project = require('../models/Project');

// Helper function to create fuzzy regex (handles typos and partial matches)
const createFuzzyRegex = (query) => {
  // Escape special regex characters
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Allow optional characters between each letter for typos
  // And make the entire pattern match anywhere in the string
  const fuzzyPattern = escaped
    .split('')
    .map(char => `${char}.?`) // Allow any char (including none) after each letter
    .join('');
  
  return new RegExp(fuzzyPattern, 'i');
};

// Helper to create partial match regex (for incomplete terms)
const createPartialRegex = (query) => {
  // Escape special regex characters
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match if query appears anywhere in the string
  return new RegExp(escaped, 'i');
};

// Search users - ONLY by name or username (no email)
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    
    // Create search patterns
    const partialRegex = createPartialRegex(q); // For incomplete terms
    const fuzzyRegex = createFuzzyRegex(q);     // For typos
    
    // Try partial match first 
    let users = await User.find({
      $or: [
        { name: { $regex: partialRegex } },
        { username: { $regex: partialRegex } }
      ]
    }).select('-password').sort({ name: 1 }).limit(20);
    
    // If no/few results, try fuzzy match (handles typos)
    if (users.length < 3) {
      const fuzzyUsers = await User.find({
        $or: [
          { name: { $regex: fuzzyRegex } },
          { username: { $regex: fuzzyRegex } }
        ]
      }).select('-password').sort({ name: 1 }).limit(20);
      
      // Combine and deduplicate
      const userMap = new Map();
      [...users, ...fuzzyUsers].forEach(u => {
        userMap.set(u._id.toString(), u);
      });
      users = Array.from(userMap.values());
    }
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Autocomplete for users (faster, returns just names and IDs)
exports.autocompleteUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const partialRegex = createPartialRegex(q);
    
    const users = await User.find({
      $or: [
        { name: { $regex: partialRegex } },
        { username: { $regex: partialRegex } }
      ]
    }).select('name username profileImage').sort({ name: 1 }).limit(10);
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search projects , ONLY by project name
exports.searchProjects = async (req, res) => {
  try {
    const { q, hashtag } = req.query;
    
    // If searching by hashtag specifically
    if (hashtag) {
      const projects = await Project.find({
        hashtags: { $regex: new RegExp(hashtag, 'i') }
      })
        .populate('ownerId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .limit(50);
      
      return res.json({ success: true, data: projects });
    }
    
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    
    // Create search patterns
    const partialRegex = createPartialRegex(q); // For incomplete terms
    const fuzzyRegex = createFuzzyRegex(q);     // For typos
    
    // Try partial match first 
    let projects = await Project.find({
      name: { $regex: partialRegex }
    })
      .populate('ownerId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // If no/few results, try fuzzy match
    if (projects.length < 3) {
      const fuzzyProjects = await Project.find({
        name: { $regex: fuzzyRegex }
      })
        .populate('ownerId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .limit(20);
      
      // Combine and deduplicate
      const projectMap = new Map();
      [...projects, ...fuzzyProjects].forEach(p => {
        projectMap.set(p._id.toString(), p);
      });
      projects = Array.from(projectMap.values());
    }
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Autocomplete for projects 
exports.autocompleteProjects = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const partialRegex = createPartialRegex(q);
    
    const projects = await Project.find({
      name: { $regex: partialRegex }
    })
      .select('name image type')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
