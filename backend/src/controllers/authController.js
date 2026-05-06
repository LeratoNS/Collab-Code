// Lerato Sibanda u22705504 P14
const User = require('../models/User');

// Register - SAVES TO DATABASE
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user in database
    const newUser = new User({
      name,
      username,
      email,
      password,
      profileImage: '',
      bio: '',
      isAdmin: false,
      isVerified: false,
      verificationRequested: false,
      friends: []
    });
    
    await newUser.save();
    
    // Set session
    req.session.userId = newUser._id;
    
    // Explicitly save the session before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      
      console.log('Registration successful - Session saved:', {
        sessionID: req.sessionID,
        userId: req.session.userId
      });
      
      res.status(201).json({
        success: true,
        user: {
          _id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          profileImage: newUser.profileImage,
          bio: newUser.bio,
          birthday: newUser.birthday,
          work: newUser.work,
          contactInfo: newUser.contactInfo,
          relationship: newUser.relationship,
          isAdmin: newUser.isAdmin,
          isVerified: newUser.isVerified,
          friends: newUser.friends,
          createdAt: newUser.createdAt
        }
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login 
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // First, try to find user in database
    const user = await User.findOne({ email });
    
    if (user) {
      // Check password 
      if (user.password === password) {
        // Set session
        req.session.userId = user._id;
        
        // Explicitly save the session before sending response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ success: false, message: 'Session error' });
          }
          
          console.log('Login successful - Session saved:',{
            sessionID: req.sessionID,
            userId: req.session.userId
          });
          
          res.json({
            success: true,
            user: {
              _id: user._id,
              name: user.name,
              username: user.username,
              email: user.email,
              profileImage: user.profileImage,
              bio: user.bio,
              birthday: user.birthday,
              work: user.work,
              contactInfo: user.contactInfo,
              relationship: user.relationship,
              isAdmin: user.isAdmin,
              isVerified: user.isVerified,
              friends: user.friends,
              createdAt: user.createdAt
            }
          });
        });
        return;
      }
    }
    
    // Fallback to mock credentials for testing
    const mockUser = {
      _id: '65a1b2c3d4e5f67890123456',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'test1234',
      profileImage: '',
      bio: 'Test user for development',
      birthday: '1990-01-01',
      work: 'Software Developer',
      contactInfo: { phone: '+1234567890' },
      relationship: 'Single',
      isAdmin: false,
      isVerified: true,
      friends: [],
      createdAt: new Date().toISOString()
    };
    
    // Check against mock credentials
    if (email === mockUser.email && password === mockUser.password) {
      // Set session
      req.session.userId = mockUser._id;
      
      // Explicitly save the session before sending response
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, message: 'Session error' });
        }
        
        console.log('Mock login successful - Session saved:',{
          sessionID: req.sessionID,
          userId: req.session.userId
        });
        
        res.json({
          success: true,
          user: {
            _id: mockUser._id,
            name: mockUser.name,
            username: mockUser.username,
            email: mockUser.email,
            profileImage: mockUser.profileImage,
            bio: mockUser.bio,
            birthday: mockUser.birthday,
            work: mockUser.work,
            contactInfo: mockUser.contactInfo,
            relationship: mockUser.relationship,
            isAdmin: mockUser.isAdmin,
            isVerified: mockUser.isVerified,
            friends: mockUser.friends,
            createdAt: mockUser.createdAt
          }
        });
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get current user - SUPPORTS LOCALSTORAGE SESSION
exports.getCurrentUser = async (req, res) => {
  try {
    // Check for custom session header
    const sessionUserId = req.headers['x-session-id'];
    const userId = sessionUserId || (req.session && req.session.userId);
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        return res.json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            bio: user.bio,
            birthday: user.birthday,
            work: user.work,
            contactInfo: user.contactInfo,
            relationship: user.relationship,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
            friends: user.friends,
            createdAt: user.createdAt
          }
        });
      }
    }
    
    // Return unauthorized if no valid session
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};