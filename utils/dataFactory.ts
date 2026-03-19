export type UserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
};

export function buildUser(
  overrides: Partial<UserPayload> = {},
  opts: { suffix?: string | number } = {}
): UserPayload {
  const sfx = opts.suffix ? String(opts.suffix) : '';
  return {
    firstName: 'Dummy',
    lastName: 'Name',
    email: sfx ? `dummy.name${sfx}@example.com` : 'dummy.name@example.com',
    username: sfx ? `dummy_${sfx}` : 'dummy',
    password: 'pass1234',
    ...overrides,
  };
}

export type ProductPayload = {
  title: string;
  description?: string;
  price?: number;
  rating?: number;
  brand?: string;
  category?: string;
};

export function buildProduct(
  overrides: Partial<ProductPayload> = {},
  opts: { suffix?: string | number } = {}
): ProductPayload {
  const sfx = opts.suffix ? String(opts.suffix) : '';
  return {
    title: sfx ? `Laptop ${sfx}` : 'Laptop',
    description: sfx ? `Laptop ${sfx} by Acme` : 'Laptop by Acme',
    price: 499,
    rating: 4.2,
    brand: 'Acme',
    category: 'laptops',
    ...overrides,
  };
}

export function buildProductQuery(filters: {
  q?: string;
  limit?: number;
  skip?: number;
} = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (filters.q !== undefined) out.q = filters.q;
  if (typeof filters.limit === 'number') out.limit = filters.limit;
  if (typeof filters.skip === 'number') out.skip = filters.skip;
  return out;
}
