import request from 'supertest';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnectionDTO } from '@shared/typeorm';
import { app } from '@shared/app';
import { v4 as uuid } from 'uuid';
import { seedUser } from '@utils/tests/seedUser';

const id_folder = uuid();
let jwt_token: string | undefined;
let connection: IConnectionDTO;

describe('UpdateFileController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    jwt_token = (
      await seedUser(connection.mysql, {
        permissions: [
          { route: '/files', method: 'create' },
          { route: '/files', method: 'update' },
        ],
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

  it('Should be able to update a file', async (): Promise<void> => {
    const file = Buffer.from('filetest.png', 'binary');
    const newfile = Buffer.from('updatedFile.png', 'binary');

    const postFile = await request(app.server)
      .post('/files')
      .set('Content-Type', 'multipart/form-data; boundary=something')
      .set('Authorization', `Bearer ${jwt_token}`)
      .attach('files', file, 'filetest.png')
      .field('folder_id', id_folder);

    const fieldId: string = postFile.body.data[0].id;

    const response = await request(app.server)
      .put(`/files/${fieldId}`)
      .set('Content-Type', 'multipart/form-data; boundary=something')
      .set('Authorization', `Bearer ${jwt_token}`)
      .attach('files', newfile, 'new name for file')
      .field('folder_id', id_folder);

    expect(response.status).toBe(200);
  });
});
