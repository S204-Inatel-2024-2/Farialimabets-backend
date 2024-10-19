import { BuyShareController } from '@modules/finances/services/buySahre/BuyShareController';
import { Router } from 'express';

const shareRouter = Router();

const buyShareController = new BuyShareController();

shareRouter.post('/shares', buyShareController.handle);

export { shareRouter };
