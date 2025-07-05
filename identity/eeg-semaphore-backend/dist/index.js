"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const merkle_1 = __importDefault(require("./routes/merkle"));
const proof_1 = __importDefault(require("./routes/proof"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS middleware - must be before other middleware
app.use((req, res, next) => {
    // Allow multiple origins
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});
// Body parser
app.use(express_1.default.json());
// Logging middleware
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
app.use('/api/merkle', merkle_1.default);
app.use('/api/proof', proof_1.default);
app.get('/', (_req, res) => {
    res.json({ response: "API works" });
});
app.use((_req, res) => {
    res.status(404).send(`Route bulunamadı`);
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
