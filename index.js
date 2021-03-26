const swaggerUi = require('swagger-ui-express');
const composeMiddlewares = require('./src/compose-middlewares');
const createGmailDomainRestrictionMiddleware = require('./src/gmail-domain-restriction-middleware');

module.exports = class InternalApiDocs {
  constructor({ info, googleOauthConfig }) {
    this.swaggerDocument = {
      swagger: '2.0',
      info,
      paths: {},
      definitions: {}
    };

    this._googleOauthConfig = googleOauthConfig;
  }

  expressHandler() {
    let handler;
    return (req, res, next) => {
      if (!handler) {
        // Lazy-setup the swagger-UI at the last moment, in case
        // some api docs are added *after* the express handler is registered.
        handler = composeMiddlewares(
          createGmailDomainRestrictionMiddleware(this._googleOauthConfig),
          swaggerUi.serve,
          swaggerUi.setup(this.swaggerDocument)
        )
      }
      handler(req, res, next)
    }
  }

  _addPathDocumentation(httpVerb, path, document) {
    if (!this.swaggerDocument.paths[path]) {
      this.swaggerDocument.paths[path] = {};
    }
    if (this.swaggerDocument.paths[path][httpVerb]) {
      throw new Error(`${httpVerb} ${path} is declared twice in InternalApiDocs`);
    }
    this.swaggerDocument.paths[path][httpVerb] = document;
  }

  get(...params) {
    this._addPathDocumentation('get', ...params);
  }
  post(...params) {
    this._addPathDocumentation('post', ...params);
  }
  patch(...params) {
    this._addPathDocumentation('patch', ...params);
  }
  put(...params) {
    this._addPathDocumentation('put', ...params);
  }
  delete(...params) {
    this._addPathDocumentation('delete', ...params);
  }

  definition(name, document) {
    if (this.swaggerDocument.definitions[name]) {
      throw new Error(`${httpVerb} ${path} is declared twice in InternalApiDocs`);
    }
    this.swaggerDocument.definitions[name] = document

    return `#/definitions/${name}`
  }
};
