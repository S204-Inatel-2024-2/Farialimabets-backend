import {
  DeleteResult,
  EntityTarget,
  FindManyOptions,
  In,
  Like,
  ObjectLiteral,
  QueryRunner,
} from 'typeorm';
import { IBaseRepository } from './IBaseRepository';

export abstract class BaseRepository<Entity extends ObjectLiteral>
  implements IBaseRepository<Entity>
{
  public constructor(private readonly target: EntityTarget<Entity>) {}

  public async exists(
    baseData: Parameters<IBaseRepository<Entity>['exists']>[0],
    trx: QueryRunner,
  ): Promise<boolean> {
    return trx.manager.exists(this.target, baseData);
  }

  public async findBy(
    baseData: Parameters<IBaseRepository<Entity>['findBy']>[0],
    trx: QueryRunner,
  ): Promise<Entity | null> {
    return trx.manager.findOne(this.target, baseData);
  }

  public async findAll(
    {
      page,
      limit,
      ...baseData
    }: Parameters<IBaseRepository<Entity>['findAll']>[0],
    trx: QueryRunner,
  ): Promise<{ list: Array<Entity>; amount: number }> {
    return trx.manager
      .findAndCount(this.target, {
        skip: page && limit && (page - 1) * limit,
        take: limit,
        ...baseData,
      })
      .then(([list, amount]) => ({ list, amount }));
  }

  public async findIn(
    {
      where,
      page,
      limit,
      ...baseData
    }: Parameters<IBaseRepository<Entity>['findIn']>[0],
    trx: QueryRunner,
  ): Promise<Array<Entity>> {
    return trx.manager.find(this.target, {
      skip: page && limit && (page - 1) * limit,
      take: limit,
      ...baseData,
      where: Object.fromEntries(
        Object.entries(where).map(([key, values]) => [
          key,
          In(values as Array<Entity[keyof Entity]>),
        ]),
      ) as FindManyOptions<Entity>['where'],
    });
  }

  public async findLike(
    {
      where,
      page,
      limit,
      ...baseData
    }: Parameters<IBaseRepository<Entity>['findLike']>[0],
    trx: QueryRunner,
  ): Promise<Array<Entity>> {
    return trx.manager.find(this.target, {
      skip: page && limit && (page - 1) * limit,
      take: limit,
      ...baseData,
      where: (() => {
        if (Array.isArray(where)) {
          return where.flatMap(condition =>
            Object.entries(condition).map(([key, value]) => ({
              [key]: Like(value),
            })),
          );
        }
        return Object.entries(where).map(([key, value]) => ({
          [key]: Like(value),
        }));
      })() as FindManyOptions<Entity>['where'],
    });
  }

  public async create(
    baseData: Parameters<IBaseRepository<Entity>['create']>[0],
    trx: QueryRunner,
  ): Promise<Entity> {
    return trx.manager.save(
      this.target,
      trx.manager.create(this.target, baseData),
    );
  }

  public async createMany(
    baseData: Parameters<IBaseRepository<Entity>['createMany']>[0],
    trx: QueryRunner,
  ): Promise<Array<Entity>> {
    return trx.manager.save(
      this.target,
      trx.manager.create(this.target, baseData),
    );
  }

  public async update(
    baseData: Parameters<IBaseRepository<Entity>['create']>[0],
    trx: QueryRunner,
  ): Promise<Entity> {
    return trx.manager.save(this.target, baseData);
  }

  public async updateMany(
    baseData: Parameters<IBaseRepository<Entity>['updateMany']>[0],
    trx: QueryRunner,
  ): Promise<Array<Entity>> {
    return trx.manager.save(this.target, baseData);
  }

  public async delete(
    baseData: Parameters<IBaseRepository<Entity>['delete']>[0],
    trx: QueryRunner,
  ): Promise<DeleteResult> {
    return trx.manager.delete(this.target, baseData);
  }

  public async deleteMany(
    baseData: Parameters<IBaseRepository<Entity>['deleteMany']>[0],
    trx: QueryRunner,
  ): Promise<DeleteResult> {
    return trx.manager.delete(this.target, baseData);
  }

  public async softDelete(
    baseData: Parameters<IBaseRepository<Entity>['softDelete']>[0],
    trx: QueryRunner,
  ): Promise<DeleteResult> {
    return trx.manager.softDelete(this.target, baseData);
  }

  public async softDeleteMany(
    baseData: Parameters<IBaseRepository<Entity>['softDeleteMany']>[0],
    trx: QueryRunner,
  ): Promise<DeleteResult> {
    return trx.manager.softDelete(this.target, baseData);
  }
}
