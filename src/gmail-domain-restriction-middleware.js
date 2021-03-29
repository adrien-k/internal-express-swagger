const cookieParser = require('cookie-parser');
const passport = require('passport');
const composeMiddlewares = require('./compose-middlewares');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SimpleRouter = require('./simple-router');

const noopMiddleware = (_req, _res, next) => next();

/**
 *
 * When a Google User email matches the allowed domain, we set a signed cookie giving
 * the user access to the Api Docs.
 *
 * Note that the main API may also rely on this authorization cookie to open the API
 * for live testing in Swagger UI, so we need to keep this secure.
 *
 * Cookie is:
 * - signed with a secret, so it cannot be forged
 * - http only so it cannot be read from javascript
 * - valid for only 1H (by default) so that even it is captured, it cannot be replayed for ever.
 *
 * Re-authenticating with Google is quite quick anyway.
 */
const DEFAULT_SESSION_DURATION = 60 * 60 * 1000; // 1 hour
const AUTHORIZATION_COOKIE = 'api-docs-authorized';
const createApiDocsAutorizationMiddleware = ({
  cookieSecret,
  sessionDuration = DEFAULT_SESSION_DURATION,
}) => {
  return composeMiddlewares(cookieParser(cookieSecret), (req, res, next) => {
    req.internalApiDocsAuthorized = false
    try {
      if (req.signedCookies[AUTHORIZATION_COOKIE]) {
        const { time } = JSON.parse(req.signedCookies[AUTHORIZATION_COOKIE])
        req.internalApiDocsAuthorized = Date.now() - time < sessionDuration;
      }
    } catch(e) {
      // not json, ignoring the cookie
    }

    req.signedCookies[AUTHORIZATION_COOKIE] &&
    Date.now() - parseInt(req.signedCookies[AUTHORIZATION_COOKIE]) < sessionDuration;

    req.internalApiDocsAuthorize = (email) => {
      res.cookie(AUTHORIZATION_COOKIE, JSON.stringify({email, time: Date.now()}), {
        signed: true,
        httpOnly: true,
      });
    };

    next();
  });
};

const createGmailDomainRestrictionMiddleware = (googleOauthConfig) => {
  if (!googleOauthConfig) {
    return noopMiddleware;
  }

  const { googleClientId, googleClientSecret, allowedDomains } = googleOauthConfig;

  // We need to lazy-initialize Passport strategy to dynamically
  // construct the callbackURL from the request host and baseUrl.
  // This way we don't make assumption on how internalApiDocs is embedded in the main Express app.
  // /!\ We use headers.host and not express's req.hostname because it strips the port
  //     although this is fixed in Express 5
  const getPassportStragegy = (req) =>
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${req.protocol}://${req.headers.host}${req.baseUrl}/auth/callback`,
      },
      function (_token, _tokenSecret, profile, done) {
        const oneMatchingEmail = profile.emails.find(
          ({ value, verified }) =>
            verified && allowedDomains.find((domain) => value.match(new RegExp(`@${domain}$`)))
        );
        if (oneMatchingEmail) {
          done(null, {email: oneMatchingEmail});
        } else {
          done(
            new Error(`Your email is not matching allowed domains: ${allowedDomains.join(', ')}`)
          );
        }
      }
    );

  const authRouter = SimpleRouter();

  authRouter.use(createApiDocsAutorizationMiddleware(googleOauthConfig));

  authRouter.get('/auth', (req, res, next) => {
    passport.authenticate(getPassportStragegy(req), {
      scope: 'https://www.googleapis.com/auth/userinfo.email',
    })(req, res, next);
  });

  authRouter.get(
    '/auth/callback',

    (req, res, next) => {
      passport.authenticate(getPassportStragegy(req), {
        // We don't use express session, we just store a authorized flag in a signed-cookie
        session: false,
        // req.baseUrl represents the route on which internalApiDocs is mounted
        failureRedirect: `${req.baseUrl}?failed=true`,
      })(req, res, next);
    },
    function (req, res) {
      // If passport authenticate did not fail, we are authorized to see the docs
      if (req.user) {
        req.internalApiDocsAuthorize(req.user.email);
      }
      res.redirect(req.baseUrl);
    }
  );

  authRouter.use((req, res, next) => {
    if (!req.internalApiDocsAuthorized) {
      // Low-cost html rendering, but enough to get started :D
      // req.baseUrl represents the route on which internalApiDocs is mounted.
      let HTLMmessage = `<p>Access to API docs is restricted to users with emails at: ${allowedDomains.join(
        ', '
      )}.</p><a href="${req.baseUrl}/auth">Authenticate with Google</a>`;
      if (req.params.failed) {
        HTLMmessage =
          '<p style="color: red; font-weight: bold;>Authentication failed</p>' + HTLMmessage;
      }
      res.send(HTLMmessage);
    } else {
      next(); // allows what comes next: rendering the api docs
    }
  });

  // We expose the authorization middleware as it can be used to authorize access to the underlyinh
  // API too.
  authRouter.createApiDocsAutorizationMiddleware;

  return authRouter;
};

exports.createGmailDomainRestrictionMiddleware = createGmailDomainRestrictionMiddleware;
exports.createApiDocsAutorizationMiddleware = createApiDocsAutorizationMiddleware;
