import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

// Get all subjecst with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, Number.parseInt(String(limit), 10) || 10), 100);

        const offSet = (currentPage - 1) * limitPerPage;
        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`),
                )
            );
        }
        if (department) {
            // Escape special characters in department name to avoid injection
            const deptPattern = `%${String(department).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}%`;
            filterConditions.push(ilike(departments.name, deptPattern));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db
        .select({
            ...getTableColumns(subjects),
            department: { ...getTableColumns(departments) }
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offSet);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (e) {
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects' });
    }
})

export default router;