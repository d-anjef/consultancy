import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

const TEST_MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://test:testpassword@localhost:27018/consultancy_test?authSource=admin';

const TEST_DB_NAME = process.env.MONGODB_DB_NAME || 'consultancy_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGODB_URI, { dbName: TEST_DB_NAME });
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]!.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.dropDatabase();
    } catch {
      // ignore
    }
    await mongoose.disconnect();
  }
});