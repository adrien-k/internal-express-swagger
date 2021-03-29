const express = require('express');
const app = express();
const port = 3000;
const InternalExpressSwagger = require('./index');

require('dotenv').config();

const apiDoc = new InternalExpressSwagger({
  // See Swagger 2.0 specifications https://swagger.io/specification/v2/#info-object for 'info' field
  info: {
    title: 'Pet Store',
    description: 'API for my Pet Store',
  },
  googleOauthConfig: {
    cookieSecret: process.env.COOKIE_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowedDomains: process.env.ALLOWED_DOMAINS.split(','),
    sessionDuration: 60 * 60 * 1000
  },
});

/**
 * Here are a few examples of adding Swagger documentation for routes
 *
 * See Swagger 2.0 specifications https://swagger.io/specification/v2/#paths-object for the 'path' field
 */
apiDoc.post('/pet', {
  description: 'Add a pet to the store',
  parameters: [
    {
      name: 'body',
      in: 'body',
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Medor',
          },
        },
      },
    },
  ],
  consumers: ['application/json'],
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
app.post('/pet', (req, res) => {
  res.status(201).send();
});

apiDoc.get('/pet/{id}', {
  description: 'Retrieve a pet by ID',
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'ID of your pet',
      required: true,
      type: 'string',
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
app.get('/pet:id', (req, res) => {
  res.json({
    id,
    name: 'Metor',
  });
});

/**
 * Its also possible to use Swagger definitions
 */
const petDefinition = apiDoc.definition('Pet', {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      example: 1,
    },
    name: {
      type: 'string',
      example: 'Medor',
    },
  },
});

apiDoc.get('/pet', {
  description: 'Retrieve all the pets',
  produces: ['application/json'],
  responses: {
    200: {
      schema: {
        type: 'array',
        items: {
          $ref: petDefinition,
        },
      },
    },
  },
});
app.get('/pet', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Metor',
    },
  ]);
});

app.use('/api-docs', apiDoc.expressHandler());

/**
 * You can also use the ApiDocs internal authorization to by-pass the regular authorization
 * required by your API.
 * That way it makes it easy to "Try out" the requests directly in Swagger UI.
 */
app.use(apiDoc.apiDocsAuthorizationMiddleware());
app.use('/private', (req, res, next) => {
  if (req.internalApiDocsAuthorized || req.headers.authorization === 'xxxxx') {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
});
apiDoc.get('/private/pet', {
  description: 'Retrieve all the pets, but this route is private',
  produces: ['application/json'],
  responses: {
    200: {
      schema: {
        type: 'array',
        items: {
          $ref: petDefinition,
        },
      },
    },
  },
});
app.get('/private/pet', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'secret-Metor',
    },
  ]);
});

app.listen(port, () => {
  console.log(`API Docs are live at http://localhost:${port}/api-docs`);
});
