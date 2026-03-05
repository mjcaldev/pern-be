import AgentAPI from 'apminsight';
AgentAPI.config()

import express from 'express';
import subjectsRouter from './routes/subjects.js';
import usersRouter from './routes/users.js';
import classesRouter from './routes/classes.js';
import cors from 'cors';
import securityMiddleware from './middleware/security.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

console.log("BETTER_AUTH_BASE_URL =", process.env.BETTER_AUTH_BASE_URL);

const app = express();
const PORT = 8000;

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and same-origin requests.
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/api/auth', (req, res) => {
  console.log(`[auth] ${req.method} ${req.originalUrl}`);
  return toNodeHandler(auth)(req, res);
});
 
app.use(securityMiddleware);

app.use('/api/subjects', subjectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/classes', classesRouter);

app.get('/', (req, res) => {
  res.send('Hello, welcome to the PERN backend!');
});

app.listen(PORT, () =>{
  console.log('Server is running on port http://localhost:8000');
})