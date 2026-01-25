import express from 'express';
import subjectsRouter from './routes/subjects';

const app = express();
const PORT = 8000;

app.use(express.json());

app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
  res.send('Hello, welcome to the PERN backend!');
});

app.listen(PORT, () =>{
  console.log('Server is running on port http://localhost:8000');
})