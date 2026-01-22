import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdate(() => new Date()),
}

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', { length: 50}).notNull(),
    name: varchar('name', { length: 255}).notNull(),
    description: varchar('description', { length: 255}),
    ...timestamps,
})

export const subjects = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255}).notNull(),
    code: varchar('code', { length: 50}).notNull(),
    description: varchar('description', { length: 255}),
    ...timestamps,
})