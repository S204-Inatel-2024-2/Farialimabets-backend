import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { FindOptionsWhere } from 'typeorm';
import { Preset } from '@modules/system/entities/Preset';
import { IListDTO } from '@dtos/IListDTO';
import { ListPresetService } from './ListPresetService';

export class ListPresetController {
  public async handle(
    request: Request<
      never,
      never,
      never,
      { page: number; limit: number } & FindOptionsWhere<Preset>
    >,
    response: Response<IListDTO<Preset>>,
  ) {
    const listPreset = container.resolve(ListPresetService);

    const { page = 1, limit = 20, ...filters } = request.query;

    const presets = await listPreset.execute(page, limit, filters);

    return response.status(presets.code).send(presets);
  }
}
