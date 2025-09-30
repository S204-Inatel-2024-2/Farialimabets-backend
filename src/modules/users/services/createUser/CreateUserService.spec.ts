
import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { FakeUsersRepository } from '@modules/users/repositories/fakes/FakeUsersRepository';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { Connection, IConnection } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { CreateUserService } from './CreateUserService';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';
import { FakeWalletsRepository } from '@modules/finances/repositories/fakes/FakeWalletsRepository';
import { FakeHashProvider } from '@shared/container/providers/HashProvider/fakes/FakeHashProvider';
import { IHashProviderDTO } from '@shared/container/providers/HashProvider/models/IHashProvider';
import { IUserDTO } from '@modules/users/dtos/IUserDTO';

let fakeUsersRepository: IUsersRepository;
let fakeCacheProvider: ICacheProvider;
let fakeWalletsRepository: IWalletsRepository;
let fakeHashProvider: IHashProviderDTO;
let connection: IConnection;
let createUserService: CreateUserService;

describe('CreateUserService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeUsersRepository = new FakeUsersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeWalletsRepository = new FakeWalletsRepository();
    fakeHashProvider = new FakeHashProvider();
    createUserService = new CreateUserService(
      fakeUsersRepository,
      fakeCacheProvider,
      fakeWalletsRepository,
      connection,
      fakeHashProvider,
    );
  });


  it('Should create user and ensure password length is at least 8 characters', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'length@example.com',
      password: 'longenough123',
      name: 'Length User',
    });

    expect(user.data.password.length).toBeGreaterThanOrEqual(8);
  });

  it('Should trim whitespace from email before saving', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: '   spaced@example.com   ',
      password: 'password123',
      name: 'Spaced User',
    });

    expect(user.data.email).toBe('spaced@example.com');
  });

  it('Should create user with default role as "user"', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'role@example.com',
      password: 'password123',
      name: 'Role User',
    });

    expect(user.data.role).toBe('user');
  });

  it('Should throw an error when password is shorter than 6 characters', async (): Promise<void> => {
    await expect(
      createUserService.execute({
        email: 'shortpass@example.com',
        password: '123',
        name: 'Short Pass User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should create user and ensure updated_at is initially null', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'updated@example.com',
      password: 'password123',
      name: 'Updated User',
    });

    expect(user.data.updated_at).toBeNull();
  });


  it('Should call usersRepository.create exactly once', async (): Promise<void> => {
    const createSpy = jest.spyOn(fakeUsersRepository, 'create');
    await createUserService.execute({
      email: 'onespy@example.com',
      password: 'password123',
      name: 'One Spy User',
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('Should mock hash provider to throw and check rollback was triggered', async (): Promise<void> => {
    const queryRunner = connection.mysql.createQueryRunner();
    const rollbackSpy = jest.spyOn(queryRunner, 'rollbackTransaction');
    jest.spyOn(connection.mysql, 'createQueryRunner').mockReturnValue(queryRunner);

    jest.spyOn(fakeHashProvider, 'generateHash').mockImplementationOnce(() => {
      throw new Error('Forced error');
    });

    await expect(
      createUserService.execute({
        email: 'forcedhash@example.com',
        password: 'password123',
        name: 'Forced Hash User',
      })
    ).rejects.toThrow('Forced error');

    expect(rollbackSpy).toHaveBeenCalled();
  });

  it('Should mock walletsRepository.create to return a custom wallet value', async (): Promise<void> => {
    jest.spyOn(fakeWalletsRepository, 'create').mockResolvedValueOnce({
      id: 'wallet-mock-999',
      value: 12345,
    } as any);

    const user = await createUserService.execute({
      email: 'walletmock@example.com',
      password: 'password123',
      name: 'Wallet Mock User',
    });

    expect(user.data.wallet.value).toBe(12345);
  });

  it('Should mock cacheProvider.invalidatePrefix to confirm it is called once', async (): Promise<void> => {
    const invalidateSpy = jest.spyOn(fakeCacheProvider, 'invalidatePrefix');
    await createUserService.execute({
      email: 'cachecalled@example.com',
      password: 'password123',
      name: 'Cache Called User',
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it('Should mock usersRepository.exists to simulate duplicate email detection', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'exists').mockResolvedValueOnce(true);

    await expect(
      createUserService.execute({
        email: 'dupmock@example.com',
        password: 'password123',
        name: 'Dup Mock User',
      })
    ).rejects.toEqual(new AppError('BAD_REQUEST', 'Email alerady exists', 400));
  });
});
```
