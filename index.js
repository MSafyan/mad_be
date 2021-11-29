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
app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json());

// mongoURI=mongodb+srv://Safyan:qwertyasdf@cluster0-f9smh.mongodb.net/natrous?retryWrites=true&w=majority
// mongodb://localhost:27017/madbe

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/madbe', {
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

app.get('/ride/:startLatLng/:endLatlng',catchAsync(async (req,res)=>{
  

  const {startLatLng, endLatlng } = req.params;
  const matchDrive=[];

  // const radius = distance / 6378.1;

  const [startLat, startLng] = startLatLng.split(',');
  const [endLat, endLng] = endLatlng.split(',');

  if (!startLat || !startLng || !endLat || !endLng ) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400
      )
    );
  }

  //aroze=> min max modification required
  const allDrives= await DriveModel.find({
    active:true,
    maxPoint:{$gt:startLat},
    maxPoint:{$gt:startLat},
    minPoint:{$gt:startLat},
    minPoint:{$gt:startLat},
  });
  
  for(let a=0;a<allDrives.length;a++){

  // dont know if this find is required
    const drive = await DriveModel.find({
      _id:allDrives[a]._id,
      midPoint: { $geoWithin: { $centerSphere: [[startLng, startLat], allDrives[a].radius] } },
      midPoint: { $geoWithin: { $centerSphere: [[endLat, endLng], allDrives[a].radius] } },
    });
    if(drive){
      //steps match form polyline 

      //push to matched array
      
      // return a response
    }
    
  }

  console.log(drives.length)
  res.status(200).json({
    status: 'success',
    results: drives.length,
    data: {
      data: drives
    }
  });
})
);

app.post('/drive',catchAsync(async (req,res)=>{

    const {startPoint,endPoint}=req.body;

    const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.coordinates[1]},${startPoint.coordinates[0]}&destination=${endPoint.coordinates[1]},${endPoint.coordinates[0]}&key=AIzaSyDVqR4uEmfJa-0jmqKjsariW3kJXbQh2Hk`)

    const midPointIndex=Math.ceil((response.data.routes[0].legs[0].steps.length)/2);
    const midPoint=response.data.routes[0].legs[0].steps[midPointIndex].end_location;

    const diameter = ((response.data.routes[0].legs[0].distance.value)/2)/1000;
    const radius = diameter / 6378.1;
    const route=response.data.routes[0];

  const lineString ={
    type:"LineString",
    coordinates: [
      [77.22798035964927,29.669786300050873],
      [77.22798035964927,28.669786300050873 ]]
    }

    const drive = await DriveModel.create({
      startPoint,
      endPoint,
      midPoint:{
        type:"Point",
        coordinates:[midPoint.lng,midPoint.lat]
      },
      maxPoint:{
        type:"Point",
        coordinates:[midPoint.lng + radius,midPoint.lat + radius]
      },
      minPoint:{
        type:"Point",
        coordinates:[midPoint.lng - radius,midPoint.lat - radius]
      },
      lineString,
      route,
      radius
      }
    );
    // const drive = await DriveModel.create({...req.body});

    console.log(drive)
  res.status(200).send('successfuly added drive');
}));

app.use('/',(req,res)=>{
  res.status(200).send("MAD hi MAD :)")
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Running at ${PORT}`);
});
