// Lerato Sibanda u22705504 P14

const mongoose = require('mongoose');

const projectTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProjectType', projectTypeSchema, 'projectTypes');
