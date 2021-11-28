const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');

const catchAsync = require('./utils/catchAsync');

const DriveModel = require('./models/Drive');
const RideModel = require('./models/Ride');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const connectDB = async () => {
  try {
    await mongoose.connect('mongoURI=mongodb+srv://Safyan:qwertyasdf@cluster0-f9smh.mongodb.net/natrous?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`connected to DB and ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

app.get('/ride/:distance/:startLatLng/:endLatlng', catchAsync(async (req, res) => {


  const { distance, startLatLng, endLatlng } = req.params;

  const radius = distance / 6378.1;

  const [startLat, startLng] = startLatLng.split(',');
  const [endLat, endLng] = endLatlng.split(',');

  if (!startLat || !startLng || !endLat || !endLng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }
  const drives = await DriveModel.find({
    midPoint: { $geoWithin: { $centerSphere: [[startLng, startLat], radius] } },
    midPoint: { $geoWithin: { $centerSphere: [[endLng, endLat], radius] } }
  });
  // 28.669786300050873, 77.22798035964927

  console.log(drives.length);
  res.status(200).json({
    status: 'success',
    results: drives.length,
    data: {
      data: drives
    }
  });
})
);

app.post('/drive', catchAsync(async (req, res) => {

  const { startPoint, endPoint } = req.body;

  const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.coordinates[1]},${startPoint.coordinates[0]}&destination=${endPoint.coordinates[1]},${endPoint.coordinates[0]}&key=AIzaSyDVqR4uEmfJa-0jmqKjsariW3kJXbQh2Hk`);

  const midPointIndex = Math.ceil((response.data.routes[0].legs[0].steps.length) / 2);
  const midPoint = response.data.routes[0].legs[0].steps[midPointIndex].end_location;

  const diameter = (response.data.routes[0].legs[0].distance.value) / 2;
  const route = response.data.routes[0];

  const drive = await DriveModel.create({
    startPoint,
    endPoint,
    midPoint: {
      type: "Point",
      coordinates: [midPoint.lng, midPoint.lat]
    },
    route,
    diameter
  }
  );
  console.log(drive.length);
  res.status(200).send('successfuly added drive');
}));

/* const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Running at ${PORT}`);
});
 */
module.exports = app;