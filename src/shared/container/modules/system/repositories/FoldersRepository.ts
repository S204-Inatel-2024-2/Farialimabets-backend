import { Folder } from '@modules/system/entities/Folder';
import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';
import { Not, QueryRunner } from 'typeorm';

export class FoldersRepository
  extends BaseRepository<Folder>
  implements IFoldersRepositoryDTO
{
  public constructor() {
    super(Folder);
  }

  public override async findAll(
    {
      page,
      limit,
      where,
      ...baseData
    }: Parameters<IFoldersRepositoryDTO['findAll']>[0],
    trx: QueryRunner,
  ): Promise<{ list: Array<Folder>; amount: number }> {
    return trx.manager
      .findAndCount(Folder, {
        skip: page && limit && (page - 1) * limit,
        take: limit,
        ...baseData,
        where: { ...where, slug: Not('hidden') },
      })
      .then(([list, amount]) => ({ list, amount }));
  }
}
