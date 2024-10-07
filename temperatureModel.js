const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for storing temperatures and their average
const temperatureSchema = new Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now // The default value will be the current date if not provided
  },
  temperatures: {
    type: [Number], // Array of numbers (list of temperatures)
    required: true
  },
  averageTemp: {
    type: Number, // A single number to store the average temperature
    required: true
  }
});

// Create a model from the schema
const Temperature = mongoose.model('Temperature', temperatureSchema);

module.exports = Temperature;
