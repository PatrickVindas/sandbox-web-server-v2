module.exports = (req, res, next) => {
  console.log(`--> ${req.method} ${req.originalUrl}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

  const originalSend = res.send;

  res.send = function (body) {
    console.log('<-- Response Status:', res.statusCode);
    console.log('Response Headers:', res.getHeaders());
    console.log('Response Body:', body);
    return originalSend.call(this, body);
  };

  next();
};
