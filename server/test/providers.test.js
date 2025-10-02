const request = require('supertest');

describe('Providers API', () => {
  let server;
  beforeAll(() => {
    const app = require('../index');
    server = app.listen(0);
  });
  afterAll(() => server.close());

  test('create, list, update and delete provider', async () => {
    // create
    const createRes = await request(server).post('/api/providers').send({ nombre: 'Prov1', contacto: 'Juan', email: 'a@b.com', telefono: '123' });
    expect(createRes.statusCode).toBe(201);
    const prov = createRes.body;
    expect(prov.id).toBeDefined();

    // list
    const listRes = await request(server).get('/api/providers');
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    // update
    const upd = await request(server).put(`/api/providers/${prov.id}`).send({ nombre: 'Prov1-Updated' });
    expect(upd.statusCode).toBe(200);
    expect(upd.body.nombre).toBe('Prov1-Updated');

    // delete
    const del = await request(server).delete(`/api/providers/${prov.id}`);
    expect(del.statusCode).toBe(200);
  });
});
