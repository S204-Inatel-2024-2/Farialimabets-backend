import { BuyShareController } from '@modules/finances/services/buySahre/BuyShareController';
import { ListShareController } from '@modules/finances/services/listShare/ListShareController';
import { SellShareController } from '@modules/finances/services/sellShare/SellSahreController';
import { Router } from 'express';

const shareRouter = Router();

const buyShareController = new BuyShareController();
const listShareController = new ListShareController();
const sellShareCOntroller = new SellShareController();

shareRouter.get('/shares', listShareController.handle);
shareRouter.post('/shares', buyShareController.handle);
shareRouter.post('/sell-shares', sellShareCOntroller.handle);

export { shareRouter };
