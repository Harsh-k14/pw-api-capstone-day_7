import type { APIRequestContext, APIResponse } from '@playwright/test';

type Headers = Record<string, string>;
type QueryParams = Record<string, string | number | boolean | undefined | null>;

type RequestOpts = {
  headers?: Headers;
  params?: QueryParams;
  timeout?: number;
  data?: any;
};

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function resolveUrl(pathOrUrl: string, params?: QueryParams): string {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const base = process.env.BASE_URL || 'https://dummyjson.com';
  const url = isAbsolute
    ? pathOrUrl
    : `${base.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`;
  return `${url}${buildQuery(params)}`;
}

export class APIClient {
  constructor(
    private request: APIRequestContext,
    private defaultHeaders: Headers = { 'Content-Type': 'application/json' }
  ) {}

  private mergeHeaders(overrides?: Headers): Headers {
    return { ...this.defaultHeaders, ...overrides };
  }

  async get(pathOrUrl: string, opts: RequestOpts = {}): Promise<{ res: APIResponse }> {
    const res = await this.request.get(resolveUrl(pathOrUrl, opts.params), {
      headers: this.mergeHeaders(opts.headers),
      timeout: opts.timeout,
    });
    return { res };
  }

  async post(pathOrUrl: string, opts: RequestOpts = {}): Promise<{ res: APIResponse }> {
    const res = await this.request.post(resolveUrl(pathOrUrl, opts.params), {
      headers: this.mergeHeaders(opts.headers),
      timeout: opts.timeout,
      data: opts.data,
    });
    return { res };
  }

  async put(pathOrUrl: string, opts: RequestOpts = {}): Promise<{ res: APIResponse }> {
    const res = await this.request.put(resolveUrl(pathOrUrl, opts.params), {
      headers: this.mergeHeaders(opts.headers),
      timeout: opts.timeout,
      data: opts.data,
    });
    return { res };
  }

  async patch(pathOrUrl: string, opts: RequestOpts = {}): Promise<{ res: APIResponse }> {
    const res = await this.request.patch(resolveUrl(pathOrUrl, opts.params), {
      headers: this.mergeHeaders(opts.headers),
      timeout: opts.timeout,
      data: opts.data,
    });
    return { res };
  }

  async delete(pathOrUrl: string, opts: RequestOpts = {}): Promise<{ res: APIResponse }> {
    const res = await this.request.delete(resolveUrl(pathOrUrl, opts.params), {
      headers: this.mergeHeaders(opts.headers),
      timeout: opts.timeout,
    });
    return { res };
  }
}
