import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { ListFileService } from './ListFileService';

let fakeFilesRepository: FakeFilesRepository;
let listFile: ListFileService;
let fakeCacheProvider: FakeCacheProvider;
let fakeFoldersRepository: FakeFoldersRepository;
let connection: IConnectionDTO;

describe('ListFileService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeFoldersRepository = new FakeFoldersRepository();
    listFile = new ListFileService(
      fakeFilesRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to list all the files', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
    ]);

    const [file01, file02] = await fakeFilesRepository.createMany([
      {
        name: 'file 1',
        file: 'hash-file-1.png',
        folder: folder01,
        file_url: 'http://localhost:3333/uploads/hash-file-1.png',
      },
      {
        name: 'file 2',
        file: 'hash-file-2.png',
        folder: folder02,
        file_url: 'http://localhost:3333/uploads/hash-file-2.png',
      },
    ]);

    const fileList = await listFile.execute(1, 2, {});

    expect(fileList.data).toEqual([file01, file02]);
  });

  it('Should be able to list all the files using cache', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
    ]);

    const [file01, file02] = await fakeFilesRepository.createMany([
      {
        name: 'file 1',
        file: 'hash-file-1.png',
        folder: folder01,
        file_url: 'http://localhost:3333/uploads/hash-file-1.png',
      },
      {
        name: 'file 2',
        file: 'hash-file-2.png',
        folder: folder02,
        file_url: 'http://localhost:3333/uploads/hash-file-2.png',
      },
    ]);

    await listFile.execute(1, 2, {});

    const fileList = await listFile.execute(1, 2, {});

    expect(fileList.data).toEqual(JSON.parse(JSON.stringify([file01, file02])));
  });

  it('should be able to list the files with the specified pagination', async (): Promise<void> => {
    const [folder01, folder02] = await fakeFoldersRepository.createMany([
      {
        name: 'folder 1',
      },
      {
        name: 'folder 2',
      },
    ]);

    const [file01, file02] = await fakeFilesRepository.createMany([
      {
        name: 'file 1',
        file: 'hash-file-1.png',
        folder: folder01,
        file_url: 'http://localhost:3333/uploads/hash-file-1.png',
      },
      {
        name: 'file 2',
        file: 'hash-file-2.png',
        folder: folder02,
        file_url: 'http://localhost:3333/uploads/hash-file-2.png',
      },
    ]);

    const fileList01 = await listFile.execute(1, 1, {});

    expect(fileList01.data).toEqual([file01]);

    const fileList02 = await listFile.execute(1, 2, {});
    expect(fileList02.data).toEqual([file01, file02]);
  });

  it('should return AppError', async (): Promise<void> => {
    jest.spyOn(fakeFilesRepository, 'findAll').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_LIST', 'Failed to list files');
    });

    await expect(listFile.execute(1, 2, {})).rejects.toBeInstanceOf(AppError);
  });
});
