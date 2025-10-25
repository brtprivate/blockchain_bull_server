const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Allow all origins and methods
app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  next();
});

// Disable X-Powered-By header
app.disable('x-powered-by');

// Additional security headers
app.use((req, res, next) => {
  // Allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Disable CSRF protection by not setting CSRF tokens
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');

  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Import routes
const userRoutes = require('./routes/users');
const referralRoutes = require('./routes/referrals');
const investmentRoutes = require('./routes/investments');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/investments', investmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BlockchainBull API is running' });
});
app.get("/health",(req,res)=>{
  res.status(200).json({
    success: true,
    message: "BlockchainBull API is running"
  })
})

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
