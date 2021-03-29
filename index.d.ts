import type { RequestHandler } from 'express';

declare interface ConstructorParams {
  // See Swagger 2.0 specifications https://swagger.io/specification/v2/#info-object
  info: object;
  googleOauthConfig?: {
    // Google Client ID to use for OAuth
    googleClientId: string;
    // Google Secret ID to use for OAuth
    googleClientSecret: string;
    // Google email domains authorized to access the Api Docs
    allowedDomains: string[];
    // Duration of the session in milliseconds. (1h by default)
    sessionDuration?: number;
    // Secret to use to sign the session cookie. Can be left blank if cookie-parser is already mounted in your Express App
    cookieSecret?: string;
  };
}

declare class InternalApiDocs {
  constructor(params: ConstructorParams);

  /**
   * Add a Swagger definition.
   * @param name
   * @param document https://swagger.io/specification/v2/#definitions-object
   * @return A reference string to that definition
   */
  definition(name: string, document: object): string;

  /**
   * Adds a path definition on the given path for HTTP GET
   * @param path
   * @param document https://swagger.io/specification/v2/#paths-object
   */
  get(path: string, document: object): void;
  /**
   * Adds a path definition on the given path for HTTP POST
   * @param path
   * @param document https://swagger.io/specification/v2/#paths-object
   */
  post(path: string, document: object): void;
  /**
   * Adds a path definition on the given path for HTTP PUT
   * @param path
   * @param document https://swagger.io/specification/v2/#paths-object
   */
  put(path: string, document: object): void;
  /**
   * Adds a path definition on the given path for HTTP PATCH
   * @param path
   * @param document https://swagger.io/specification/v2/#paths-object
   */
  patch(path: string, document: object): void;
  /**
   * Adds a path definition on the given path for HTTP DELETE
   * @param path
   * @param document https://swagger.io/specification/v2/#paths-object
   */
  delete(path: string, document: object): void;

  /**
   * Creates an express middleware mounting the Swagger UI with restricted access
   * based on googleOauthConfig.
   */
  expressHandler(): RequestHandler;

  /**
   * Creates an Express middleware that sets `req.internalApiDocsAuthorized` to true if current
   * request is authorized to access API Docs.
   * This middleware can be used to also give access to underlying API routes.
   */
  apiDocsAuthorizationMiddleware(): RequestHandler;
}

export default InternalApiDocs;
