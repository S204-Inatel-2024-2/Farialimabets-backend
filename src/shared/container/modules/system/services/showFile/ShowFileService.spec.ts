import { AppError } from '@shared/errors/AppError';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { ShowFileService } from './ShowFileService';

let fakeFilesRepository: FakeFilesRepository;
let fakeFoldersRepository: FakeFoldersRepository;
let showFile: ShowFileService;
let connection: IConnectionDTO;

describe('ShowFileService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeFoldersRepository = new FakeFoldersRepository();
    showFile = new ShowFileService(fakeFilesRepository, connection);
  });

  it('should be able to show a file', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({
      name: 'folder',
    });

    const file = await fakeFilesRepository.create({
      name: 'file',
      file: 'hash-file.png',
      folder_id: folder.id,
      file_url: 'http://localhost:3333/uploads/hash-file.png',
    });

    const getFile = await showFile.execute(file.id);

    expect(getFile.data).toHaveProperty('id');
    expect(getFile.data).toEqual(file);
  });

  it('should not be able to show files with a non-existing id', async (): Promise<void> => {
    await expect(showFile.execute('non-existing-file-id')).rejects.toThrow(
      new AppError('NOT_FOUND', 'File not found'),
    );
  });
});
