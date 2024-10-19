import { BuyShareController } from '@modules/finances/services/buySahre/BuyShareController';
import { ListShareController } from '@modules/finances/services/listShare/ListShareController';
import { Router } from 'express';

const shareRouter = Router();

const buyShareController = new BuyShareController();
const listShareController = new ListShareController();

shareRouter.get('/shares', listShareController.handle);
shareRouter.post('/shares', buyShareController.handle);

export { shareRouter };
