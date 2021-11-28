const mongoose = require('mongoose');
const {Point} = require('mongoose-geojson-schema');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const driveSchema = new mongoose.Schema(
  {
    diameter: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    DateTime: [Date],
    active: {
      type: Boolean,
      default: true
    },
    startPoint: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default:'Point'
      },
      coordinates: [Number]
    },
    endPoint: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default:'Point'
      },
      coordinates: [Number]
    },
    midPoint:{
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default:'Point'
      },
      coordinates: [Number]
    },
    route:{}
  }
);

driveSchema.index({startPoint: '2dsphere'});
driveSchema.index({midPoint: '2dsphere'});
driveSchema.index({endPoint: '2dsphere'});

module.exports = mongoose.model('Drive', driveSchema);
