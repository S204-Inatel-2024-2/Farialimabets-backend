import request from 'supertest';
import { MysqlDataSource } from '@shared/typeorm/dataSources/mysqlDataSource';
import { IConnection } from '@shared/typeorm';
import { app } from '@shared/app';
import { v4 as uuid } from 'uuid';

const id = uuid();
let connection: IConnection;

describe('UpdateUserController', (): void => {
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

  it('Should be able to update a user', async (): Promise<void> => {
    const response = await request(app.server).put(`/users/${id}`).send({
      name: 'updatedUser',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toEqual('updatedUser');
  });
});
