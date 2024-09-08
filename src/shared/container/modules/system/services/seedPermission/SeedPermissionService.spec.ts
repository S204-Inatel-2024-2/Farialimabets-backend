import { FakePermissionsRepository } from '@modules/users/repositories/fakes/FakePermissionsRepository';
import { FakeRolesRepository } from '@modules/users/repositories/fakes/FakeRolesRepository';
import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeUsersRepository } from '@modules/users/repositories/fakes/FakeUsersRepository';
import { AppError } from '@shared/errors/AppError';
import { SeedPermissionService } from './SeedPermissionService';

let fakePermissionsRepository: FakePermissionsRepository;
let fakeUsersRepository: FakeUsersRepository;
let fakeRolesRepository: FakeRolesRepository;
let fakeCacheProvider: FakeCacheProvider;
let seedPermission: SeedPermissionService;
let connection: IConnectionDTO;

describe('SeedPermissionService', () => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach(() => {
    fakePermissionsRepository = new FakePermissionsRepository();
    fakeUsersRepository = new FakeUsersRepository();
    fakeRolesRepository = new FakeRolesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    seedPermission = new SeedPermissionService(
      fakePermissionsRepository,
      fakeRolesRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to seed permissions', async () => {
    await fakePermissionsRepository.createMany([
      {
        name: 'permission 1',
        method: 'create',
        route: '/permissions',
        slug: 'permission-1',
      },
      {
        name: 'permission 2',
        method: 'delete',
        route: '/permissions/:id',
        slug: 'permission-2',
      },
      {
        name: 'permission 3',
        method: 'list',
        route: '/permissions',
        slug: 'permission-3',
      },
      {
        name: 'permission 4',
        method: 'patch',
        route: '/permissions/:id',
        slug: 'permission-4',
      },
      {
        name: 'permission 5',
        method: 'show',
        route: '/permissions/:id',
        slug: 'permission-5',
      },
      {
        name: 'permission 6',
        method: 'update',
        route: '/permissions/:id',
        slug: 'permission-6',
      },
    ]);

    const users = await fakeUsersRepository.createMany([
      {
        email: 'user1@mail.com',
      },
      {
        email: 'user2@mail.com',
      },
      {
        email: 'user3@mail.com',
      },
    ]);

    await fakeRolesRepository.create({
      name: 'admin',
      description: 'This is the admin role',
      slug: 'administrador-desenvolvedor',
      users,
    });

    const permissions = await seedPermission.execute();

    expect(permissions.code).toBe(201);
  });

  it('Should not be able to seed permissions without admin role', async () => {
    await expect(seedPermission.execute()).rejects.toBeInstanceOf(AppError);
  });
});
