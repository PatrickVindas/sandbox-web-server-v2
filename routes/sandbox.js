const express = require('express');
const router = express.Router();
const buildResponse = require('../utils/responseBuilder');

const supportedMethods = ['get', 'post', 'put', 'delete', 'patch'];

supportedMethods.forEach(method => {
  router[method]('/:action', (req, res) => {
    const action = req.params.action || 'default';
    const customQuery = req.query;
    const body = req.body;

    const response = buildResponse({ action, customQuery, body });

    res.status(response.status);

    if (response.headers) {
      res.set(response.headers);
    }

    if (response.body !== null && response.body !== undefined) {
      res.send(response.body);
    } else {
      res.end();
    }
  });
});

module.exports = router;
