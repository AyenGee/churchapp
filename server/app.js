const express = require('express');
const cors = require('cors');

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.json({ 
        message: "Sunday School Records API running",
        endpoints: {
            children: "/api/children",
            teachers: "/api/teachers",
            sundayRecords: "/api/sunday-records",
            events: "/api/events",
            reports: "/api/reports"
        }
    });
});

// Routes
app.use('/api/children', require('./routes/childrenRoutes'));
app.use('/api/teachers', require('./routes/teachersRoutes'));
app.use('/api/sunday-records', require('./routes/sundayRecordsRoutes'));
app.use('/api/events', require('./routes/eventsRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

const PORT = process.env.PORT || 5000;

const { connectDB } = require('./config/db');
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});