import { Router } from 'express';
import { userRouter } from './userRouter';
import { systemRouter } from './systemRouter';
import { guardRouter } from './guardRouter';

const routes = Router();
routes.use(guardRouter); // Use this before all routes to protect using jwt and set open routes/methods at guardRouter.ts
routes.use(userRouter);
routes.use(systemRouter)
export { routes };

