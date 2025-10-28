const mongoose = require('mongoose');
const schema= mongoose.Schema;
// Main sensor reading schema
const sensorReadingSchema = new schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  deviceName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  farmName: {
    type: String,
    index: true,
    trim: true
  },
  
  // Sensor measurements
  moisture: {
    type: Number,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number,
    min: -50,
    max: 100
  },
  conductivity: {
    type: Number,
    min: 0
  },
  ph: {
    type: Number,
    min: 0,
    max: 14
  },
  nitrogen: {
    type: Number,
    min: 0
  },
  phosphorus: {
    type: Number,
    min: 0
  },
  potassium: {
    type: Number,
    min: 0
  },
  salinity: {
    type: Number,
    min: 0
  },
  
  // Derived values
  npkRatio: {
    type: String,
    trim: true
  },
  soilHealth: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Fair'
  },
  
  // Flexible metadata
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
 
});
const sensorReading = mongoose.model("SensorReading", sensorReadingSchema);
module.exports = sensorReading;
