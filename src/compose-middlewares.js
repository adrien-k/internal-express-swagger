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