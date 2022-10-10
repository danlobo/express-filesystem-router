import { Express } from 'express';
import recursive from 'recursive-readdir';

const _getExpressMethod = (app:Express, method:string):Function => {
  const expressMethodsDict: { [id: string]: Function; } = {
    middlewares: app.use,
    get: app.get,
    post: app.post,
    put: app.put,
    delete: app.delete,
    patch: app.patch,
    options: app.options,
    head: app.head,
  };
  return expressMethodsDict[method];
}
const allowedMethods = ['middlewares', 'get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

export type FsRouterOptions = {
  routesDir: string,
  routePrefix?: string,
}

export const FsRouter = async (app: Express, options: FsRouterOptions) => {
  const files = await recursive(options.routesDir)
  for(const file of files) {
    const routeHandler = await import(file);
    if (file.indexOf(options.routesDir) !== 0) {
      console.warn(`Route ${file} does not start with ${options.routesDir}. Ignoring.`);
      continue;
    }

    const routePath = file.substring(options.routesDir.length);
    const route = routePath
      .replace(/\.\./g, '')
      .replace(/(?:\.ts|.js)$/, '')
      .replace(/\[([^\]]+)\]/g, (_:string, p1:string) => `:${p1}`);

    for(const [key, value] of Object.entries(routeHandler)) {
      const method = key.split(' ')?.[0]?.toLowerCase() ?? 'get';
      if (!allowedMethods.includes(method)) continue;

      const _appMethod = _getExpressMethod(app, method);
      _appMethod.call(app, options.routePrefix + route, value);
      if (/\/index$/.test(route)) {
        _appMethod.call(app, options.routePrefix + route.replace(/\/index$/, ''), value);
      }
    }
  }
}