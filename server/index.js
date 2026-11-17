import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { installAuth } from './auth.js';

const app = express();
const PORT = 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', {
  serverSelectionTimeoutMS: 5000
});

async function startServer() {
  try {
    await client.connect();

    const database = client.db(process.env.MONGODB_DB || 'creamycrochets');
    installAuth(app, database);
    const products = database.collection('products');

    console.log('Connected to MongoDB');

    app.get('/', (req, res) => {
      res.json({ message: 'CreamyCrochets API is running' });
    });

    app.get('/api/products', async (req, res) => {
      try {
        const result = await products.find({}).sort({ id: 1 }).toArray();
        res.json(result);
      } catch (error) {
        console.error('Could not fetch products:', error);
        res.status(500).json({ message: 'Could not load products' });
      }
    });

    app.use((err, req, res, next) => {
      console.error('Request failed:', err.message);
      res.status(err.status || 500).json({ message: err.status === 400 ? 'Invalid request body.' : 'Request failed. Please try again.' });
    });
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    await client.close();
    process.exit(1);
  }
}

startServer();
