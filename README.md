# Internal Express Swagger

Thin wrapper around https://www.npmjs.com/package/swagger-ui-express, adding access restriction to team members using Google Oauth.
It also adds an easy way to declare route documentation in Javascript.

## Installation

```bash
npm install --save @layer0/internal-express-swagger
```

## Configuration

### Google Oauth

You will need Google Oauth credentials to authenticate your users with. Those credentials need to allow the callback URI redirecting to your API.

The callback URI is constructed as:

https://`<your-host>`/`<API docs mount path>`/auth/callback

For example if your API is hosted at https://my.api, and you mount the docs on `/api-docs`, the allowed redirect uri must be https://my.api/api-docs/auth/callback.

*Note that this is optional, pass googleOauthConfig: null to skip the restriction*

### Cookie secret

Generate a long string (~256 chars) and keep it secret.

This ensures that the authorization cookie was produced by the API and not been forged.

*If your already have `cookie-parser` mounted on your Express App, you can ignore this parameter*

### Allowed domains

Provide a list of email domains that are allowed to access the API docs. Other gmail accounts will be rejected.

## Development

1. Copy `.env.dist` into `.env` and setup your Google credentials and allowed domains.
1. Run `npm start` and open http://localhost:3000/api-docs

## Usage

```js 
const express = require('express');
const app = express();
const port = 3000;
const InternalExpressSwagger = require('@layer0/internal-express-swagger');

const apiDoc = new InternalExpressSwagger({
  // See Swagger 2.0 specifications https://swagger.io/specification/v2/#info-object for 'info' field
  info: {
    title: 'Pet Store',
    description: 'API for my Pet Store'
  },
  googleOauthConfig: {
    cookieSecret: process.env.COOKIE_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowedDomains: process.env.ALLOWED_DOMAINS.split(','),
  },
});

// See Swagger 2.0 specifications https://swagger.io/specification/v2/#paths-object for the 'path' field
apiDoc.get('/pet/{id}', {
  description: 'Retrieve a pet by ID',
  parameters: [
    {
      name: 'id',
      in: 'path',
      type: 'string',
      description: 'ID of your pet',
      required: true,
      example: '1',
    },
  ],
  produces: ['application/json'],
  responses: {
    200: {
      examples: {
        'application/json': {
          id: 1,
          name: 'Medor',
        },
      },
    },
  },
});

app.use('/api-docs', apiDoc.expressHandler());

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

Check out the [server example](server-example.js) for more details
