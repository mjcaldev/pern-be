import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { user } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

// Get all users with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, Number.parseInt(String(limit), 10) || 10), 100);

        const offSet = (currentPage - 1) * limitPerPage;
        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${String(search)}%`),
                    ilike(user.email, `%${String(search)}%`),
                )
            );
        }

        if (role) {
            const roleStr = String(role);
            const allowedRoles = ['student', 'teacher', 'admin'] as const;
            if (allowedRoles.includes(roleStr as (typeof allowedRoles)[number])) {
                filterConditions.push(eq(user.role, roleStr as (typeof allowedRoles)[number]));
            }
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db
            .select({
                ...getTableColumns(user),
            })
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offSet);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
})

export default router;
