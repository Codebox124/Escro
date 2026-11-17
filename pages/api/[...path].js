// Serves the Express backend (backend/server.js) through Next.js API routes,
// so `npm run dev`, `next start` and Vercel run the frontend and the API together
// on one server: every /api/* request is handed to the Express app.
//
// The Pages Router is used (rather than an App Router route handler) because it
// gives Node's req/res objects, which Express understands natively.
//
// The backend's dependencies live in the root package.json and are listed in
// next.config.ts `serverExternalPackages`, so Next loads them from node_modules
// at runtime (and ships them with this function) instead of bundling them.

let app;
let startupError;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app = require('../../backend/server');
} catch (err) {
  startupError = err;
  console.error('[api] backend failed to start:', err);
}

export const config = {
  api: {
    bodyParser: false, // Express (and multer for uploads) parse the body themselves
    externalResolver: true, // Express sends the response
    responseLimit: false,
  },
};

export default function handler(req, res) {
  if (!app) {
    // The backend couldn't start (missing env vars, missing dependencies, ...).
    // Report why instead of a bare 500 so it can be fixed from the response/logs.
    const err = startupError;
    const missingEnv = /Missing Supabase environment variables/i.test(err?.message || '');
    res.status(500).json({
      status: 'error',
      message: missingEnv
        ? 'Server is not configured: add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY and JWT_SECRET in your hosting environment variables, then redeploy.'
        : `Backend failed to start: ${err?.code ? `${err.code} ` : ''}${err?.message || 'unknown error'}`,
    });
    return;
  }
  return app(req, res);
}
