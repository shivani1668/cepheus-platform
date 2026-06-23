const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();

// --- CONFIGURATION ---

// 1. CORS Configuration: This allows your Vercel frontend to talk to this server.
const allowedOrigins = [
    'https://cepheus-platform.vercel.app', // Your production frontend
    'http://localhost:5173',               // Your local Vite dev server
    'http://localhost:3000'                // Other local dev servers
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// 2. Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL ERROR: Supabase environment variables are missing!");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- ROUTES ---

// Import your route files
const bookingRoutes = require('./routes/bookings');
const webhookRoutes = require('./routes/webhooks');
const paymentRoutes = require('./routes/payments');
// const sheetRoutes = require('./routes/sheets'); // Uncomment if you have this file

// Use the routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);
// app.use('/api/sheets', sheetRoutes); // Uncomment if you have this file

// 3. Basic Health Check Endpoints
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'alive', 
        message: 'Cepheus Engine is running smoothly.',
        timestamp: new Date().toISOString()
    });
});

// Database Test Connection
app.get('/api/test-db', async (req, res) => {
    try {
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        
        res.json({ 
            success: true, 
            message: 'Connected to Supabase successfully!', 
            userCount: count 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed', 
            error: err.message 
        });
    }
});

// --- SERVER START ---

// Use the PORT provided by the hosting service (Render/Railway/etc) or default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
    🚀 Cepheus Backend is running!
    📡 Port: ${PORT}
    🔗 URL: http://localhost:${PORT}
    `);
});
