class CustomResponse {
  constructor(status = 501, body = null, headers = {}) {
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

class SimulatedResponse {
  static buildFromAction(action) {
    switch (action) {
      case 'success': return new CustomResponse(200, { message: 'Success' });
      case 'redirect': return new CustomResponse(302, null, { Location: 'https://www.example.com' });
      case 'forbidden': return new CustomResponse(403, { message: 'Forbidden' });
      case 'unauthorized': return new CustomResponse(401, { message: 'Unauthorized' });
      case 'badRequest': return new CustomResponse(400, { message: 'Bad Request' });
      case 'notFound': return new CustomResponse(404, { message: 'Not Found' });
      case 'internalServerError': return new CustomResponse(500, { message: 'Internal Server Error' });
      case 'internalServerErrorNoCache': return new CustomResponse(500, { message: 'Internal Server Error No Cache' });
      default: return new CustomResponse(501, { message: 'Not Implemented' });
    }
  }

  static buildCustom({ customQuery, body }) {
    const status = parseInt(customQuery.status || body?.status || 200, 10);
    const responseHeaders = {};

    const headerStr = customQuery.header || body?.header;
    if (headerStr) {
      const pairs = headerStr.split(',').map(h => h.trim().split(':'));
      for (let [key, value] of pairs) {
        if (value === undefined) {
          value = 'true';
        }
        responseHeaders[key.trim()] = value.trim();
      }
    }

    let responseBody = null;
    const bodyOption = customQuery.body || body?.body;

    if (bodyOption === 'echo') {
      responseBody = {
        echo: body,
        headers: customQuery,
      };
    }
    else responseBody = bodyOption;

    return new CustomResponse(status, responseBody, responseHeaders);
  }
}

function buildResponse({ action, customQuery, body }) {
  if (customQuery.status || customQuery.header || customQuery.body ||
      body?.status || body?.header || body?.body) {
    return SimulatedResponse.buildCustom({ customQuery, body });
  }

  return SimulatedResponse.buildFromAction(action);
}

module.exports = buildResponse;
