import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { seedPermissions } from '../../data/seeds/permissions.seed.js';
import { seedRoles } from '../../data/seeds/roles.seed.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { roleRepository } from '../../src/modules/roles/role.repository.js';
import { hashPassword } from '../../src/lib/crypto.js';
import { ROLE_CODES } from '@consultancy/config';
import type { Types } from 'mongoose';

const app = createApp();

const TEST_USER = {
  email: 'testadmin@chibaeducation.com',
  password: 'TestPassword@123',
};

beforeAll(async () => {
  await seedPermissions();
  await seedRoles();

  const superAdminRole = await roleRepository.findByCodeWithoutPopulate(
    ROLE_CODES.SUPER_ADMIN,
  );

  if (superAdminRole) {
    const passwordHash = await hashPassword(TEST_USER.password);
    await UserModel.create({
      email: TEST_USER.email,
      passwordHash,
      role: superAdminRole._id as Types.ObjectId,
      profile: {
        firstName: 'Test',
        lastName: 'Admin',
        phone: '+9779999999',
      },
      status: 'ACTIVE',
      emailVerified: true,
    });
  }
});

describe('POST /api/v1/auth/login', () => {
  it('should reject request without body', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'anything' });
    expect(res.status).toBe(400);
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPassword@123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'AnyPassword@123' });
    expect(res.status).toBe(401);
  });

  it('should succeed with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresMfa).toBe(false);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.role.code).toBe('SUPER_ADMIN');
    expect(res.body.data.user.role.permissions).toBeInstanceOf(Array);
    expect(res.body.data.user.role.permissions.length).toBe(78);
  });
});

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});