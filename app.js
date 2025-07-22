const express = require('express');
const app = express();
const sandboxRoutes = require('./routes/sandbox');
const loggerMiddleware = require('./middleware/logger');

app.use(express.json()); // for parsing JSON bodies
app.set('etag', false);
app.use(loggerMiddleware);

app.use('/', sandboxRoutes);

app.listen(3000, () => {
  console.log('Sandbox server listening on port 3000');
});
