const request = require('supertest');

describe('Stock operations', () => {
  let server;
  beforeAll(() => {
    const app = require('../index');
    server = app.listen(0);
  });
  afterAll(() => server.close());

  test('put product to set cantidad 0', async () => {
    // create product
    const create = await request(server).post('/api/products').send({ nombre: 'TestProd', cantidad: 5 });
    expect(create.statusCode).toBe(201);
    const prod = create.body;

    // set cantidad to 0
    const upd = await request(server).put(`/api/products/${prod.id}`).send({ cantidad: 0 });
    expect(upd.statusCode).toBe(200);
    expect(upd.body.cantidad).toBe(0);

    // fetch and confirm
    const get = await request(server).get(`/api/products/${prod.id}`);
    expect(get.statusCode).toBe(200);
    expect(get.body.cantidad).toBe(0);
  });
});
