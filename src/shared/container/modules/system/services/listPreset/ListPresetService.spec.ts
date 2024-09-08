import { FakePresetsRepository } from '@modules/system/repositories/fakes/FakePresetsRepository';
import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { ListPresetService } from './ListPresetService';

let fakePresetsRepository: FakePresetsRepository;
let listPreset: ListPresetService;
let fakeCacheProvider: FakeCacheProvider;
let connection: IConnectionDTO;

describe('ListPresetService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakePresetsRepository = new FakePresetsRepository();
    fakeCacheProvider = new FakeCacheProvider();
    listPreset = new ListPresetService(
      fakePresetsRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('should be able to list all the presets', async (): Promise<void> => {
    const [preset01, preset02] = await fakePresetsRepository.createMany([
      {
        name: 'nodemailer',
        attributes: {},
      },
      {
        name: 'ses',
        attributes: {},
      },
    ]);

    const presetList = await listPreset.execute(1, 2, {});

    expect(presetList.data).toEqual([preset01, preset02]);
  });

  it('should be able to list all the presets using cache', async (): Promise<void> => {
    const [preset01, preset02] = await fakePresetsRepository.createMany([
      {
        name: 'ses',
        attributes: {},
      },
      {
        name: 'nodemailer',
        attributes: {},
      },
    ]);

    await listPreset.execute(1, 2, {});

    const presetList = await listPreset.execute(1, 2, {});

    expect(presetList.data).toEqual(
      JSON.parse(JSON.stringify([preset01, preset02])),
    );
  });

  it('should be able to list the presets with the specified pagination', async (): Promise<void> => {
    const [preset01, preset02] = await fakePresetsRepository.createMany([
      {
        name: 'ses',
        attributes: {},
      },
      {
        name: 'nodemailer',
        attributes: {},
      },
      {
        name: 'general',
        attributes: {},
      },
    ]);

    const presetList01 = await listPreset.execute(1, 1, {});

    expect(presetList01.data).toEqual([preset01]);

    const presetList02 = await listPreset.execute(1, 2, {});
    expect(presetList02.data).toEqual([preset01, preset02]);
  });

  it('should return AppError', async (): Promise<void> => {
    jest.spyOn(fakePresetsRepository, 'findAll').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_LIST', 'Failed to list presets');
    });

    await expect(listPreset.execute(1, 2, {})).rejects.toBeInstanceOf(AppError);
  });
});
