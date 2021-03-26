const express = require('express');
const app = express();
const port = 3000;
const InternalExpressSwagger = require('./index');

require('dotenv').config()

const apiDoc = new InternalExpressSwagger({
  // See Swagger 2.0 info specifications https://swagger.io/specification/v2/#info-object
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

/**
 * Here are a few examples of adding Swagger documentation for routes
 *
 * See Swagger 2.0 paths specifications https://swagger.io/specification/v2/#paths-object for a complete
 * of available options
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
            example: 'Medor'
          }
        }
      }
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

apiDoc.get('/pet/{id}', {
  description: 'Retrieve a pet by ID',
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'ID of your pet',
      required: true,
      type: 'string',
      example: '1'
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

/**
 * Its also possible to use Swagger definitions
 */
const petDefinition = apiDoc.definition('Pet', {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Medor'
    }
  }
})

apiDoc.get('/pet', {
  description: 'Retrieve all the pets',
  produces: ['application/json'],
  responses: {
    200: {
      schema: {
        "type": "array",
        "items": {
          "$ref": petDefinition
        }
      }
    },
  },
});


app.use('/api-docs', apiDoc.expressHandler());

app.listen(port, () => {
  console.log(`API Docs are live at http://localhost:${port}/api-docs`);
});
