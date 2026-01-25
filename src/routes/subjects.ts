import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema';
import { db } from '../db/index';

const router = express.Router();

// Get all subjecst with optional search, filter, and pagination
router.get('/', async (req, res) => {
    try {
        const { search, filter, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

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
            filterConditions.push(ilike(departments.name, `%${department}%`));
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