import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { FakeUsersRepository } from '@modules/users/repositories/fakes/FakeUsersRepository';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { Connection, IConnection } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { CreateUserService } from './CreateUserService';

let fakeUsersRepository: IUsersRepository;
let fakeCacheProvider: ICacheProvider;
let connection: IConnection;
let createUserService: CreateUserService;

describe('CreateUserService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeUsersRepository = new FakeUsersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    createUserService = new CreateUserService(
      fakeUsersRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to create a new user', async (): Promise<void> => {
    const user = await createUserService.execute({
      name: 'user',
      description: 'This is a user',
    });

    expect(user.data).toHaveProperty('id');
  });

  it('Should return AppError', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_CREATE', 'Failed to create a user');
    });

    await expect(createUserService.execute({})).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
