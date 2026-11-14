import { buildApp } from '../src/app.js';
import { connectMongoDB } from '../src/db/connection.js';

let appPromise: Promise<any> | null = null;

async function getFastifyApp() {
  if (!appPromise) {
    appPromise = (async () => {
      try {
        await connectMongoDB();
      } catch (err) {
        console.warn('MongoDB connection deferred in serverless handler:', err);
      }
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getFastifyApp();
  app.server.emit('request', req, res);
}
