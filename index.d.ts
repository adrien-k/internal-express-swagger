import type {RequestHandler} from 'express'

declare interface ConstructorParams {
  info: object,
  googleOauthConfig?: {
    cookieSecret: string;
    googleClientId: string;
    googleClientSecret: string;
    allowedDomains: string[];
  }
}

declare class InternalApiDocs {
  constructor(params: ConstructorParams);

  definition(name: string, document: object): string

  get(path: string, document: object): void
  post(path: string, document: object): void
  put(path: string, document: object): void
  patch(path: string, document: object): void
  delete(path: string, document: object): void

  expressHandler(): RequestHandler
}

export default InternalApiDocs;
