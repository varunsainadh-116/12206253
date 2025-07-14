const express = require('express');
const validUrl = require('valid-url');
const geoip = require('geoip-lite');
const { generateShortcode } = require('../utils/shortcode');
const Url = require('../models/url');
const router = express.Router();

// Create Short URL
router.post('/', async (req, res, next) => {
    try {
        const { url, validity, shortcode } = req.body;

        // Validate URL
        if (!validUrl.isWebUri(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Validate shortcode if provided
        if (shortcode) {
            if (!/^[a-zA-Z0-9]{5,10}$/.test(shortcode)) {
                return res.status(400).json({ error: 'Invalid shortcode format. Use 5-10 alphanumeric characters' });
            }
            const existing = await Url.findOne({ shortcode });
            if (existing) {
                return res.status(409).json({ error: 'Shortcode already in use' });
            }
        }

        // Calculate expiry
        const expiresAt = new Date(Date.now() + (validity || 30) * 60 * 1000);

        // Create new URL document
        const urlDoc = new Url({
            shortcode: shortcode || await generateShortcode(),
            longUrl: url,
            expiresAt
        });

        await urlDoc.save();
        
        res.status(201).json({
            shortLink: `http://${req.headers.host}/${urlDoc.shortcode}`,
            expiry: urlDoc.expiresAt.toISOString()
        });
    } catch (error) {
        next(error);
    }
});

// Redirect
router.get('/:shortcode', async (req, res, next) => {
    try {
        const urlDoc = await Url.findOne({ shortcode: req.params.shortcode });
        
        if (!urlDoc) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        if (urlDoc.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Short URL expired' });
        }

        // Track click
        const geo = geoip.lookup(req.ip) || {};
        urlDoc.clicks.push({
            referrer: req.get('Referrer') || '-',
            geoLocation: geo.country || 'Unknown'
        });
        await urlDoc.save();

        res.redirect(301, urlDoc.longUrl);
    } catch (error) {
        next(error);
    }
});

// Get Statistics
router.get('/:shortcode/stats', async (req, res, next) => {
    try {
        const urlDoc = await Url.findOne({ shortcode: req.params.shortcode });
        
        if (!urlDoc) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        res.json({
            shortcode: urlDoc.shortcode,
            longUrl: urlDoc.longUrl,
            createdAt: urlDoc.createdAt.toISOString(),
            expiresAt: urlDoc.expiresAt.toISOString(),
            totalClicks: urlDoc.clicks.length,
            clickDetails: urlDoc.clicks.map(click => ({
                timestamp: click.timestamp.toISOString(),
                referrer: click.referrer,
                geoLocation: click.geoLocation
            }))
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
