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
      type: [Date],
      default: Date.now()
    },
    startLat: { type: Number },
    startLng: { type: Number },
    endLat: { type: Number },
    endLng: { type: Number },
    name: String
  }
);

rideSchema.index({ endLatlng: '2dsphere' });
rideSchema.index({ startLatLng: '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
