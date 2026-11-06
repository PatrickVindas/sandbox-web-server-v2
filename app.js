const express = require('express');
const app = express();
app.disable('x-powered-by');

const sandboxRoutes = require('./routes/sandbox');
const loggerMiddleware = require('./middleware/logger');

app.use(express.json({
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.set('etag', false);
app.use(loggerMiddleware);
app.use((req, res, next) => {
  res.removeHeader('Server');
  res.setHeader('Server', 'sandbox-gateway');
  next();
});


app.use('/', sandboxRoutes);

const server = app.listen(3000, () => {
  console.log('Sandbox server listening on port 3000');
});
loggerMiddleware.trackServer(server);
