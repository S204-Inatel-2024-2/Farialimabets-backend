import request from 'supertest';
import { app } from '@shared/app';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnectionDTO } from '@shared/typeorm';
import { seedUser } from '@utils/tests/seedUser';

let jwt_token: string | undefined;
let connection: IConnectionDTO;

describe('CreateFolderController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [{ route: '/folders', method: 'create' }],
      })
    ).jwt_token;
  });

  afterAll(async (): Promise<void> => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to create a new folder', async (): Promise<void> => {
    const response = await request(app.server)
      .post('/folders')
      .set('Authorization', `Bearer ${jwt_token}`)
      .send({
        name: 'folder',
      });

    expect(response.status).toBe(201);
  });
});
