const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');
const passport = require('passport');
var QRCode = require('qrcode');
  
require('dotenv').config();
require('./passport');

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const feedRouter = require("./routes/feed");
const notificationRouter = require('./routes/notifications');
const exploreRouter = require('./routes/explore');
const messagesRouter = require('./routes/messages');
const activityRouter = require('./routes/activity');
const reelsRouter = require('./routes/reels');

const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/feed", feedRouter);
app.use('/notifications', notificationRouter);
app.use('/explore', exploreRouter);
app.use('/messages', messagesRouter);
app.use('/activity', activityRouter);
app.use('/reels', reelsRouter);


async function startServer() {
  try {
    await db.init();
    console.log('Successfully connected to Oracle database');

    app.listen(3010, () => {
      console.log('Server is running on port 3010');
    });

  } catch (err) {
    console.error('Error connecting to Oracle database. Server not started.', err);
    process.exit(1);
  }
}

startServer();