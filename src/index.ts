import AgentAPI from 'apminsight';
AgentAPI.config()

import express from 'express';
import subjectsRouter from './routes/subjects.js';
import usersRouter from './routes/users.js';
import classesRouter from './routes/classes.js';
import cors from 'cors';
import securityMiddleware from './middleware/security.js';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

console.log("BETTER_AUTH_BASE_URL =", process.env.BETTER_AUTH_BASE_URL);

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '', 10) || 8000;

function normalizeOrigin(input: string): string | null {
  const raw = input.trim().replace(/\/+$/g, '');
  if (!raw) return null;

  const withScheme =
    raw.includes('://') ? raw : /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw) ? `http://${raw}` : `https://${raw}`;

  try {
    const u = new URL(withScheme);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter((v): v is string => Boolean(v));

const allowedOriginsSet = new Set(allowedOrigins);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and same-origin requests.
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin) ?? origin;
    const ok = allowedOriginsSet.has(normalized);
    if (!ok) {
      console.warn(`[cors] blocked origin: ${origin} (normalized: ${normalized})`);
    }
    return callback(null, ok);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Minimal "whoami" identity endpoint (useful for refine / dashboard templates).
app.get('/api/auth/whoami', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const u = (session as any)?.user;
    if (!u) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.status(200).json({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.image ?? null,
    });
  } catch (e) {
    console.error('GET /api/auth/whoami error:', e);
    return res.status(500).json({ message: 'Failed to load identity' });
  }
});

// Alias for FE templates that call `/_auth/sessions/whoami`.
app.get('/api/_auth/sessions/whoami', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const u = (session as any)?.user;
    if (!u) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.status(200).json({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.image ?? null,
    });
  } catch (e) {
    console.error('GET /api/_auth/sessions/whoami error:', e);
    return res.status(500).json({ message: 'Failed to load identity' });
  }
});

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
  console.log(`Server is running on port http://localhost:${PORT}`);
})