import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { AppError } from '@shared/errors/AppError';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeStorageProvider } from '@shared/container/providers/StorageProvider/fakes/FakeStorageProvider';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { UpdateFileService } from './UpdateFileService';

let fakeFilesRepository: FakeFilesRepository;
let fakeCacheProvider: FakeCacheProvider;
let fakeFoldersRepository: FakeFoldersRepository;
let fakeStorageProvider: FakeStorageProvider;
let updateFileService: UpdateFileService;
let connection: IConnectionDTO;

describe('UpdateFileService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeStorageProvider = new FakeStorageProvider();
    fakeFoldersRepository = new FakeFoldersRepository();
    updateFileService = new UpdateFileService(
      fakeFilesRepository,
      fakeFoldersRepository,
      fakeStorageProvider,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to update a file', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({ name: 'folder' });
    const file = await fakeFilesRepository.create({
      name: 'file',
      folder,
      file: 'file.png',
      folder_id: folder.id,
    });

    const updatedFile = await updateFileService.execute(
      { ...file, name: 'updatedFile' },
      file.id,
    );

    expect(updatedFile.data.name).toEqual('updatedFile');
  });

  it('Should not be able to update a file with no folder', async (): Promise<void> => {
    const file = await fakeFilesRepository.create({
      name: 'file',
      folder_id: undefined,
    });

    await expect(
      updateFileService.execute({ ...file, name: 'updatedFile' }, file.id),
    ).rejects.toThrow(
      new AppError('NOT_FOUND', 'Could not resolve folder location'),
    );
  });

  it('Should not be able to update a file if not exists', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({ name: 'folder' });
    const file = await fakeFilesRepository.create({
      name: 'file',
      folder,
      folder_id: folder.id,
    });

    jest.spyOn(fakeFilesRepository, 'findBy').mockResolvedValueOnce(null);

    await expect(
      updateFileService.execute({ ...file, name: 'updatedFile' }, file.id),
    ).rejects.toThrow(new AppError('NOT_FOUND', 'File not found'));
  });
});
