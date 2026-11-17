// Serves the Express backend (backend/server.js) through Next.js API routes,
// so `npm run dev`, `next start` and Vercel run the frontend and the API together
// on one server: every /api/* request is handed to the Express app.
//
// The Pages Router is used (rather than an App Router route handler) because it
// gives Node's req/res objects, which Express understands natively.
//
// Express isn't bundled: it's loaded with Node's own require at runtime from
// backend/ (and backend/node_modules). Bundlers can't follow Express's dynamic
// requires, so `eval('require')` keeps it out of the bundle on purpose.
// next.config.ts traces backend/** into the deployment so the files are there.
import path from 'path';

let app;
function getApp() {
  if (!app) {
    const nodeRequire = eval('require');
    app = nodeRequire(path.join(process.cwd(), 'backend', 'server.js'));
  }
  return app;
}

export const config = {
  api: {
    bodyParser: false, // Express (and multer for uploads) parse the body themselves
    externalResolver: true, // Express sends the response
    responseLimit: false,
  },
};

export default function handler(req, res) {
  return getApp()(req, res);
}
