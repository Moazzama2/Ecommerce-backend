// ============================================================
// CORS ALLOW-LIST — shared by the REST app (app.js) and the
// WebSocket server (server.js), so both enforce the same origins.
//
//   CORS_ORIGINS=http://localhost:3000,https://admin.example.com
//
// Reflecting every origin (`origin: true`) is unsafe now that sessions
// ride on an httpOnly cookie: any site could make credentialed calls
// on behalf of a signed-in admin. Requests without an Origin header
// (curl, server-to-server) are always allowed.
// ============================================================

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Vite dev servers, outside production only.
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  );
}

const isAllowed = (origin) => !origin || allowedOrigins.includes(origin);

export const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowed(origin));
  },
  credentials: true,
};

export { allowedOrigins, isAllowed };
