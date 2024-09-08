import request from 'supertest';
import { app } from '@shared/app';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnectionDTO } from '@shared/typeorm';
import { seedUser } from '@utils/tests/seedUser';
import { v4 as uuid } from 'uuid';

const id = uuid();
let jwt_token: string | undefined;
let connection: IConnectionDTO;

describe('CreateFileController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [{ route: '/files', method: 'create' }],
      })
    ).jwt_token;

    return connection.mysql.query(
      `INSERT INTO folders(id, name, slug) values(?, ?, ?);`,
      [id, 'folder', 'folder'],
    );
  });

  afterAll(async (): Promise<void> => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to create a new file', async (): Promise<void> => {
    const file = Buffer.from('filetest.png', 'binary');
    const response = await request(app.server)
      .post('/files')
      .set('Content-Type', 'multipart/form-data; boundary=something')
      .set('Authorization', `Bearer ${jwt_token}`)
      .attach('files', file, 'filetest.png')
      .field('folder_id', id);

    expect(response.status).toBe(201);
  });
});
