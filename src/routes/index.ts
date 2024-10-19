import { Router } from 'express';
import { userRouter } from './userRouter';
import { systemRouter } from './systemRouter';
import { guardRouter } from './guardRouter';

import { financeRouter } from './financeRouter';
import { shareRouter } from './shareRouter';

const routes = Router();
routes.use(guardRouter);
routes.use(userRouter);
routes.use(systemRouter);
routes.use(financeRouter);
routes.use(shareRouter);
export { routes };
