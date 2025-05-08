import app from '../../server/index'; // Import the Hono app from server/index.ts

// This Pages Function will handle all requests to /api/*
export const onRequest: PagesFunction = (context) => {
    // Pass the entire Pages Function context to Hono
    // Hono's Cloudflare adapter knows how to handle it.
    return app.fetch(context.request, context.env, context);
};
