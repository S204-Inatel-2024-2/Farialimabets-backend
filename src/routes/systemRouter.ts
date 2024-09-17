import { GenerateKeyControllerController } from '@modules/system/services/generateKey/GenerateKeyController';
import { Router } from 'express';

const systemRouter = Router();
const systemController = new GenerateKeyControllerController();

systemRouter.route('/generate-keys').post(systemController.handle);
export { systemRouter };
