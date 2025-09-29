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

  // Positive Tests
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

  it('Should be able to create a new user with email, password, name, and description', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'test2@example.com',
      password: 'password123',
      name: 'Test User 2',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.email).toBe('test2@example.com');
    expect(user.data.name).toBe('Test User 2');
    expect(user.code).toBe(201);
  });

  it('Should be able to create a new user with minimal required fields', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'minimal@example.com',
      password: 'password123',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.email).toBe('minimal@example.com');
    expect(user.code).toBe(201);
  });

  it('Should create a wallet with initial value of 25000', async (): Promise<void> => {
    const createWalletSpy = jest.spyOn(fakeWalletsRepository, 'create');
    const user = await createUserService.execute({
      email: 'wallet@example.com',
      password: 'password123',
      name: 'Wallet User',
    });

    expect(createWalletSpy).toHaveBeenCalledWith({ value: 25000 }, expect.any(Object));
    expect(user.data.wallet).toHaveProperty('id');
    expect(user.data.wallet.value).toBe(25000);
  });

  it('Should invalidate cache after user creation', async (): Promise<void> => {
    const invalidatePrefixSpy = jest.spyOn(fakeCacheProvider, 'invalidatePrefix');
    await createUserService.execute({
      email: 'cache@example.com',
      password: 'password123',
      name: 'Cache User',
    });

    expect(invalidatePrefixSpy).toHaveBeenCalledWith(`${connection.client}:users`);
  });

  it('Should hash the password before saving the user', async (): Promise<void> => {
    const generateHashSpy = jest.spyOn(fakeHashProvider, 'generateHash');
    const user = await createUserService.execute({
      email: 'hash@example.com',
      password: 'password123',
      name: 'Hash User',
    });

    expect(generateHashSpy).toHaveBeenCalledWith('password123');
    expect(user.data.password).not.toBe('password123');
  });

  it('Should create a user with a complex password', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'complex@example.com',
      password: 'Complex@123!#',
      name: 'Complex User',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.email).toBe('complex@example.com');
    expect(user.code).toBe(201);
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

  // Negative Tests
  it('Should fail when email is missing', async (): Promise<void> => {
    await expect(
      createUserService.execute({
        password: 'password123',
        name: 'No Email User',
      })
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email or password are blank', 400)
    );
  });

  it('Should fail when password is missing', async (): Promise<void> => {
    await expect(
      createUserService.execute({
        email: 'no-password@example.com',
        name: 'No Password User',
      } as IUserDTO)
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email or password are blank', 400)
    );
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

  it('Should create a user with optional description field', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'desc@example.com',
      password: 'password123',
      name: 'Desc User',
    });

    expect(user.data).toHaveProperty('description');
  });

  it('Should set created_at when creating a user', async (): Promise<void> => {
    const user = await createUserService.execute({
      email: 'createdat@example.com',
      password: 'password123',
      name: 'Created At User',
    });

    expect(user.data).toHaveProperty('created_at');
    expect(new Date(user.data.created_at).getTime()).not.toBeNaN();
  });

  it('Should fail when usersRepository.exists mock returns true', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'exists').mockResolvedValueOnce(true);

    await expect(
      createUserService.execute({
        email: 'mockexists@example.com',
        password: 'password123',
        name: 'Mock Exists User',
      })
    ).rejects.toEqual(
      new AppError('BAD_REQUEST', 'Email alerady exists', 400)
    );
  });

  it('Should handle error when cacheProvider.invalidatePrefix is mocked to throw', async (): Promise<void> => {
    jest.spyOn(fakeCacheProvider, 'invalidatePrefix').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Mocked cache failure', 500);
    });

    await expect(
      createUserService.execute({
        email: 'mockcache@example.com',
        password: 'password123',
        name: 'Mock Cache User',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should call walletsRepository.create with mocked initial value', async (): Promise<void> => {
    const walletSpy = jest.spyOn(fakeWalletsRepository, 'create');

    await createUserService.execute({
      email: 'mockwallet@example.com',
      password: 'password123',
      name: 'Mock Wallet User',
    });

    expect(walletSpy).toHaveBeenCalledWith(
      expect.objectContaining({ value: 25000 }),
      expect.any(Object)
    );
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
      email: 'mockcreate@example.com',
      password: 'mocked-pass',
      name: 'Mock Create User',
      wallet: { id: 'wallet-123', value: 9999 },
    } as any);

    const user = await createUserService.execute({
      email: 'mockcreate@example.com',
      password: 'password123',
      name: 'Mock Create User',
    });

    expect(user.data.id).toBe('custom-id-123');
    expect(user.data.wallet.value).toBe(9999);
  });
 it('Should throw error when fakeHashProvider.generateHash is mocked to throw', async (): Promise<void> => {
    jest.spyOn(fakeHashProvider, 'generateHash').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Mocked hash error', 500);
    });

    await expect(
      createUserService.execute({
        email: 'mockhasherror@example.com',
        password: 'password123',
        name: 'Mock Hash Error',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should throw error when fakeWalletsRepository.create is mocked to throw', async (): Promise<void> => {
    jest.spyOn(fakeWalletsRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('BAD_REQUEST', 'Mocked wallet error', 500);
    });

    await expect(
      createUserService.execute({
        email: 'mockwalleterror@example.com',
        password: 'password123',
        name: 'Mock Wallet Error',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('Should call invalidatePrefix multiple times when mocked', async (): Promise<void> => {
    const spy = jest.spyOn(fakeCacheProvider, 'invalidatePrefix');
    spy.mockResolvedValue(undefined);


    await createUserService.execute({
      email: 'multiinvalidate@example.com',
      password: 'password123',
      name: 'Multi Invalidate User',
    });

    await createUserService.execute({
      email: 'multiinvalidate2@example.com',
      password: 'password123',
      name: 'Multi Invalidate User 2',
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('Should return custom user ID when usersRepository.create is mocked', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'create').mockResolvedValueOnce({
      id: 'custom-id-mock',
      email: 'customid@example.com',
      password: 'mockedpass',
      name: 'Custom ID User',
      wallet: { id: 'wallet-mock', value: 5000 },
    } as any);

    const user = await createUserService.execute({
      email: 'customid@example.com',
      password: 'password123',
      name: 'Custom ID User',
    });

    expect(user.data.id).toBe('custom-id-mock');
    expect(user.data.wallet.value).toBe(5000);
  });

  it('Should always return false for usersRepository.exists when mocked', async (): Promise<void> => {
    jest.spyOn(fakeUsersRepository, 'exists').mockResolvedValue(true);

    await expect(
      createUserService.execute({
        email: 'mockexists@example.com',
        password: 'password123',
        name: 'Mock Exists User',
      })
    ).rejects.toEqual(new AppError('BAD_REQUEST', 'Email alerady exists', 400));
  });
});