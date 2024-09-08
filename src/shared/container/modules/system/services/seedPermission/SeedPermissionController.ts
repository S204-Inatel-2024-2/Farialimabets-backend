import { container } from 'tsyringe';
import { Request, Response } from 'express';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { SeedPermissionService } from './SeedPermissionService';

export class SeedPermissionControllerController {
  public async handle(
    _request: Request,
    response: Response<IResponseDTO<null>>,
  ) {
    const seedPermissionController = container.resolve(SeedPermissionService);

    const categorySynchronization = await seedPermissionController.execute();

    return response
      .status(categorySynchronization.code)
      .send(categorySynchronization);
  }
}
