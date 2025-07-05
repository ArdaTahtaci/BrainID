import express from 'express';
import merkleRoutes from './routes/merkle';
import proofSimpleRoutes from './routes/proof-simple';

const app = express();

// Body parser
app.use(express.json());

// Routes
app.use('/api/merkle', merkleRoutes);
app.use('/api/proof-simple', proofSimpleRoutes);

// Request logging
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Root endpoint
app.get('/', (_req, res) => {
    res.json({ 
        response: "EEG Merkle Backend API works!",
        endpoints: {
            merkle: "/api/merkle/*",
            proofSimple: "/api/proof-simple/*"
        }
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 EEG Merkle Backend listening on http://localhost:${PORT}`);
    console.log(`📚 Available endpoints:`);
    console.log(`   GET  /                           - Health check`);
    console.log(`   POST /api/merkle/generate        - Generate Merkle tree`);
    console.log(`   POST /api/proof-simple/identity/create - Create identity`);
    console.log(`   POST /api/proof-simple/group/create    - Create group`);
    console.log(`   POST /api/proof-simple/proof/generate  - Generate proof`);
    console.log(`   POST /api/proof-simple/proof/verify    - Verify proof`);
});

export default app; 