import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { ListFolderService } from './ListFolderService';

let fakeFoldersRepository: FakeFoldersRepository;
let listFolder: ListFolderService;
let fakeCacheProvider: FakeCacheProvider;
let connection: IConnectionDTO;

describe('ListFolderService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFoldersRepository = new FakeFoldersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    listFolder = new ListFolderService(
      fakeFoldersRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('should be able to list all folders', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
    ]);

    const folderList = await listFolder.execute(1, 2, {});

    expect(folderList.data).toEqual([folder01, folder02]);
  });

  it('should be able to list all the folders using cache', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
    ]);

    await listFolder.execute(1, 2, {});

    const folderList = await listFolder.execute(1, 2, {});

    expect(folderList.data).toEqual(
      JSON.parse(JSON.stringify([folder01, folder02])),
    );
  });

  it('should be able to list the folders with the specified pagination', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
      {
        name: 'folder 3',
      },
    ]);

    const folderList01 = await listFolder.execute(1, 1, {});

    expect(folderList01.data).toEqual([folder01]);

    const folderList02 = await listFolder.execute(1, 2, {});
    expect(folderList02.data).toEqual([folder01, folder02]);
  });

  it('should return AppError', async (): Promise<void> => {
    jest.spyOn(fakeFoldersRepository, 'findAll').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_LIST', 'Failed to list folders');
    });

    await expect(listFolder.execute(1, 2, {})).rejects.toBeInstanceOf(AppError);
  });
});
