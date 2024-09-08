import request from 'supertest';
import { app } from '@shared/app';

describe('CreateUserController', (): void => {
  it('Should be able to create a new user', async (): Promise<void> => {
    const response = await request(app.server).post('/users').send({
      name: 'user',
      description: 'This is a user',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
