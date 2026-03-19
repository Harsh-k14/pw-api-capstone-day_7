import 'dotenv/config';
import { request, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup(_config: FullConfig) {
  const baseURL = process.env.BASE_URL || 'https://dummyjson.com';
  const username = process.env.USER || '';
  const password = process.env.PASS || '';

  if (!username || !password) {
    console.warn('[setup] No credentials found, skipping login.');
    return;
  }

  const ctx = await request.newContext({ baseURL });

  const res = await ctx.post('/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: { username, password, expiresInMins: 30 },
    timeout: 15_000,
  });

  if (!res.ok()) {
    console.warn(`[setup] Login failed (${res.status()})`);
    await ctx.dispose();
    return;
  }

  const { accessToken } = await res.json();

  // save token to file so tests can fall back to it if env var isn't set
  const dir = path.resolve('.auth');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'token.json'), JSON.stringify({ accessToken }, null, 2));

  process.env.AUTH_TOKEN = accessToken;
  console.log('[setup] Logged in, token ready.');

  await ctx.dispose();
}
