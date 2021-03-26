const composeMiddlewares = require('./compose-middlewares');

/**
 * Create a simple router that follows Express router convention.
 * We could use express's Router, but having this simple light version avoids dependency
 * conflicts with the express already installed in the app embedding the docs.
 */
const SimpleRouter = () => {
  const routes = [];

  function router(req, res, next) {
    composeMiddlewares(
      routes
        .filter(
          (route) =>
            (!route.path || route.path === req.path) &&
            (!route.method || route.method === req.method)
        )
        .map(({ handler }) => handler)
    )(req, res, next);
  }

  function addRoute({ path, method, handlers }) {
    routes.push({ method, path, handler: composeMiddlewares(handlers) });
  }

  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    router[method] = function (path, ...handlers) {
      addRoute({ path, method: method.toUpperCase(), handlers });
    };
  }

  router.use = function (...handlers) {
    let path
    if (typeof handlers[0] === 'string') {
      path = handlers[0],
      handlers = handlers.slice(1)
    }
    addRoute({ path, handlers });
  };

  return router;
};

module.exports = SimpleRouter;
