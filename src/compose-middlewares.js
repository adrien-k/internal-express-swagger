/**
 * Creates a request handler function that runs through all given middlewares,
 * as long as they call their next function without error.
 *
 * Within a middleware:
 * - If next is not called, the chain stops there.
 * - If next is called with an error, the chain calls the main request handler next callback.
 *
 * Parameters can be made of multiple levels of nested arrays of middlewares.
 * ex: composeMiddlewares(middleware1, [middleware2, middleware3])
 *
 */
const composeMiddlewares = (...middlewares) => {
  function recursiveRunAllMiddlewares(middlewares, req, res, next) {
    if (middlewares.length) {
      // Same as Express handlers: a middleware is either a function or an array of middlewares
      const middleware = Array.isArray(middlewares[0])
        ? composeMiddlewares(...middlewares[0])
        : middlewares[0];
      middleware(req, res, (err) => {
        if (err) {
          // Stop the chain here
          next(err);
        } else {
          recursiveRunAllMiddlewares(middlewares.slice(1), req, res, next);
        }
      });
    } else {
      return next();
    }
  }

  return (req, res, next) => {
    recursiveRunAllMiddlewares(middlewares, req, res, next);
  };
};

module.exports = composeMiddlewares