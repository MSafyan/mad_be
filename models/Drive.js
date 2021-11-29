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
    radius: {
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
        type: String,  
        enum: ['Point'],  
        default:'Point'
      },
      coordinates: [Number]
    },
    endPoint: {
      type: {
        type: String,  
        enum: ['Point'],  
        default:'Point'
      },
      coordinates: [Number]
    },
    midPoint:{
      type: {
        type: String, 
        enum: ['Point'], 
        default:'Point'
      },
      coordinates: [Number]
    },
    maxPoint:{
      type: {
        type: String, 
        enum: ['Point'], 
        default:'Point'
      },
      coordinates: [Number]
    },
    minPoint:{
      type: {
        type: String, 
        enum: ['Point'], 
        default:'Point'
      },
      coordinates: [Number]
    },
    lineString:{
      type: {
        type: String, 
        enum: ['LineString'], 
        default:'LineString'
      },
      coordinates: [[Number]]
    },
    route:{},
    // polygon:{
    //   type: {
    //     type: String,
    //     enum: ['Polygon'],
    //     required: true
    //   },
    //   coordinates: {
    //     type: [[[Number]]], // Array of arrays of arrays of numbers
    //     required: true
    //   }
    // }
  }
);

driveSchema.index({midPoint: '2dsphere'});
driveSchema.index({maxPoint: '2dsphere'});
driveSchema.index({minPoint: '2dsphere'});
driveSchema.index({lineString: '2dsphere'});
// driveSchema.index({polygon: '2dsphere'});

module.exports = mongoose.model('Drive', driveSchema);

// [71.71980107786906, 29.33491267155246],
// [71.5028211066641, 30.0887175840949]


// const lineString ={
//   type:"LineString",
//   coordinates: [
//     [77.22798035964927,29.669786300050873],
//     [77.22798035964927,28.669786300050873 ]]
//   }