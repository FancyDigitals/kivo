export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (message, error = null, meta = {}) => {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      error ? `\nError details: ${error.message || error}` : '',
      Object.keys(meta).length ? `\nContext: ${JSON.stringify(meta)}` : ''
    );
  },
};