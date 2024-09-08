import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { AppError } from '@shared/errors/AppError';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeStorageProvider } from '@shared/container/providers/StorageProvider/fakes/FakeStorageProvider';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { DeleteFolderService } from './DeleteFolderService';

let fakeFoldersRepository: FakeFoldersRepository;
let fakeStorageProvider: FakeStorageProvider;
let fakeCacheProvider: FakeCacheProvider;
let fakeFilesRepository: FakeFilesRepository;
let deleteFolder: DeleteFolderService;
let connection: IConnectionDTO;

describe('DeleteFolderService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFoldersRepository = new FakeFoldersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeStorageProvider = new FakeStorageProvider();
    fakeFilesRepository = new FakeFilesRepository();
    deleteFolder = new DeleteFolderService(
      fakeFoldersRepository,
      fakeStorageProvider,
      fakeCacheProvider,
      connection,
    );
  });

  it('should be able to delete a folder', async (): Promise<void> => {
    const file = await fakeFilesRepository.create({
      name: 'file',
      file: 'file',
    });

    const folder = await fakeFoldersRepository.create({
      name: 'folder',
      files: [file],
    });

    await deleteFolder.execute(folder.id);

    const deletedFolder = await fakeFoldersRepository.findBy({
      where: {
        id: folder.id,
      },
    });

    expect(deletedFolder).toBe(null);
  });

  it('Should not be able to delete a folder that does not exist', async (): Promise<void> => {
    await expect(deleteFolder.execute('non-existing-file')).rejects.toThrow(
      new AppError('NOT_FOUND', 'Folder not found'),
    );
  });
});
