import { Router } from 'express';
import { CreateWalletController } from '@modules/finances/services/createWallet/CreateWalletController';

const financeRouter = Router();
const createFinanceController = new CreateWalletController();

financeRouter.route('/finances').post(createFinanceController.handle);

financeRouter.route('/finances/:id');

export { financeRouter };
