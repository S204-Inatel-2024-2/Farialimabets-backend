import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { FakeStorageProvider } from '@shared/container/providers/StorageProvider/fakes/FakeStorageProvider';
import { CreateFileService } from './CreateFileService';

let fakeFilesRepository: FakeFilesRepository;
let fakeCacheProvider: FakeCacheProvider;
let fakeFoldersRepository: FakeFoldersRepository;
let fakeStorageProvider: FakeStorageProvider;
let createFile: CreateFileService;
let connection: IConnectionDTO;

describe('CreateFileService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeFoldersRepository = new FakeFoldersRepository();
    fakeStorageProvider = new FakeStorageProvider();
    createFile = new CreateFileService(
      fakeFilesRepository,
      fakeFoldersRepository,
      fakeStorageProvider,
      fakeCacheProvider,
      connection,
    );
  });

  it('should be able to create a new file', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({
      name: 'folder',
      slug: 'folder',
    });
    const response = await createFile.execute({
      files: [{ name: 'file', file: 'file' }],
      folder_id: folder.id,
    });

    expect(response.code).toBe(201);
    expect(response.message_code).toBe('CREATED');
    expect(response.message).toBe('File successfully created');
  });

  it('Should not be able to create a file in a non-existing folder', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({
      name: 'folder',
      slug: 'folder',
    });

    jest.spyOn(fakeFoldersRepository, 'findBy').mockResolvedValueOnce(null);

    await expect(
      createFile.execute({
        files: [{ name: 'file', file: 'file' }],
        folder_id: folder.id,
      }),
    ).rejects.toThrow(
      new AppError(
        'CAN_NOT_RESOLVE_RELATION',
        'Could not resolve folder location',
      ),
    );
  });
});
