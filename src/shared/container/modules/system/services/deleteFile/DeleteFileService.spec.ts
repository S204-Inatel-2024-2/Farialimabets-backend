import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { AppError } from '@shared/errors/AppError';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeStorageProvider } from '@shared/container/providers/StorageProvider/fakes/FakeStorageProvider';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { DeleteFileService } from './DeleteFileService';

let fakeFilesRepository: FakeFilesRepository;
let fakeCacheProvider: FakeCacheProvider;
let fakeStoreageProvider: FakeStorageProvider;
let fakeFoldersRepository: FakeFoldersRepository;
let deleteFile: DeleteFileService;
let connection: IConnectionDTO;

describe('DeleteFileService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeStoreageProvider = new FakeStorageProvider();
    fakeFoldersRepository = new FakeFoldersRepository();
    deleteFile = new DeleteFileService(
      fakeFilesRepository,
      fakeStoreageProvider,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to delete a file', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({ name: 'folder' });
    const file = await fakeFilesRepository.create({
      name: 'file',
      file: 'file',
      folder_id: folder.id,
    });

    await deleteFile.execute(file.id);

    const deletedFile = await fakeFilesRepository.findBy({
      where: {
        id: file.id,
      },
    });

    expect(deletedFile).toBe(null);
  });

  it('Should not be able to delete a file that does not exist', async (): Promise<void> => {
    await expect(deleteFile.execute('non-existing-file')).rejects.toThrow(
      new AppError('NOT_FOUND', 'File not found'),
    );
  });
});
