import express from 'express';
import dotenv from 'dotenv';
import merkleRoutes from './routes/merkle';

dotenv.config();
const app = express();

// Body parser
app.use(express.json());

app.use('/api/merkle', merkleRoutes);

app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.get('/', (_req, res) => {
    res.json({ response: "API works" })
});

app.use((_req, res) => {
    res.status(404).send(`Route bulunamadı`);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
