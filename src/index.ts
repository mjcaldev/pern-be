import express from 'express';
import subjectsRouter from './routes/subjects';
import usersRouter from './routes/users';
import classesRouter from './routes/classes';
import cors from 'cors';

const app = express();
const PORT = 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,

}))

app.use(express.json());

app.use('/api/subjects', subjectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/classes', classesRouter);

app.get('/', (req, res) => {
  res.send('Hello, welcome to the PERN backend!');
});

app.listen(PORT, () =>{
  console.log('Server is running on port http://localhost:8000');
})