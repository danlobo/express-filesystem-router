# express-router-filesystem

[![Build Status](https://travis-ci.org/expressjs/express-router-filesystem.svg?branch=master)](https://travis-ci.org/expressjs/express-router-filesystem)
[![Coverage Status](https://coveralls.io/repos/expressjs/express-router-filesystem/badge.svg?branch=master&service=github)](https://coveralls.io/github/expressjs/express-router-filesystem?branch=master)
[![NPM version](https://badge.fury.io/js/express-router-filesystem.svg)](http://badge.fury.io/js/express-router-filesystem)
[![Dependency Status](https://david-dm.org/expressjs/express-router-filesystem.svg)](https://david-dm.org/expressjs/express-router-filesystem)
[![devDependency Status](https://david-dm.org/expressjs/express-router-filesystem/dev-status.svg)](https://david-dm.org/expressjs/express-router-filesystem#info=devDependencies)

This module is a simple recursive filesystem reader that allows you to define routes in a filesystem structure.

## Installation

```sh
$ npm install express-router-filesystem
```
or, using yarn
```sh
$ yarn add express-router-filesystem
```
## Usage

```js
const express = require('express');
const router = require('express-router-filesystem');

const app = express();

app.use(router({
  routesDir: __dirname + '/routes',
  routePrefix: '/api'
}));

app.listen(3000);
```
or using imports
```js
import express from 'express';
import router from 'express-router-filesystem';

const app = express();

app.use(router({
  routesDir: __dirname + '/routes',
  routePrefix: '/api'
}));

app.listen(3000);
```

### The route files

Export a function that takes the express router as an argument. The function name must be the method to match. The function should return the router.

```js
// routes/users/get.js
module.exports = { 
  get(req, res) {
    res.send('GET /users');
  };
};
```
or using exports
```js
// routes/users/get.js
export const get = (req, res) => {
  res.send('GET /users');
};
```

### Named Params

Use brackets to assign a named parameter to a route. The value of the parameter will be available in the request object as `req.params.<name>`.

```js
// routes/users/[id].js
module.exports = { 
  get(req, res) {
    res.send('GET /users, id ' + req.params.id);
  };
};
```
or using exports
```js
// routes/users/[id].js
export const get = (req, res) => {
  res.send('GET /users, id ' + req.params.id);
};
```

## Middlewares

You can define middlewares for a route by creating a file with the name `_middleware.js`. The file should export a default function that takes the express router as an argument. The function should return the router.

```js
// routes/users/_middleware.js
module.exports = router => {
  router.use((req, res, next) => {
    console.log('middleware');
    next();
  });
  return router;
};
```
or using exports
```js
// routes/users/_middleware.js
export default router => {
  router.use((req, res, next) => {
    console.log('middleware');
    next();
  });
  return router;
};
```

Any middleware defined in the `_middleware.js` file will be applied to all routes in the directory and its subdirectories. For example, if you have a route structure like this:

- routes
  - _middleware.js (1)
  - users
    - _middleware.js (2)
    - [id].js
    - index.js
    - posts
      - _middleware.js (3)
      - [id].js
      - index.js

Calling /users/1 will call the middlewares numbers 1 and 2. Calling /users/posts/1 will call the middlewares numbers 1, 2 and 3.

You can also define multiple middlewares for a route by naming the file as `_middleware.<name>.js`. The name can be alphanumeric characters, `-` and `_`. Middlewares will be called in alphabetical order.

Examples:

- `_middleware.1-login.js`
- `_middleware.session.js`
- `_middleware.2_authorization_token.js`

## Options

### routesDir

The absolute path to the directory containing the routes. This is required.

### routePrefix

A prefix to add to all routes. This is optional.
