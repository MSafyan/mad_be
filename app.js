const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');

const catchAsync = require('./utils/catchAsync');

const DriveModel = require('./models/Drive');
const RideModel = require('./models/Ride');
const { sameDay } = require('./utils/functions');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const range = 0.009009009009009;
// mongodb://localhost:27017/test
// mongoURI=mongodb+srv://Safyan:qwertyasdf@cluster0-f9smh.mongodb.net/natrous?retryWrites=true&w=majority

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

app.get('/user/images/:id', async (req, res) => {
  res.sendFile("profile.jpg", { root: path.join(__dirname, './Images/Users') });
});

app.get('/rides/:nLat/:nLng/:sLat/:sLng', async (req, res) => {

  const { nLat, nLng, sLat, sLng } = req.params;

  const northeast = {
    lat: nLat,
    lng: nLng
  };
  const southwest = {
    lat: sLat,
    lng: sLng
  };
  console.log(northeast, southwest);
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

  const allRides = await RideModel.find({
    active: true,
    startLat: { $gt: minLat },
    startLat: { $lt: maxLat },
    startLng: { $gt: minLng },
    startLng: { $lt: maxLng },
  });

  let rides = [];
  for (let index = 0; index < allRides.length; index++) {
    const element = allRides[index];
    rides[index] = { ...element.toJSON() };
    rides[index].img = '/user/images/' + element._id;
  }



  console.log(rides);

  res.status(200).json({
    status: 'success',
    results: rides.length,
    data: rides
  });
});

app.post('/ride/find', catchAsync(async (req, res) => {

  const { time, start, end } = req.body;
  const matchDrive = [];

  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  if (!startLat || !startLng || !endLat || !endLng) {
    next(
      new AppError(
        {
          message: 'Please provide latitute and longitude in the format [lat,lng].'
        },
        400
      )
    );
  }

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

  let dateTime = new Date(new Number(time));
  for (let i = 0; i < allDrives.length; i++) {
    const drive = allDrives[i];
    if (drive) {
      if (sameDay(dateTime, drive.dateTime)) {
        let startIsIn = false;
        let driveDetails = {};
        for (let j = 0; j < drive.points.length; j++) {
          const element = drive.points[j];
          if (!startIsIn) {
            console.log(element.Time, dateTime, element.Time.getTime() > dateTime.getTime());
            if (element.Time.getTime() > dateTime.getTime())
              continue;
            console.log(Math.abs(element.lat - startLat) < range && Math.abs(element.lng - startLng) < range);
            if (Math.abs(element.lat - startLat) < range && Math.abs(element.lng - startLng) < range) {
              console.log("Start found");
              startIsIn = true;
              driveDetails = {
                time: element.Time,
                startPoint: [element.lat, element.lng],
              };
              continue;
            }
          }
          else if (Math.abs(element.lat - endLat) < range && Math.abs(element.lng - endLng) < range) {
            console.log("End found");
            driveDetails.endPoint = [element.lat, element.lng];
            matchDrive[matchDrive.length] = driveDetails;
            break;
          }
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

app.post('/ride/create', catchAsync(async (req, res) => {

  const { time, start, end, name } = req.body;

  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

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
    startLat,
    startLng,
    endLat,
    endLng
  });

  res.status(200).json({
    status: 'success',
    message: 'Ride Created'
  });
})
);

app.post('/drive', catchAsync(async (req, res) => {

  const { date, startPoint, endPoint, path } = req.body;

  const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?alternatives=true&origin=${startPoint.coordinates[1]},${startPoint.coordinates[0]}&destination=${endPoint.coordinates[1]},${endPoint.coordinates[0]}&key=AIzaSyDVqR4uEmfJa-0jmqKjsariW3kJXbQh2Hk`);

  const route = response.data.routes[path];

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
  res.status(200).json({ message: 'successfuly added drive' });
}));

app.use('/', (req, res) => {
  res.status(200).send("MAD hi MAD :)");
});


module.exports = app;