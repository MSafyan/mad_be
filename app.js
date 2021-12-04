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


const range = 0.009009009009009;
// mongodb://localhost:27017/test
// mongoURI=mongodb+srv://Safyan:qwertyasdf@cluster0-f9smh.mongodb.net/natrous?retryWrites=true&w=majority

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/test', {
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

app.get('/rides/:startLat/:startLng/:endLat/:endLng',async (req,res)=>{

  const { startLat, startLng, endLat,endLng } = req.params;

  const allDrives = await DriveModel.find({
    active: true,
    maxLat: { $gt: startLat },
    minLat: { $lt: startLat },
    maxLng: { $gt: startLng },
    minLng: { $lt: startLng },

    maxLat: { $gt: endLat },
    minLat: { $lt: endLat },
    maxLng: { $gt: endLng },
    minLng: { $lt: endLng },
  });

  res.status(200).json({
    status: 'success',
    results: allDrives.length,
    data: {
      data: allDrives
    }
  });
})

app.post('/ride', catchAsync(async (req, res) => {

  const { time, startLatLng, endLatlng,name } = req.body;
  const matchDrive = [];

  const [startLat, startLng] = startLatLng.split(',');
  const [endLat, endLng] = endLatlng.split(',');

  if (!startLat || !startLng || !endLat || !endLng) {
    next(
      new AppError(
        {
          message: 'Please provide latitute and longitude in the format lat,lng.'
        },
        400
      )
    );
  }

  await RideModel.create({
    name,
    time,
    startLatLng, 
    endLatlng
  });

  //aroze=> min max modification required
  const allDrives = await DriveModel.find({
    active: true,
    maxLat: { $gt: startLat },
    minLat: { $lt: startLat },
    maxLng: { $gt: startLng },
    minLng: { $lt: startLng },

    maxLat: { $gt: endLat },
    minLat: { $lt: endLat },
    maxLng: { $gt: endLng },
    minLng: { $lt: endLng },
  });
  console.log(typeof time);
  let dateTime = new Date(new Number(time));
  for (let i = 0; i < allDrives.length; i++) {
    const drive = allDrives[i];
    if (drive) {
      let startIsIn = false;
      let driveDetails = {};
      console.log('checking new drive');
      for (let j = 0; j < drive.points.length; j++) {
        const element = drive.points[j];
        if (!startIsIn) {
          console.log(element.Time, dateTime, element.Time.getTime() < dateTime.getTime());
          if (element.Time.getTime() < dateTime.getTime())
            continue;
          if (Math.abs(element.lat - startLat) < range && Math.abs(element.lng - startLng) < range) {
            startIsIn = true;
            driveDetails = {
              time: element.Time,
              startPoint: [element.lat, element.lng],
            };
            continue;
          }
        }
        else if (Math.abs(element.lat - endLat) < range && Math.abs(element.lng - endLng) < range) {
          driveDetails.endPoint = [element.lat, element.lng];
          matchDrive[matchDrive.length] = driveDetails;
          break;
        }
      }
    }

  }

  console.log(allDrives.length, matchDrive.length);
  res.status(200).json({
    status: 'success',
    results: matchDrive.length,
    data: {
      data: matchDrive
    }
  });
})
);

app.post('/drive', catchAsync(async (req, res) => {

  const { date, startPoint, endPoint } = req.body;

  const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.coordinates[1]},${startPoint.coordinates[0]}&destination=${endPoint.coordinates[1]},${endPoint.coordinates[0]}&key=AIzaSyDVqR4uEmfJa-0jmqKjsariW3kJXbQh2Hk`);

  const route = response.data.routes[0];

  let { northeast, southwest } = route.bounds;
  let maxLat = southwest.lat;
  let minLat = northeast.lat;
  if (northeast.lat > southwest.lat) {
    minLat = southwest.lat;
    maxLat = northeast.lat;
  }

  let maxLng = southwest.lng;
  let minLng = northeast.lng;
  if (northeast.lng > southwest.lng) {
    minLng = southwest.lng;
    maxLng = northeast.lng;
  }

  let dateTime = new Date(date).getTime();

  let currentTimer = new Date(dateTime);

  let legs = route.legs[0].steps;
  let points = [];
  for (let index = 0; index < legs.length; index++) {
    points[index] = {};
    const element = legs[index];
    currentTimer.setMinutes(currentTimer.getMinutes() + Math.ceil(element.duration.value / 60));
    points[index].Time = new Date(currentTimer);
    points[index].lat = element.start_location.lat;
    points[index].lng = element.start_location.lng;
  }

  const drive = await DriveModel.create({
    startPoint,
    endPoint,
    dateTime,
    minLat,
    maxLat,
    minLng,
    maxLng,
    points
  });

  // const drive = await DriveModel.create({...req.body});

  //console.log(drive);
  res.status(200).json({ message: 'successfuly added drive' });
}));

app.use('/', (req, res) => {
  res.status(200).send("MAD hi MAD :)");
});


module.exports = app;