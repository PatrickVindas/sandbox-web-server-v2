const DEFAULT_BODY_LIMIT = 16 * 1024;
const bodyLimitSetting = Number.parseInt(process.env.HTTP_LOG_BODY_MAX_BYTES, 10);
const bodyLimit = Number.isSafeInteger(bodyLimitSetting) && bodyLimitSetting >= 0
  ? bodyLimitSetting
  : DEFAULT_BODY_LIMIT;
const logBodies = process.env.HTTP_LOG_BODIES !== 'false';

let nextRequestId = 1;
let nextConnectionId = 1;
const connectionIds = new WeakMap();

function log(event) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    pid: process.pid,
    ...event,
  }));
}

function bodyPreview(buffer, contentType) {
  const preview = buffer.subarray(0, bodyLimit);
  const isText = !contentType ||
    /^(text\/|application\/(json|[^;]+\+json|xml|[^;]+\+xml|javascript|x-www-form-urlencoded))/i
      .test(contentType);

  return {
    body: isText ? preview.toString('utf8') : preview.toString('base64'),
    bodyEncoding: isText ? 'utf8' : 'base64',
    bodyBytes: buffer.length,
    bodyTruncated: buffer.length > bodyLimit,
  };
}

function requestBody(req) {
  const rawBody = req.rawBody;
  const rawLength = rawBody ? rawBody.length : 0;

  if (rawLength > bodyLimit) {
    return bodyPreview(rawBody, req.headers['content-type']);
  }
  if (req.body !== undefined) {
    return {
      body: req.body,
      bodyBytes: rawLength,
      bodyTruncated: false,
    };
  }
  if (rawBody && rawBody.length > 0) {
    return bodyPreview(rawBody, req.headers['content-type']);
  }
  return {};
}

function observeResponse(req, res, requestId, startedAt) {
  let responseBytes = 0;
  let capturedBytes = 0;
  const responseChunks = [];

  function capture(chunk, encoding) {
    if (chunk === undefined || chunk === null) return;
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined);
    responseBytes += buffer.length;
    if (!logBodies) return;
    const remaining = bodyLimit - capturedBytes;
    if (remaining > 0) {
      const captured = buffer.subarray(0, remaining);
      responseChunks.push(captured);
      capturedBytes += captured.length;
    }
  }

  const originalWrite = res.write;
  res.write = function (chunk, encoding, callback) {
    capture(chunk, encoding);
    return originalWrite.call(this, chunk, encoding, callback);
  };

  const originalEnd = res.end;
  res.end = function (chunk, encoding, callback) {
    capture(chunk, encoding);
    return originalEnd.call(this, chunk, encoding, callback);
  };

  let completionLogged = false;
  function logCompletion(completed) {
    if (completionLogged) return;
    completionLogged = true;

    const response = {
      event: 'http.response',
      requestId,
      connectionId: connectionIds.get(req.socket),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
      completed,
      responseBytes,
      responseHeaders: res.getHeaders(),
    };

    if (logBodies) {
      const body = Buffer.concat(responseChunks);
      Object.assign(response, bodyPreview(body, res.getHeader('content-type')));
      response.bodyBytes = responseBytes;
      response.bodyTruncated = responseBytes > bodyLimit;
    }

    log(response);
  }

  res.once('finish', () => logCompletion(true));
  res.once('close', () => logCompletion(res.writableFinished));
}

function loggerMiddleware(req, res, next) {
  const requestId = `${process.pid}-${nextRequestId++}`;
  const startedAt = process.hrtime.bigint();
  const event = {
    event: 'http.request',
    requestId,
    connectionId: connectionIds.get(req.socket),
    method: req.method,
    url: req.originalUrl,
    httpVersion: req.httpVersion,
    remoteAddress: req.socket.remoteAddress,
    remotePort: req.socket.remotePort,
    requestHeaders: req.headers,
  };

  if (logBodies) Object.assign(event, requestBody(req));
  log(event);
  observeResponse(req, res, requestId, startedAt);
  next();
}

loggerMiddleware.trackServer = (server) => {
  server.on('connection', (socket) => {
    const connectionId = `${process.pid}-tcp-${nextConnectionId++}`;
    connectionIds.set(socket, connectionId);
    log({
      event: 'tcp.connection',
      connectionId,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      localAddress: socket.localAddress,
      localPort: socket.localPort,
    });

    socket.once('close', (hadError) => {
      log({
        event: 'tcp.close',
        connectionId,
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
        hadError,
      });
    });
  });
};

module.exports = loggerMiddleware;
