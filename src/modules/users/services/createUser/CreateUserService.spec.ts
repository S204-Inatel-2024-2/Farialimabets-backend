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

jest.setTimeout(20000); 

let fakeUsersRepository: IUsersRepository;
let fakeCacheProvider: ICacheProvider;
let fakeWalletsRepository: IWalletsRepository;
let fakeHashProvider: IHashProviderDTO;
let connection: IConnection;
let createUserService: CreateUserService;

describe('CreateUserService - CI/CD Safe Tests', () => {
  beforeAll(() => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach(() => {
    fakeUsersRepository = new FakeUsersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeWalletsRepository = new FakeWalletsRepository();
    fakeHashProvider = new FakeHashProvider();
    createUserService = new CreateUserService(
      fakeUsersRepository,
      fakeCacheProvider,
      fakeWalletsRepository,
      connection,
      fakeHashProvider
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });


  it('Should create a user with special characters in the name', async () => {
    const user = await createUserService.execute({
      email: 'special@example.com',
      password: 'password123',
      name: 'José da Silva!',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.name).toBe('José da Silva!');
  });

  it('Should create a user with a very long password (128 characters)', async () => {
    const longPassword = 'a'.repeat(128);
    const user = await createUserService.execute({
      email: 'longpass@example.com',
      password: longPassword,
      name: 'Long Pass User',
    });

    expect(user.data).toHaveProperty('id');
    expect(user.data.password).not.toBe(longPassword);
  });

  it('Should normalize email to lowercase when saving', async () => {
    const user = await createUserService.execute({
      email: 'MIXEDCASE@EXAMPLE.COM',
      password: 'password123',
      name: 'Lowercase User',
    });

    expect(user.data.email).toBe('mixedcase@example.com');
  });

  it('Should create a user without description', async () => {
    const user = await createUserService.execute({
      email: 'desc@example.com',
      password: 'password123',
      name: 'Desc User',
    });

    expect(user.data).toHaveProperty('name');
    expect(user.data.name).toBe('Desc User');
  });

  it('Should set created_at when creating a user', async () => {
    const user = await createUserService.execute({
      email: 'createdat@example.com',
      password: 'password123',
      name: 'Created At User',
    });

    expect(user.data).toHaveProperty('created_at');
    expect(new Date(user.data.created_at).getTime()).not.toBeNaN();
  });

  it('Should fail when usersRepository.exists mock returns true', async () => {
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

  it('Should handle error when cacheProvider.invalidatePrefix is mocked to throw', async () => {
    jest.spyOn(fakeCacheProvider, 'invalidatePrefix').mockImplementationOnce(async () => {
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

  it('Should call walletsRepository.create with mocked initial value', async () => {
    const walletSpy = jest.spyOn(fakeWalletsRepository, 'create').mockResolvedValue({ id: 'mock-wallet', value: 25000 } as any);

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

  it('Should replace generated password hash with mocked value', async () => {
    jest.spyOn(fakeHashProvider, 'generateHash').mockResolvedValueOnce('MOCK_HASHED');

    const user = await createUserService.execute({
      email: 'mockhash@example.com',
      password: 'password123',
      name: 'Mock Hash User',
    });

    expect(user.data.password).toBe('MOCK_HASHED');
  });

  it('Should allow mocking usersRepository.create to return custom response', async () => {
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
});
