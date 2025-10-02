const request = require('supertest');

describe('API', () => {
  let server;
  let app;
  beforeAll(() => {
    app = require('../index');
    server = app.listen(0);
  });
  afterAll(() => server.close());

  test('GET /api/products returns JSON array', async () => {
    const res = await request(server).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
