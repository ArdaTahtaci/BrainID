import express from 'express';
import dotenv from 'dotenv';
import merkleRoutes from './routes/merkle';
import proofRoutes from './routes/proof';

dotenv.config();
const app = express();

// CORS middleware - must be before other middleware
app.use((req, res, next) => {
    // Allow multiple origins for development
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'https://localhost:3000',
        'https://127.0.0.1:3000'
    ];

    const origin = req.headers.origin;

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || !origin) {
        res.header('Access-Control-Allow-Origin', '*');
    } else if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, x-requested-with');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use('/api/merkle', merkleRoutes);
app.use('/api/proof', proofRoutes);

app.get('/', (_req, res) => {
    res.json({
        response: "EEG Merkle Backend API is running!",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = parseInt(process.env.PORT || '8000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📡 CORS enabled for development`);
    console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
