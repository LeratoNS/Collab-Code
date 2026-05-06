// Lerato Sibanda u22705504 P14

const mongoose = require('mongoose');

const versionFileSchema = new mongoose.Schema({
  name: String,
  url: String,
  size: Number,
  uploadedAt: Date,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const projectVersionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  versionNumber: {
    type: String,
    required: true
  },
  description: String,
  files: [versionFileSchema],
  projectData: {
    name: String,
    description: String,
    type: String,
    hashtags: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProjectVersion', projectVersionSchema, 'projectVersions');

