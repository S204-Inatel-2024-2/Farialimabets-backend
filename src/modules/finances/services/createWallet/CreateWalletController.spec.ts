import request from 'supertest';
import { app } from '@shared/app';

describe('CreateFinanceController', (): void => {
  it('Should be able to create a new finance', async (): Promise<void> => {
    const response = await request(app.server).post('/finances').send({
      name: 'finance',
      description: 'This is a finance',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
