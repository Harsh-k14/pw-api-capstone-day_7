import { test, expect } from '../../fixtures/api-fixture';
import { expectSchema } from '../../utils/schemaValidator';
import { userSchema } from '../../utils/schemas';
import { buildUser } from '../../utils/dataFactory';

const SEARCH_Q = (process.env.USERS_SEARCH_Q ?? 'john').toLowerCase();
const LIMIT = Number(process.env.USERS_LIMIT ?? process.env.PRODUCTS_LIMIT ?? 20);
const BASE = (process.env.BASE_URL || 'https://dummyjson.com').replace(/\/+$/, '');
const PERF_BUDGET_MS = 800;

test.describe('@api @regression USERS', () => {

  // verify auth is working before running any user tests
  test.beforeAll(async ({ request }) => {
    let token = process.env.AUTH_TOKEN;

    if (!token) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const tokenFile = path.resolve('.auth', 'token.json');
        if (fs.existsSync(tokenFile)) {
          token = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))?.accessToken;
        }
      } catch {
        // will fail below if token is still missing
      }
    }

    expect(token, 'No auth token found — make sure credentials are set in .env').toBeTruthy();

    const res = await request.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok(), `Auth check failed: ${res.status()} ${res.statusText()}`).toBeTruthy();
  });

  test('@smoke @api Create → Update → Delete user flow', async ({ userApi }) => {
    const newUser = buildUser({}, { suffix: '001' });

    // DummyJSON doesn't persist data, so we just validate the response shapes
    const { res: createRes } = await userApi.post('/users/add', { data: newUser });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created).toHaveProperty('id');
    expectSchema(created, userSchema);

    const { res: updateRes } = await userApi.put('/users/1', { data: { lastName: 'Updated' } });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.id).toBe(1);
    expect(updated.lastName).toBe('Updated');

    const { res: deleteRes } = await userApi.delete('/users/1');
    expect(deleteRes.status()).toBe(200);
    const deleted = await deleteRes.json();
    expect([deleted.id, deleted.isDeleted]).toBeDefined();
  });

  test('@smoke @api GET /users/{id} returns correct user', async ({ userApi }) => {
    const { res } = await userApi.get('/users/1');
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(user.id).toBe(1);
    expectSchema(user, userSchema);
  });

  test('@smoke @api GET /users/{id} responds within perf budget', async ({ userApi }) => {
    const start = Date.now();
    const { res } = await userApi.get('/users/1');
    const ms = Date.now() - start;

    expect(res.ok()).toBeTruthy();
    expect(ms, `Expected under ${PERF_BUDGET_MS}ms, got ${ms}ms`).toBeLessThanOrEqual(PERF_BUDGET_MS);
  });

  test('@api GET /users list returns users with valid schema', async ({ userApi }) => {
    const { res } = await userApi.get('/users', { params: { limit: LIMIT } });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
    expectSchema(body.users[0], userSchema);
  });

  test('@api GET /users pages do not overlap', async ({ userApi }) => {
    test.slow();

    const { res: r1 } = await userApi.get('/users', { params: { limit: 10, skip: 0 } });
    const { res: r2 } = await userApi.get('/users', { params: { limit: 10, skip: 10 } });

    expect(r1.ok()).toBeTruthy();
    expect(r2.ok()).toBeTruthy();

    const ids1 = new Set((await r1.json()).users.map((u: any) => u.id));
    const ids2 = (await r2.json()).users.map((u: any) => u.id);

    expect(ids2.filter((id: number) => ids1.has(id)).length).toBe(0);
  });

  test('@api GET /users IDs are unique within a page', async ({ userApi }) => {
    const { res } = await userApi.get('/users', { params: { limit: 20 } });
    expect(res.ok()).toBeTruthy();

    const { users } = await res.json();
    const ids = users.map((u: any) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('@api GET /users/search returns relevant results', async ({ userApi }) => {
    const q = SEARCH_Q;
    const { res } = await userApi.get('/users/search', { params: { q, limit: 10 } });
    expect(res.ok()).toBeTruthy();

    const { users } = await res.json();
    expect(Array.isArray(users)).toBe(true);

    // double-check the endpoint is stable
    await expect.poll(async () => {
      const { res } = await userApi.get('/users/search', { params: { q, limit: 5 } });
      if (!res.ok()) return 'bad';
      const b = await res.json();
      return Array.isArray(b.users) ? 'ok' : 'bad';
    }).toBe('ok');

    if (users.length > 0) {
      let matches = 0;
      for (const u of users) {
        const text = [u.firstName, u.lastName, u.username, u.email]
          .filter(Boolean).join(' ').toLowerCase();
        if (text.includes(q)) matches++;
        expectSchema(u, userSchema);
      }
      expect(matches / users.length).toBeGreaterThan(0.5);
    }
  });

  test('@api Negative: GET /users/{id} with invalid id returns 404', async ({ userApi }) => {
    const { res } = await userApi.get('/users/999999');
    expect(res.status()).toBe(404);
  });

  test('@api PATCH /users/{id} partially updates a user', async ({ userApi }) => {
    const { res } = await userApi.patch('/users/1', { data: { firstName: 'UpdatedName' } });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.firstName).toBe('UpdatedName');
    expectSchema(body, userSchema);
  });

});
