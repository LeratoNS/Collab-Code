// Lerato Sibanda u22705504 P14
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// Get friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const requests = await FriendRequest.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).populate('senderId receiverId', 'name username profileImage');
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const { receiverId } = req.body;
    
    // Check if request already exists
    const existing = await FriendRequest.findOne({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Friend request already exists' 
      });
    }
    
    const request = new FriendRequest({
      senderId: userId,
      receiverId,
      status: 'pending'
    });
    
    await request.save();
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const request = await FriendRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    // Add to each other's friends list
    await User.findByIdAndUpdate(request.senderId, {
      $addToSet: { friends: request.receiverId }
    });
    
    await User.findByIdAndUpdate(request.receiverId, {
      $addToSet: { friends: request.senderId }
    });
    
    // Delete the friend request after accepting
    await FriendRequest.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userId || req.session.userId;
    const request = await FriendRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    // Delete the friend request after rejecting
    await FriendRequest.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unfriend
exports.unfriend = async (req, res) => {
  try {
    const currentUserId = req.userId || req.session.userId;
    const userId = req.params.id;
    
    // Remove from both friends lists
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: userId }
    });
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: currentUserId }
    });
    
    res.json({ success: true, message: 'Unfriended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
