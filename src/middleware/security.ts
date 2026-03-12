import { Request, Response, NextFunction } from 'express';
import aj from '../config/arcjet.js';
import { ArcjetNodeRequest, slidingWindow } from '@arcjet/node';

type RateLimitRole = 'admin' | 'teacher' | 'student' | 'guest';

function isDevLikeEnv() {
    return process.env.NODE_ENV !== 'production';
}

function isRelaxedReadListEndpoint(req: Request) {
    if (req.method !== 'GET') return false;
    const p = req.path ?? '';
    return p === '/api/subjects' || p === '/api/users' || p === '/api/classes';
}

function secondsFromInterval(interval: string): number | null {
    const m = interval.trim().match(/^(\d+)\s*([smhd])$/i);
    if (!m) return null;
    const n = Number.parseInt(m[1] ?? '', 10);
    const unit = (m[2] ?? '').toLowerCase();
    const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : unit === 'd' ? 86400 : 0;
    return Number.isFinite(n) && mult > 0 ? n * mult : null;
}

function extractRetryAfterSeconds(decision: unknown, fallbackSeconds: number): number {
    const d = decision as any;
    const results = Array.isArray(d?.results) ? d.results : [];
    const candidates: number[] = [];

    for (const r of results) {
        const reset =
            (typeof r?.reset === 'number' && r.reset) ||
            (typeof r?.rateLimit?.reset === 'number' && r.rateLimit.reset) ||
            (typeof r?.metadata?.reset === 'number' && r.metadata.reset);

        if (typeof reset === 'number' && Number.isFinite(reset) && reset > 0) {
            candidates.push(reset);
        }
    }

    const best = candidates.length ? Math.max(...candidates) : fallbackSeconds;
    return Math.max(1, Math.ceil(best));
}

const ajAdmin = aj.withRule(
    slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: isDevLikeEnv() ? 600 : 60,
    })
);

const ajTeacherStudent = aj.withRule(
    slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: isDevLikeEnv() ? 300 : 30,
    })
);

const ajGuest = aj.withRule(
    slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: isDevLikeEnv() ? 120 : 10,
    })
);

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();

    try {
        const role: RateLimitRole = (req as any).user?.role ?? 'guest';

        let client = ajGuest;
        let message: string;
        const relaxedList = isRelaxedReadListEndpoint(req);

        switch (role) {
            case 'admin':
                client = ajAdmin;
                message = relaxedList
                    ? 'Admin request limit exceeded for list endpoints. Please wait a moment and try again.'
                    : 'Admin request limit exceeded. Please wait a moment and try again.';
                break;
            case 'teacher':
            case 'student':
                client = ajTeacherStudent;
                message = relaxedList
                    ? 'Request limit exceeded for list endpoints. Please wait a moment and try again.'
                    : 'User request limit exceeded. Please wait a moment and try again.';
                break;
            default:
                client = ajGuest;
                message = relaxedList
                    ? 'Request limit exceeded for list endpoints. Please wait a moment and try again.'
                    : 'Guest request limit exceeded. Please sign up for higher limits.';
                break;
        }

        // Additional relax for dashboard list endpoints to prevent bursts on mount.
        if (relaxedList) {
            const dev = isDevLikeEnv();
            const max =
                role === 'admin'
                    ? dev
                        ? 1200
                        : 120
                    : role === 'teacher' || role === 'student'
                      ? dev
                          ? 600
                          : 60
                      : dev
                        ? 240
                        : 30;

            client = aj.withRule(
                slidingWindow({
                    mode: 'LIVE',
                    interval: '1m',
                    max,
                })
            );
        }

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.url,
            socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0' },
        };
        
        const decision = await client.protect(arcjetRequest);

        if (decision.isDenied() && decision.reason.isBot()) {
            return res
                .status(403)
                .json({ error: 'Forbidden: Bot Activity Detected', message: 'Automated requests are not allowed.' });
        }
        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({ error: 'Forbidden', message: 'Request blocked by security shield.' });
        }
        if (decision.isDenied() && decision.reason.isRateLimit()) {
            const windowSeconds = secondsFromInterval('1m') ?? 60;
            const retryAfter = extractRetryAfterSeconds(decision, windowSeconds);
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({ message, retryAfter });
        }

        return next(); 
    } catch (e) {
        console.error('Arcjet middleware error: ', e);
        // Fail open: don't take down the API due to protection middleware issues.
        return next();
    }
};

export default securityMiddleware; 