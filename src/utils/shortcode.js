const crypto = require('crypto');

async function generateShortcode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortcode;
    let isUnique = false;
    const Url = require('../models/url');

    while (!isUnique) {
        shortcode = Array(6).fill().map(() => 
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
        
        const existing = await Url.findOne({ shortcode });
        if (!existing) {
            isUnique = true;
        }
    }

    return shortcode;
}

module.exports = { generateShortcode };