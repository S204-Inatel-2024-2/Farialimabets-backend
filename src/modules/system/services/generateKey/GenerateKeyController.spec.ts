import request from 'supertest';
import { app } from '@shared/app';
import { seedUser } from '@utils/tests/seedUser';
import { IConnectionDTO } from '@shared/typeorm';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';

let jwt_token: string | undefined;
let connection: IConnectionDTO;

describe('GenerateKeyController', (): void => {
  beforeAll(async () => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [{ route: '/generate-keys', method: 'create' }],
      })
    ).jwt_token;
  });

  afterAll(async () => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to generate a key', async (): Promise<void> => {
    const response = await request(app.server)
      .get('/generate-keys')
      .set('Authorization', `Bearer ${jwt_token}`);

    expect(response.status).toBe(201);
  });
});
