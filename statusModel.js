const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the status information
const statusSchema = new Schema({
  lastSeenDateTime: {
    type: Date,
    required: true,
    default: Date.now // Sets the default value to the current date and time
  },
  lastGoodRun: {
    type: Date,
    default: null // Will be null if there hasn't been a good run yet
  },
  lastFailedRun: {
    type: Date,
    default: null // Will be null if there hasn't been a failed run yet
  },
  inErrorMode: {
    type: Boolean,
    required: true,
    default: false // Default is false, meaning it's not in error mode initially
  }
});

// Create a model from the schema
const Status = mongoose.model('Status', statusSchema);

module.exports = Status;