import request from 'supertest';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnection } from '@shared/typeorm';
import { app } from '@shared/app';
import { v4 as uuid } from 'uuid';

const id = uuid();
let connection: IConnection;

describe('ShowUserController', (): void => {
  beforeAll(async (): Promise<void> => {
    connection = {
      client: 'database_test',
      mysql: await MysqlDataSource('database_test').initialize(),
    };
    await connection.mysql.runMigrations();

    return connection.mysql.query(
      'INSERT INTO users (id, name, description) VALUES (?, ?, ?);',
      [id, 'user', 'This is a user'],
    );
  });

  afterAll(async (): Promise<void> => {
    await connection.mysql.dropDatabase();
    return connection.mysql.destroy();
  });

  it('Should be able to show a user', async (): Promise<void> => {
    const response = await request(app.server).get(`/users/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
  });
});
