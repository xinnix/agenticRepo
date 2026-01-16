import { router } from './trpc';
import { authRouter } from '../../features/auth/trpc/auth.router';
import { todoRouter } from '../../features/todo/trpc/todo.router';
import { roleRouter } from '../../features/role/trpc/role.router';
import { userRouter } from '../../features/user/trpc/user.router';
import { testRouter } from '../../features/test/trpc/test.router';

export const appRouter = router({
  auth: authRouter,
  todo: todoRouter,
  role: roleRouter,
  user: userRouter,
  test: testRouter,
});

export type AppRouter = typeof appRouter;
