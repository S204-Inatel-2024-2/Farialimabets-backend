import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { injectable, inject } from 'tsyringe';
import { userRouter } from '@routes/userRouter';
import { systemRouter } from '@routes/systemRouter';
import { Router } from 'express';
import { Role } from '@modules/users/entities/Role';
import { IPermissionDTO } from '@modules/users/dtos/IPermissionDTO';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { Permission } from '@modules/users/entities/Permission';
import { IPermissionsRepositoryDTO } from '@modules/users/repositories/IPermissionsRepository';
import { IRolesRepositoryDTO } from '@modules/users/repositories/IRolesRepository';
import { AppError } from '@shared/errors/AppError';
import { User } from '@modules/users/entities/User';
import { IConnectionDTO } from '@shared/typeorm';
import { Get, Route, Tags } from 'tsoa';
import { slugify } from '@utils/slugify';
import translate from '@iamtraction/google-translate';
import { IMethodDTO } from '@modules/system/dtos/IMethodDTO';
import { answerRouter } from '@routes/answerRouter';
import { categoryRouter } from '@routes/categoryRouter';
import { formRouter } from '@routes/formRouter';
import { partyRouter } from '@routes/partyRouter';
import { questionRouter } from '@routes/questionRouter';
import { exceptions } from '@routes/guardRouter';

@Route('/seed-permissions')
@injectable()
export class SeedPermissionService {
  public constructor(
    @inject('PermissionsRepository')
    private readonly permissionsRepository: IPermissionsRepositoryDTO,

    @inject('RolesRepository')
    private readonly rolesRepository: IRolesRepositoryDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  private async buildBody(
    permissionsCreated: Array<Permission>,
    roles: Array<Role>,
    users: Array<User>,
  ): Promise<Array<IPermissionDTO>> {
    const permissions: Array<IPermissionDTO> = [];
    const routers: Array<Router> = [
      userRouter,
      systemRouter,
      answerRouter,
      categoryRouter,
      formRouter,
      partyRouter,
      questionRouter,
    ];

    routers.forEach(router => {
      const routes = router.stack.filter(layer => layer.route);

      routes.forEach(layer => {
        const methodList = Object.keys(layer?.route?.methods).filter(
          method => method !== '_all',
        );

        methodList.forEach(rawMethod => {
          const upperMethod =
            rawMethod.toUpperCase() as keyof typeof IMethodDTO;

          const method = this.getMethod(layer?.route?.path, upperMethod);

          const route = layer?.route?.path;

          const isException = exceptions.path.some(
            exception =>
              exception.url.test(route) &&
              exception.methods.includes(upperMethod),
          );

          if (
            isException &&
            !(route === '/admin/login' && upperMethod === 'POST')
          ) {
            return;
          }

          const findRoute = permissions.find(
            source => source.route === route && source.method === method,
          );

          if (!findRoute) {
            const name = route
              .split('/:id')[0]
              .replace(/-/g, ' ')
              .replace(/\//g, ' ')
              .slice(1);

            const slug = `${slugify(name)}___${method}`;

            const checkIfExists = permissionsCreated.find(
              perm => perm.slug === slug,
            );

            if (!checkIfExists)
              permissions.push({
                route,
                name,
                description: '',
                method,
                roles,
                slug,
                users,
              });
          }
        });
      });
    });

    await Promise.all(
      permissions.map(async perm => {
        const translated = await translate(perm.name, {
          from: 'en',
          to: 'pt',
        }).then(x => x.text);
        perm.name = translated
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        perm.description = `Essa permissão é responsável por gerenciar ${translated.toLowerCase()}`;
      }),
    );

    return permissions;
  }

  private getMethod(
    path: string,
    method: keyof typeof IMethodDTO,
  ): 'show' | 'list' | 'update' | 'create' | 'delete' | 'patch' {
    if (method === 'GET' && !path.endsWith('/:id')) return 'list';

    return IMethodDTO[method];
  }

  @Get()
  @Tags('System')
  public async execute(): Promise<IResponseDTO<null>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const adminRole = await this.rolesRepository.findBy(
        {
          where: {
            slug: 'usuario-padrao',
          },
          relations: { users: true },
          select: { id: true, users: { id: true } },
        },
        trx,
      );

      if (!adminRole) {
        throw new AppError('NOT_FOUND', 'Admin role not found');
      }

      const { list } = await this.permissionsRepository.findAll(
        {
          select: { slug: true },
        },
        trx,
      );

      const permissions = await this.buildBody(
        list,
        [adminRole],
        adminRole.users,
      );

      await this.permissionsRepository.createMany(permissions, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:roles`,
      );
      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:permissions`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 201,
        message_code: 'SYNCHRONIZED',
        message: 'Permissions seeded successfully',
        data: null,
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
