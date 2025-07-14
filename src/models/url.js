const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortcode: {
        type: String,
        required: true,
        unique: true
    },
    longUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    clicks: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        referrer: String,
        geoLocation: String
    }]
});

module.exports = mongoose.model('Url', urlSchema);