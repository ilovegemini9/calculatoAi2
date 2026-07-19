import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

// Single-row store holding the entire Calculator Platform app state
// (calculators, articles, admin users, settings, etc.) as a JSON blob.
// This lets the api-server keep its existing in-memory object-shaped logic
// while gaining durable, serverless-safe persistence (works identically on
// Replit and on Vercel serverless functions, unlike a local JSON file).
export const appStateTable = pgTable("app_state", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Lightweight backup snapshots (created via the admin "Backup" action)
export const appStateBackupTable = pgTable("app_state_backups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
