import { Express } from 'express';
import recursive from 'recursive-readdir';
import path from 'path';

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

const routeFromPath = (path:string, pathPrefix:string):string => {
  const routePath = path.substring(pathPrefix.length);
    const route = routePath
      .replace(/\.\./g, '')
      .replace(/(?:\.[tj]s)$/, '')
      .replace(/\[([^\]]+)\]/g, (_:string, p1:string) => `:${p1}`);
  return route;
}

export const FsRouter = async (app: Express, options: FsRouterOptions) => {
  const files = await recursive(options.routesDir)
  const middlewaresPath:string[] = [], nonMiddlewaresPath:string[] = []
  for(const file of files) {
    if (/_middleware(?:\.[\-\w]+)?\.[tj]s$/.test(file))
      middlewaresPath.push(file)
    else
      nonMiddlewaresPath.push(file)
  }

  const middlewares:any[] = []
  for(const file of middlewaresPath) {
    const middleware = await import(file)
    if (file.indexOf(options.routesDir) !== 0) {
      console.warn(`Route ${file} does not start with ${options.routesDir}. Ignoring.`);
      continue;
    }

    const route = routeFromPath(file, options.routesDir);
    middlewares.push({ name: path.basename(route), routePath: path.dirname(route), middleware: middleware.default })
  }
  middlewares.sort((a, b) => a.routePath.length - b.routePath.length)

  for(const file of nonMiddlewaresPath) {
    const routeHandler = await import(file);
    if (file.indexOf(options.routesDir) !== 0) {
      console.warn(`Route ${file} does not start with ${options.routesDir}. Ignoring.`);
      continue;
    }

    const route = routeFromPath(file, options.routesDir);
    const activeMiddlewares = middlewares
      .filter(m => route.startsWith(m.routePath))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(m => m.middleware)

    for(const [key, value] of Object.entries(routeHandler)) {
      const method = key.split(' ')?.[0]?.toLowerCase() ?? 'get';
      if (!allowedMethods.includes(method)) continue;

      const _appMethod = _getExpressMethod(app, method);
      _appMethod.call(app, options.routePrefix + route, ...activeMiddlewares, value);
      if (/\/index$/.test(route)) {
        _appMethod.call(app, options.routePrefix + route.replace(/\/index$/, ''), ...activeMiddlewares, value);
      }
    }
  }
}