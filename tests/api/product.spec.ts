import { test, expect } from '../../fixtures/api-fixture';
import { expectSchema } from '../../utils/schemaValidator';
import { productSchema } from '../../utils/schemas';
import { buildProductQuery, buildProduct } from '../../utils/dataFactory';

const LIMIT = Number(process.env.PRODUCTS_LIMIT ?? 20);
const SEARCH_Q = (process.env.PRODUCTS_SEARCH_Q ?? 'laptop').toLowerCase();
const CATEGORY = process.env.PRODUCTS_CATEGORY || '';
const PERF_BUDGET_MS = 800;

test.describe('@api @regression PRODUCTS', () => {

  test('@smoke @api GET /products returns 200 and valid schema', async ({ productApi }) => {
    const { res } = await productApi.get('/products', { params: buildProductQuery({ limit: LIMIT }) });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expectSchema(body.products[0], productSchema);
  });

  test('@smoke @api GET /products/{id} returns correct product', async ({ productApi }) => {
    const { res } = await productApi.get('/products/1');
    expect(res.ok()).toBeTruthy();

    const product = await res.json();
    expectSchema(product, productSchema);
    expect(product.id).toBeGreaterThan(0);
    expect(typeof product.title).toBe('string');
  });

  test('@smoke @api GET /products/{id} responds within perf budget', async ({ productApi }) => {
    const start = Date.now();
    const { res } = await productApi.get('/products/1');
    const ms = Date.now() - start;

    expect(res.ok()).toBeTruthy();
    expect(ms, `Expected under ${PERF_BUDGET_MS}ms, got ${ms}ms`).toBeLessThanOrEqual(PERF_BUDGET_MS);
  });

  test('@api GET /products respects the limit param', async ({ productApi }) => {
    const { res } = await productApi.get('/products', { params: buildProductQuery({ limit: 5 }) });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.products.length).toBeLessThanOrEqual(5);
    if (body.products.length > 0) expectSchema(body.products[0], productSchema);
  });

  test('@api GET /products includes pagination metadata', async ({ productApi }) => {
    const { res } = await productApi.get('/products', { params: buildProductQuery({ limit: 7 }) });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(typeof body.total).toBe('number');
    expect(typeof body.skip).toBe('number');
    expect(typeof body.limit).toBe('number');
    expect(body.limit).toBe(7);
  });

  test('@api GET /products pages do not overlap', async ({ productApi }) => {
    const [{ res: r1 }, { res: r2 }] = await Promise.all([
      productApi.get('/products', { params: buildProductQuery({ limit: 10, skip: 0 }) }),
      productApi.get('/products', { params: buildProductQuery({ limit: 10, skip: 10 }) }),
    ]);

    expect(r1.ok()).toBeTruthy();
    expect(r2.ok()).toBeTruthy();

    const page1 = (await r1.json()).products;
    const page2 = (await r2.json()).products;

    expect(page1.length).toBeGreaterThan(0);
    expect(page2.length).toBeGreaterThan(0);

    const ids1 = new Set(page1.map((p: any) => p.id));
    const overlap = page2.filter((p: any) => ids1.has(p.id));
    expect(overlap.length).toBe(0);
  });

  test('@api GET /products IDs are unique within a page', async ({ productApi }) => {
    const { res } = await productApi.get('/products', { params: buildProductQuery({ limit: 15 }) });
    expect(res.ok()).toBeTruthy();

    const { products } = await res.json();
    const ids = products.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('@api GET /products all items have required fields', async ({ productApi }) => {
    const { res } = await productApi.get('/products', { params: buildProductQuery({ limit: 10 }) });
    expect(res.ok()).toBeTruthy();

    const { products } = await res.json();
    for (const p of products) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('title');
      if (p.price != null) expect(typeof p.price).toBe('number');
      if (p.rating != null) expect(typeof p.rating).toBe('number');
    }
  });

  test('@api GET /products/{id} core fields are present and non-null', async ({ productApi }) => {
    const { res } = await productApi.get('/products/5');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    for (const field of ['id', 'title', 'price', 'rating', 'stock']) {
      expect(body[field], `${field} should not be null`).not.toBeNull();
      expect(body[field], `${field} should not be undefined`).not.toBeUndefined();
    }
  });

  test('@api GET /products/search returns relevant results', async ({ productApi }) => {
    const { res } = await productApi.get('/products/search', { params: buildProductQuery({ q: SEARCH_Q }) });
    expect(res.ok()).toBeTruthy();

    const { products } = await res.json();
    expect(Array.isArray(products)).toBe(true);

    if (products.length > 0) {
      const matches = products.filter((p: any) => {
        const text = [p.title, p.category, p.description, p.brand]
          .filter(Boolean).join(' ').toLowerCase();
        return text.includes(SEARCH_Q);
      });
      expect(matches.length / products.length).toBeGreaterThan(0.7);
    }
  });

  test('@api GET /products/search with no match returns empty list', async ({ productApi }) => {
    const { res } = await productApi.get('/products/search', {
      params: buildProductQuery({ q: 'xyzzy_no_match_12345' }),
    });
    expect(res.ok()).toBeTruthy();

    const { products } = await res.json();
    expect(products.length).toBe(0);
  });

  test('@api GET /products/search?q=apple returns apple products', async ({ productApi }) => {
    const { res } = await productApi.get('/products/search', { params: { q: 'apple', limit: 20 } });
    expect(res.ok()).toBeTruthy();

    const { products } = await res.json();
    expect(products.length).toBeGreaterThan(0);

    for (const p of products) {
      const text = [p.title, p.brand, p.description].filter(Boolean).join(' ').toLowerCase();
      expect(text.includes('apple'), `Expected 'apple' in: ${text}`).toBe(true);
    }
  });

  test('@api GET /products/categories filters by category correctly', async ({ productApi }) => {
    const { res: catsRes } = await productApi.get('/products/categories', { timeout: 5000 });
    expect(catsRes.ok()).toBeTruthy();

    const raw = await catsRes.json();

    const toStr = (c: any): string => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object') return String(c.name ?? c.slug ?? c.title ?? '');
      return '';
    };

    const categories = Array.isArray(raw)
      ? raw.map(toStr).filter(s => s.trim().length > 0)
      : [];

    expect(categories.length).toBeGreaterThan(0);

    const preferred = CATEGORY.trim().toLowerCase();
    const unique = [...new Map(categories.map(s => [s.toLowerCase(), s])).values()];
    const ordered = preferred
      ? [preferred, ...unique.map(s => s.toLowerCase()).filter(c => c !== preferred)]
      : unique.map(s => s.toLowerCase());

    let picked: string | null = null;
    let pickedBody: any = null;

    for (let i = 0; i < Math.min(ordered.length, 5); i++) {
      const cat = ordered[i];
      const { res } = await productApi.get(`/products/category/${encodeURIComponent(cat)}`, {
        params: { limit: 10 },
        timeout: 5000,
      });
      if (!res.ok()) continue;

      const body = await res.json();
      if (Array.isArray(body.products) && body.products.length > 0) {
        picked = cat;
        pickedBody = body;
        break;
      }
    }

    if (!picked) {
      test.skip(true, 'Could not find a non-empty category — skipping.');
    }

    for (const p of pickedBody.products) {
      expect((p.category || '').toLowerCase()).toBe(picked!.toLowerCase());
      expectSchema(p, productSchema);
    }
  });

  test('@api Negative: GET /products/{id} with invalid id returns 404', async ({ productApi }) => {
    const { res } = await productApi.get('/products/999999');
    expect(res.status()).toBe(404);
  });

  test('@api POST /products/add creates a new product', async ({ productApi }) => {
    const newProduct = buildProduct({}, { suffix: '001' });

    const { res } = await productApi.post('/products/add', { data: newProduct });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.title).toBe(newProduct.title);
    expect(body.price).toBe(newProduct.price);
    expectSchema(body, productSchema);
  });

});
