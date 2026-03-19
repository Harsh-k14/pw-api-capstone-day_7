import { test as base, expect as baseExpect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { APIClient } from '../utils/apiClient';
import fs from 'fs';
import path from 'path';

type Fixtures = {
  productApi: APIClient;
  userApi: APIClient;
};

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  let token = process.env.AUTH_TOKEN;

  // fall back to the token file written by global setup
  if (!token) {
    try {
      const tokenFile = path.resolve('.auth', 'token.json');
      if (fs.existsSync(tokenFile)) {
        const parsed = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
        token = parsed?.accessToken;
      }
    } catch {
      // no token file, that's fine — tests that need auth will fail on their own
    }
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const test = base.extend<Fixtures>({
  productApi: async ({ request }, use) => {
    await use(new APIClient(request as APIRequestContext, getAuthHeaders()));
  },

  userApi: async ({ request }, use) => {
    await use(new APIClient(request as APIRequestContext, getAuthHeaders()));
  },
});

export const expect = baseExpect;
