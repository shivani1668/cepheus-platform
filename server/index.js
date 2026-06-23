const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables
dotenv.config();

const app = express();

// 2. ROBUST CORS CONFIGURATION
// This section fixes the "Preflight Blocked" and "CORS error" you saw in the console.
app.use(cors({
    origin: '*', // Allows all origins (Vercel, Localhost, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Specifically handle the "OPTIONS" preflight request
app.options('*', cors());

// 3. MIDDLEWARE
app.use(express.json());

// 4. SUPABASE INITIALIZATION
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ CRITICAL ERROR: Supabase environment variables are missing!");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 5. ROUTE IMPORTS
// Ensure these files exist in your 'routes' folder
const bookingRoutes = require('./routes/bookings');
const webhookRoutes = require('./routes/webhooks');
const paymentRoutes = require('./routes/payments');

// 6. USE ROUTES
app.use('/api/bookings', bookingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);

// 7. HEALTH CHECK ENDPOINTS
// Test this at: https://your-backend-url.onrender.com/api/health
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'alive', 
        message: 'Cepheus Engine is running smoothly.',
        timestamp: new Date().toISOString()
    });
});

// Test Database Connection at: https://your-backend-url.onrender.com/api/test-db
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

// 8. SERVER STARTUP
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 Cepheus Backend is LIVE!
    📡 Listening on Port: ${PORT}
    🔗 Local URL: http://localhost:${PORT}
    `);
});
