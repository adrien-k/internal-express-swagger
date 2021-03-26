const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SimpleRouter = require('./simple-router')

const noopMiddleware = (_req, _res, next) => next();

const AUTHORIZATION_COOKIE = 'api-docs-authorized';

const createGmailDomainRestrictionMiddleware = (googleOauthConfig) => {
  if (!googleOauthConfig) {
    return noopMiddleware;
  }

  const { cookieSecret, googleClientId, googleClientSecret, allowedDomains } = googleOauthConfig;

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
        const hasOneVerifiedMailMatchingAllowedDomains = profile.emails.find(
          ({ value, verified }) =>
            verified && allowedDomains.find((domain) => value.match(new RegExp(`@${domain}$`)))
        )
        if (hasOneVerifiedMailMatchingAllowedDomains) {
          done(null, profile);
        } else {
          done(new Error(`Your email is not matching allowed domains: ${allowedDomains.join(', ')}`))
        }
      }
    );

  const authRouter = SimpleRouter();

  authRouter.use(cookieParser(cookieSecret))

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
      // If we reach here, the passport authenticate was a success
      res.cookie(AUTHORIZATION_COOKIE, 'true', { signed: true });
      res.redirect(req.baseUrl);
    }
  );

  authRouter.use((req, res, next) => {
    if (req.signedCookies[AUTHORIZATION_COOKIE] !== 'true') {
      // Low-cost html rendering, but enough to get started :D
      // req.baseUrl represents the route on which internalApiDocs is mounted.
      let HTLMmessage = `<p>You need to authenticate yourself<p><a href="${req.baseUrl}/auth">Open Google Oauth</a>`;
      if (req.params.failed) {
        HTLMmessage =
          '<p style="color: red; font-weight: bold;>Authentication failed</p>' + HTLMmessage;
      }
      res.send(HTLMmessage);
    } else {
      next() // allows what comes next: rendering the api docs
    }
  });

  return authRouter
};

module.exports = createGmailDomainRestrictionMiddleware
