import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: connectionString ?? '',
  },
  migrate: {
    adapter: () => {
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set.');
      }
      return new PrismaPg({ connectionString });
    },
  },
});
