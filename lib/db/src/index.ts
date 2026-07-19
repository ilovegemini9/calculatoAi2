import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: any = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.error("[db] Failed to initialize database:", err);
  }
} else {
  console.warn("[db] DATABASE_URL is not set. Running with mock/in-memory fallback.");
}

if (!db) {
  const dummyMethods = {
    select: () => {
      const queryObj: any = {
        from: () => queryObj,
        where: () => queryObj,
        limit: () => queryObj,
        execute: async () => [],
        then: (cb: any) => Promise.resolve([]).then(cb),
        catch: (cb: any) => Promise.resolve([]).catch(cb),
      };
      return queryObj;
    },
    insert: () => {
      const queryObj: any = {
        values: () => queryObj,
        onConflictDoNothing: async () => [],
        onConflictDoUpdate: async () => [],
        then: (cb: any) => Promise.resolve([]).then(cb),
        catch: (cb: any) => Promise.resolve([]).catch(cb),
      };
      return queryObj;
    },
    update: () => {
      const queryObj: any = {
        set: () => queryObj,
        where: () => queryObj,
        then: (cb: any) => Promise.resolve([]).then(cb),
        catch: (cb: any) => Promise.resolve([]).catch(cb),
      };
      return queryObj;
    },
    delete: () => {
      const queryObj: any = {
        where: () => queryObj,
        then: (cb: any) => Promise.resolve([]).then(cb),
        catch: (cb: any) => Promise.resolve([]).catch(cb),
      };
      return queryObj;
    },
  };
  db = new Proxy({}, {
    get: (target, prop) => {
      if (prop in dummyMethods) {
        return (dummyMethods as any)[prop];
      }
      return () => {
        throw new Error(`Database is not initialized (DATABASE_URL is missing)`);
      };
    }
  });
}

export { pool, db };
export * from "./schema";
