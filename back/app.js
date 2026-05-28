const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');
const passport = require('passport');
var QRCode = require('qrcode');
  
require('dotenv').config();
require('./passport');

const sampleRouter = require("./routes/sample");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/sample", sampleRouter);
app.use("/user", userRouter);
app.use("/api/auth", authRouter);

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