import request from 'supertest';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnectionDTO } from '@shared/typeorm';
import { app } from '@shared/app';
import { v4 as uuid } from 'uuid';
import { seedUser } from '@utils/tests/seedUser';

const id_folder = uuid();
let jwt_token: string | undefined;
let connection: IConnectionDTO;

describe('ShowFolderController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [{ route: '/folders', method: 'show' }],
      })
    ).jwt_token;

    return connection.mysql.query(
      'INSERT INTO folders (id, name, slug) VALUES (?, ?, ?);',
      [id_folder, 'folder', 'hidden'],
    );
  });

  afterAll(async (): Promise<void> => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to show a folder', async (): Promise<void> => {
    const response = await request(app.server)
      .get(`/folders/${id_folder}`)
      .set('Authorization', `Bearer ${jwt_token}`);

    expect(response.status).toBe(200);
  });
});
