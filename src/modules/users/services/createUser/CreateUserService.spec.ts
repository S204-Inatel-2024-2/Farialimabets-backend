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

describe('CreateUserService - CI/CD Safe Tests + Mock', (): void => {
beforeAll((): void => {
connection = new Connection('database_test', FakeDataSource);
});

beforeEach((): void => {
jest.clearAllMocks();
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

it('Should be able to create a new user with valid email, password, and name', async (): Promise => {
const invalidateSpy = jest.spyOn(fakeCacheProvider, 'invalidatePrefix');

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
expect(invalidateSpy).toHaveBeenCalledWith('users');


});

it('Should fail when name is missing', async (): Promise => {
await expect(
createUserService.execute({
email: 'noname@example.com',
password: 'password123',
} as IUserDTO)
).rejects.toThrow(AppError);
});

it('Should fail when password is an empty string', async (): Promise => {
await expect(
createUserService.execute({
email: 'nopass@example.com',
password: '',
name: 'No Pass',
})
).rejects.toThrow(AppError);
});

it('Should fail when email is null', async (): Promise => {
await expect(
createUserService.execute({
email: null as any,
password: '123456',
name: 'Null Email',
})
).rejects.toThrow(AppError);
});

// ---------- TESTES DE MOCK ----------
it('Should mock hash provider to return fixed hash', async () => {
jest.spyOn(fakeHashProvider, 'generateHash').mockResolvedValueOnce('MOCK_HASH');
const user = await createUserService.execute({
email: 'mock@example.com',
password: '123456',
name: 'Mock User',
});
expect(user.data.password).toBe('MOCK_HASH');
});

it('Should mock usersRepository.create to return custom object', async () => {
jest.spyOn(fakeUsersRepository, 'create').mockResolvedValueOnce({
id: 'custom-id',
email: 'custom@example.com',
password: 'hashed',
name: 'Custom Mock',
wallet: { value: 500 },
created_at: new Date(),
updated_at: new Date(),
deleted_at: null,
shares: [],
} as any);

const user = await createUserService.execute({
  email: 'custom@example.com',
  password: '123456',
  name: 'Custom Mock',
});

expect(user.data.id).toBe('custom-id');
expect(user.data.wallet.value).toBe(500);


});

it('Should throw error when walletsRepository.create is mocked to fail', async () => {
jest.spyOn(fakeWalletsRepository, 'create').mockImplementationOnce(() => {
throw new AppError('BAD_REQUEST', 'Wallet creation failed', 500);
});

await expect(
  createUserService.execute({
    email: 'walletfail@example.com',
    password: '123456',
    name: 'Wallet Fail',
  })
).rejects.toThrow(AppError);


});

it('Should throw error when cache.invalidatePrefix is mocked to fail', async () => {
jest.spyOn(fakeCacheProvider, 'invalidatePrefix').mockImplementationOnce(() => {
throw new AppError('BAD_REQUEST', 'Cache error', 500);
});

await expect(
  createUserService.execute({
    email: 'cachefail@example.com',
    password: '123456',
    name: 'Cache Fail',
  })
).rejects.toThrow(AppError);


});
});