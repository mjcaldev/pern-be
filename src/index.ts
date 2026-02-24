import express from 'express';
import subjectsRouter from './routes/subjects';
import usersRouter from './routes/users';
import classesRouter from './routes/classes';
import cors from 'cors';
import securityMiddleware from './middleware/security';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

console.log("BETTER_AUTH_BASE_URL =", process.env.BETTER_AUTH_BASE_URL);

const app = express();
const PORT = 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,

}))

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