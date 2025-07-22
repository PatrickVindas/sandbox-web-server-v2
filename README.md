# Sandbox Web Server v2

A simple Express-based API server for simulating HTTP responses. Useful for testing, mocking, or learning HTTP interactions.

## API Usage

All endpoints are available at the root (`/`) and accept the following HTTP methods:
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `PATCH`

### Route Pattern

```
/:action?
```

- `action` is an optional path parameter that determines the type of response.

---

### Predefined Actions

Send a request to `/{action}` to receive a simulated response.  
Example: `GET /success`

| Action                   | Status | Response Body                      | Headers (if any)           |
|--------------------------|--------|------------------------------------|----------------------------|
| `success`                | 200    | `{ "message": "Success" }`         |                            |
| `redirect`               | 302    | _No body_                          | `Location: https://www.example.com` |
| `forbidden`              | 403    | `{ "message": "Forbidden" }`       |                            |
| `unauthorized`           | 401    | `{ "message": "Unauthorized" }`    |                            |
| `badRequest`             | 400    | `{ "message": "Bad Request" }`     |                            |
| `notFound`               | 404    | `{ "message": "Not Found" }`       |                            |
| `internalServerError`    | 500    | `{ "message": "Internal Server Error" }` |                   |
| `internalServerErrorNoCache` | 500 | `{ "message": "Internal Server Error No Cache" }` |         |
| _(any other)_            | 501    | `{ "message": "Not Implemented" }` |                            |

---

### Custom Responses

You can customize the response using query parameters or request body fields:

#### Supported Customization Parameters

- `status`: HTTP status code (number)
- `header`: Custom headers (comma-separated, e.g. `X-Foo:bar,X-Bar:baz`)
- `body`: Custom response body (string or `"echo"` to echo the request body and query)

#### Example: Custom Status and Header

```
GET /custom?status=101&header=upgrade
```

_Response:_
```
< HTTP/1.1 101 Switching Protocols
< X-Powered-By: Express
< upgrade: websocket
< Date: Tue, 22 Jul 2025 06:13:07 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
```


#### Example: 302 redirect and location header

```
GET /custom?status=302&header=location:/success
```

_Response:_
```
< HTTP/1.1 302 Found
< X-Powered-By: Express
< location: /success
< Date: Tue, 22 Jul 2025 06:27:38 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 0
```

#### Example: Response body

```
GET /ping?status=200&body=pong
```

_Response:_
```
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: text/html; charset=utf-8
< Content-Length: 4
< Date: Tue, 22 Jul 2025 06:31:40 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5

pong
```

---

## Logging

All requests and responses are logged to the console, including headers and bodies.

---
