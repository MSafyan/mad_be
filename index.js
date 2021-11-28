const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');

const DriveModel = require('./models/Drive');
const RideModel = require('./models/Ride');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json());


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

app.get('/ride',async (req,res)=>{
  try{
    const drives=await RideModel.find();
    console.log(drives)
  }catch(e){
    console.log(e)
  }
  res.send('hello');
})

app.post('/drive',async (req,res)=>{
  try{

    const {startPoint,endPoint}=req.body;

    const res = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.coordinates[0]},${startPoint.coordinates[1]}&destination=${endPoint.coordinates[0]},${endPoint.coordinates[1]}&key=AIzaSyDVqR4uEmfJa-0jmqKjsariW3kJXbQh2Hk`)

    const midPointIndex=Math.ceil((res.data.routes[0].legs[0].steps.length)/2);
    const midPoint=res.data.routes[0].legs[0].steps[midPointIndex].end_location;

    const diameter = (res.data.routes[0].legs[0].distance.value)/2;
    const route=res.data.routes[0];

    const drive = await DriveModel.create({
      startPoint,
      endPoint,
      midPoint:{
        type:"Point",
        coordinates:[midPoint.lat,midPoint.lng]
      },
      route,
      diameter
      }
    );
    console.log(drive)

  }catch(e){
    console.log(e)
  }
  res.status(200).send('successfuly added drive');
})
app.use('/',(req,res)=>{
  res.send('hello');
})
app.use('/',(req,res)=>{
  res.send('hello');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Running at ${PORT}`);
});