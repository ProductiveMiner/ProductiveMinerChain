const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'productiveminer-backend'
    });
});

// Basic routes
app.get('/api/status', (req, res) => {
    res.json({
        blockchain: {
            height: 0,
            status: 'initializing'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`ProductiveMiner Backend running on port ${PORT}`);
});
