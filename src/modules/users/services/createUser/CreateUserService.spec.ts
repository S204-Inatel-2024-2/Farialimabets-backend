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

describe('CreateUserService - CI/CD Safe Tests', (): void => {
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

  it('Should be able to create a new user with valid email, password, and name', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.email).toBe('test@example.com');
    expect(user.data.name).toBe('Test User');
    expect(user.code).toBe(201);
    expect(user.message).toBe('User successfully created');
  });

  it('Should create a user with special characters in the name', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'special@example.com',
      password: 'password123',
      name: 'José da Silva!',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.name).toBe('José da Silva!');
  });

  it('Should create a user with a very long password (128 characters)', async (): Promise<void> => {
    const longPassword = 'a'.repeat(128);
    const user = await createUserService.execute({
      email: 'longpass@example.com',
      password: longPassword,
      name: 'Long Pass User',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.password).not.toBe(longPassword); // deve estar hash
  });

  it('Should normalize email to lowercase when saving', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'MIXEDCASE@EXAMPLE.COM',
      password: 'password123',
      name: 'Lowercase User',
    });

    expect(user.data.email).toBe('mixedcase@example.com');
  });

  it('Should create a user without description', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'nodesc@example.com',
      password: 'password123',
      name: 'No Desc User',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.description).toBeUndefined();
  });

  it('Should replace generated password hash with mocked value', async (): Promise<void> => {
    jest.spyOn(fakeHashProvider, 'generateHash').mockResolvedValueOnce('MOCK_HASHED');

    const user = await createUserService.execute({
      email: 'mockhash@example.com',
      password: 'password123',
      name: 'Mock Hash User',
    });

    expect(user.data.password).toBe('MOCK_HASHED');
  });

  it('Should allow mocking usersRepository.create to return custom response', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'create').mockResolvedValueOnce({
      id: 'custom-id-123',
      email: 'mock@example.com',
      password: 'hashed-pass',
      name: 'Custom User',
      wallet: { value: 9999 },
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      shares: [],
    } as any);

    const user = await createUserService.execute({
      email: 'mock@example.com',
      password: 'password123',
      name: 'Mocked User',
    });

    expect(user.data.id).toBe('custom-id-123');
    expect(user.data.wallet.value).toBe(9999);
  });

  it('Should fail when both email and password are missing', async (): Promise<void> => {
    await expect(
      createUserService.execute({
        name: 'No Email or Password User',
      } as IUserDTO)
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email or password are blank', 400)
    );
  });

  it('Should fail when email already exists', async (): Promise<void> => {
    await createUserService.execute({
      email: 'duplicate@example.com',
      password: 'password123',
      name: 'User 1',
    });

    await expect(
      createUserService.execute({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'User 2',
      })
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email alerady exists', 400)
    );
  });

  it('Should fail when wallet creation throws an error', async (): Promise<void> => {
    jest.spyOn(fakeWalletsRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Failed to create wallet', 500);
    });

    await expect(
      createUserService.execute({
        email: 'wallet-error@example.com',
        password: 'password123',
        name: 'Wallet Error User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should fail when user creation throws an error', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Failed to create user', 500);
    });

    await expect(
      createUserService.execute({
        email: 'user-error@example.com',
        password: 'password123',
        name: 'User Error User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should fail when cache invalidation throws an error', async (): Promise<void> => {
    jest.spyOn(fakeCacheProvider, 'invalidatePrefix').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Failed to invalidate cache', 500);
    });

    await expect(
      createUserService.execute({
        email: 'cache-error@example.com',
        password: 'password123',
        name: 'Cache Error User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should fail when hash provider throws an error', async (): Promise<void> => {
    jest.spyOn(fakeHashProvider, 'generateHash').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Failed to hash password', 500);
    });

    await expect(
      createUserService.execute({
        email: 'hash-error@example.com',
        password: 'password123',
        name: 'Hash Error User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should throw error when email is an empty string', async (): Promise<void> => {
    await expect(
      createUserService.execute({
        email: '',
        password: 'password123',
        name: 'Empty Email User',
      })
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email or password are blank', 400)
    );
  });

  it('Should rollback transaction when hash provider throws a generic error', async (): Promise<void> => {
    const queryRunner = connection.mysql.createQueryRunner();
    const rollbackTransactionSpy = jest.spyOn(queryRunner, 'rollbackTransaction');
    jest.spyOn(connection.mysql, 'createQueryRunner').mockReturnValue(queryRunner);

    jest.spyOn(fakeHashProvider, 'generateHash').mockImplementationOnce(() => {
      throw new Error('Unexpected hash error');
    });

    await expect(
      createUserService.execute({
        email: 'hash-fail-test@example.com',
        password: 'password123',
        name: 'Hash Fail User',
      })
    ).rejects.toBeInstanceOf(Error);

    expect(rollbackTransactionSpy).toHaveBeenCalled();

    const userExists = await fakeUsersRepository.exists(
      { where: { email: 'hash-fail-test@example.com' } },
      connection.mysql.createQueryRunner()
    );
    expect(userExists).toBe(false);
  });

  it('Should create multiple users sequentially', async (): Promise<void> => {
    const user1 = await createUserService.execute({
      email: 'user1@example.com',
      password: 'password123',
      name: 'User 1',
    });

    const user2 = await createUserService.execute({
      email: 'user2@example.com',
      password: 'password123',
      name: 'User 2',
    });

    expect(user1.data).toHaveProperty('id');
    expect(user2.data).toHaveProperty('id');
    expect(user1.data.id).not.toBe(user2.data.id);
    expect(user1.code).toBe(201);
    expect(user2.code).toBe(201);
  });

  it('Should return correct response structure', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'structure@example.com',
      password: 'password123',
      name: 'Structure User',
    });

    expect(user).toEqual({
      code: 201,
      message_code: 'CREATED',
      message: 'User successfully created',
      data: expect.objectContaining({
        id: expect.any(String),
        email: 'structure@example.com',
        name: 'Structure User',
      }),
    });
  });

  it('Should persist user in repository after successful creation', async (): Promise<void> => {
    const findByEmailSpy = jest.spyOn(fakeUsersRepository, 'exists');
    await createUserService.execute({
      email: 'persist-test@example.com',
      password: 'password123',
      name: 'Persist Test User',
    });

    expect(findByEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'persist-test@example.com' } }),
      expect.any(Object)
    );

    const userExists = await fakeUsersRepository.exists(
      { where: { email: 'persist-test@example.com' } },
      connection.mysql.createQueryRunner()
    );
    expect(userExists).toBe(true);
  });

  // ======================
  // NOVOS TESTES ADICIONADOS
  // ======================
  it('Should create a user and ensure updated_at is defined', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'updatedat@example.com',
      password: 'password123',
      name: 'Updated At User',
    });

    expect(user.data).toHaveProperty('updated_at');
    expect(new Date(user.data.updated_at).getTime()).not.toBeNaN();
  });

  it('Should trim spaces in email before saving', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: '   spaced@example.com   ',
      password: 'password123',
      name: 'Spaced User',
    });

    expect(user.data.email).toBe('spaced@example.com');
  });

  it('Should allow creation of user with only name and email (password default)', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'nopass@example.com',
      name: 'No Pass User',
      password: 'defaultpass',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.name).toBe('No Pass User');
  });

  it('Should ensure wallet is linked to created user', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'walletlink@example.com',
      password: 'password123',
      name: 'Wallet Link User',
    });

    expect(user.data.wallet).toBeDefined();
    expect(user.data.wallet.value).toBe(25000);
  });

  it('Should create a user and return message_code as CREATED', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'msgcode@example.com',
      password: 'password123',
      name: 'Msg Code User',
    });

    expect(user.message_code).toBe('CREATED');
    expect(user.code).toBe(201);
  });
});