const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);

// --- Security Middleware ---
app.use(helmet());
app.use(express.json());
app.use(cors());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
    message: 'Troppe richieste da questo IP, per favore riprova tra 15 minuti.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// --- Static and API Routes ---
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/employees',require('./routes/employeeRoutes'));
app.use('/api/logs', require('./routes/activityLogRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Error Handling Middleware ---
// This must be the last middleware to be used
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
