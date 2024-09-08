import { Router } from 'express';
import { CreateUserController } from '@modules/users/services/createUser/CreateUserController';
import { ShowUserController } from '@modules/users/services/showUser/ShowUserController';
import { ListUserController } from '@modules/users/services/listUser/ListUserController';
import { UpdateUserController } from '@modules/users/services/updateUser/UpdateUserController';
import { DeleteUserController } from '@modules/users/services/deleteUser/DeleteUserController';

const userRouter = Router();
const createUserController = new CreateUserController();
const listUserController = new ListUserController();
const showUserController = new ShowUserController();
const updateUserController = new UpdateUserController();
const deleteUserController = new DeleteUserController();

userRouter
  .route('/users')
  .post(createUserController.handle)
  .get(listUserController.handle);

userRouter
  .route('/users/:id')
  .get(showUserController.handle)
  .put(updateUserController.handle)
  .delete(deleteUserController.handle);

export { userRouter };
