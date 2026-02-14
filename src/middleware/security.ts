import { Request, Response, NextFunction } from 'express';
import aj from '../config/arcjet';

const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if(process.env.NODE_ENV === 'test') return next();

    try {
        const role: RateLimitRole = req.user?.role ?? 'guest';

        let limit: number;
        let message: string:

        switch (role) {
            case 'admin':
                limit = 2;
                message = "Admin request limit exceeded (20 per minute)":
                break;

        }

        const client = aj.withRule(
            slidingWindow({
                mode: "LIVE",
                interval: '1m',
                max: limit,
            })
        )

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.url,
            socket: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0',
        }
    } catch (e) {

    }
}