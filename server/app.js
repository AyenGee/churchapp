const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Sunday School Records API running");
});

const PORT = process.env.PORT || 5000;

const connectDB = require('./config/db');
connectDB();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});