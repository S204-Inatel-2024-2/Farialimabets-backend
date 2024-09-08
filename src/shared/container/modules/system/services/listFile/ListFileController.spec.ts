import request from 'supertest';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnectionDTO } from '@shared/typeorm';
import { app } from '@shared/app';
import { v4 as uuid } from 'uuid';
import { seedUser } from '@utils/tests/seedUser';

let jwt_token: string | undefined;
const id = uuid();
let connection: IConnectionDTO;

describe('ListFileController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [{ route: '/files', method: 'list' }],
      })
    ).jwt_token;

    await connection.mysql.query(
      'INSERT INTO folders (id, name, slug) VALUES (?, ?, ?);',
      [id, 'folder', 'hidden'],
    );

    return connection.mysql.query(
      'INSERT INTO files (id, name, file, folder_id) VALUES (?, ?, ?, ?);',
      [uuid(), 'file', 'file.png', id],
    );
  });

  afterAll(async (): Promise<void> => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to list files', async (): Promise<void> => {
    const response = await request(app.server)
      .get('/files')
      .set('Authorization', `Bearer ${jwt_token}`);

    expect(response.status).toBe(200);
  });
});
