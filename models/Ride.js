const mongoose = require('mongoose');
// const {Point} = require('mongoose-geojson-schema');

// const pointSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['Point'],
//     required: true
//   },
//   coordinates: {
//     type: [Number],
//     required: true
//   }
// });

const rideSchema = new mongoose.Schema(
  {
    time: {
      type:[Date],
      default:"2021-06-19T09:00:00.000Z"
    },
    startLatLng: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default:'Point'
      },
      coordinates: [Number]
    },
    endLatlng: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default:'Point'
      },
      coordinates: [Number]
    },
    name:String
  }
);

rideSchema.index({endLatlng: '2dsphere'});
rideSchema.index({startLatLng: '2dsphere'});

module.exports = mongoose.model('Ride', rideSchema);
