const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // استخدم PORT بالحروف الكبيرة

// استيراد نموذج المستخدم
const user = require('./models/customerSchema.js'); // تأكد من أن مسار الملف صحيح
const Reads=require('./models/sensorSchema.js');
const { CLIENT_RENEG_LIMIT } = require('tls');
const { Console } = require('console');

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const usercontroller=require('./contoller/user.controller')

// app.use('/user', usercontroller);

// إعداد Livereload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// GET Request
app.get('/', (req, res) => {
    res.render("index");
});

// POST Request لتسجيل المستخدم

app.post('/register', (req, res) => {
  const Userr = new user(req.body);
  Userr.save()
    .then(() => {
      res.redirect('/sensor'); // تأكد من وجود صفحة sensor
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error creating user');
    });
});

//sensor reads
app.get('/sensor', (req, res) => {
  res.render("sensor");
});


app.post('/sensor', (req, res) => {
  
  const newRead = new Reads(req.body);
  console.log("READS SENSOR=======",req.body)
  newRead.save()
    .then(() => {
      res.redirect('/sensor');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error creating sensor read');
    });
});


app.put('/sensor', (req, res) => {
  const { id, ...updateData } = req.body;
  Reads.findByIdAndUpdate(id, updateData)
    .then(() => {
      res.redirect('/sensor');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error updating sensor data');
    });
});

app.delete('/sensor', (req, res) => {
  const { id } = req.body;
  Reads.findByIdAndDelete(id)
    .then(() => {
      res.redirect('/sensor');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error deleting sensor data');
    });
});

// الاتصال بقاعدة بيانات MongoDB
const url = process.env.MONGO_URL; // تأكد من أن الرابط صحيح

mongoose.connect(url)
  .then(() => {
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
