import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { AppError } from '@shared/errors/AppError';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { UpdateFolderService } from './UpdateFolderService';

let fakeFoldersRepository: FakeFoldersRepository;
let fakeCacheProvider: FakeCacheProvider;
let updateFolderService: UpdateFolderService;
let connection: IConnectionDTO;

describe('UpdateFolderService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFoldersRepository = new FakeFoldersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    updateFolderService = new UpdateFolderService(
      fakeFoldersRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to update a folder', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({
      name: 'folder',
    });

    const updatedFolder = await updateFolderService.execute(
      { ...folder, name: 'updatedFolder' },
      folder.id,
    );

    expect(updatedFolder.data.name).toEqual('updatedFolder');
  });

  it('should return AppError', async (): Promise<void> => {
    await expect(
      updateFolderService.execute({ name: '' }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
