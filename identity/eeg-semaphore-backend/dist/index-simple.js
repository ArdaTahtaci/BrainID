"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const merkle_1 = __importDefault(require("./routes/merkle"));
const proof_simple_1 = __importDefault(require("./routes/proof-simple"));
const app = (0, express_1.default)();
// Body parser
app.use(express_1.default.json());
// Routes
app.use('/api/merkle', merkle_1.default);
app.use('/api/proof-simple', proof_simple_1.default);
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
app.use((err, _req, res, _next) => {
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
exports.default = app;
