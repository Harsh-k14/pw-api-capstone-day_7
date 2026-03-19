declare namespace NodeJS {
  interface ProcessEnv {
    BASE_URL?: string;
    USER?: string;
    PASS?: string;
    AUTH_TOKEN?: string;
    PRODUCTS_LIMIT?: string;
    USERS_LIMIT?: string;
    PRODUCTS_CATEGORY?: string;
    PRODUCTS_SEARCH_Q?: string;
    USERS_SEARCH_Q?: string;
  }
}
