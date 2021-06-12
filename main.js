const http = require('http');
const PORT = process.env.PORT || 3000;
const userHandlers  = require('./handlers/userHandlers.js');
const itemHandlers  = require('./handlers/itemHandlers.js');
const tokenHandlers = require('./handlers/tokenHandlers.js');
const cartHandlers  = require('./handlers/cartHandlers.js');
const orderHandlers = require('./handlers/orderHandlers.js');
const { receiveArgs } = require('./lib/utils.js');

const parseQueryParams = ({ url, headers }) => {
  const { host } = headers;
  const urlObj = new URL(`http://${host}${url}`);
  const queryParams = {};
  const endpoint = urlObj.pathname;
  if (urlObj.search === '') return { queryParams, endpoint };
  const searchParams = urlObj.searchParams.entries();
  for (const [key, value] of searchParams) {
    queryParams[key] = value;
  }
  return { queryParams, endpoint };
};

const routing = {
  '/': {
    get: async () => 'Welcome to the main page!',
  },
  '/users': {
    get:    userHandlers._get,
    post:   userHandlers._post,
    put:    userHandlers._put,
    delete: userHandlers._delete,
  },
  '/tokens': {
    get:    tokenHandlers._get,
    post:   tokenHandlers._post,
    put:    tokenHandlers._put,
    delete: tokenHandlers._delete,
  },
  '/items': {
    get:    itemHandlers._get,
    post:   itemHandlers._post,
    put:    itemHandlers._put,
    delete: itemHandlers._delete,
  },
  '/cart': {
    get:    cartHandlers._get,
    post:   cartHandlers._post,
    put:    cartHandlers._put,
    delete: cartHandlers._delete,
  },
  '/orders': {
    get:    orderHandlers._get,
    post:   orderHandlers._post,
    delete: orderHandlers._delete,
  },  
};

const notFound = (res) => {
  res.writeHead(404, 'Not Found', {'Content-Type' : 'text/plain'});
  res.end('Not Found');
}

const listener = async (req, res) => {
  const { method } = req;
  const { token } = req.headers;
  const { queryParams, endpoint } = parseQueryParams(req);
  let body = null;
  const route = routing[endpoint];
  if (!route) return notFound(res);
  const handler = route[method.toLowerCase()];
  if (!handler) return notFound(res);
  const bodyRequired = handler.toString().startsWith('async ({ body');
  if (bodyRequired) body = await receiveArgs(req);
  const { result, statusCode } = await handler({ body, queryParams, token });
  res.writeHead(statusCode, {'Content-Type' : 'application/json'});
  res.end(JSON.stringify({ result, body }));
};

http
  .createServer(listener)
  .listen(PORT, () => {
    console.log(`Server started on ${PORT}!`);
  });