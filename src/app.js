const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Load .env variables
const shortUrlRoutes = require('./routes/shorturls');
const loggerMiddleware = require('./middleware/logger');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.use('/shorturls', shortUrlRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});