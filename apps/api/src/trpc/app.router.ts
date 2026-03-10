import { router } from "./trpc";

// Merge all feature routers here
import { authRouter } from "../modules/auth/trpc/auth.router";
import { todoRouter } from "../modules/todo/trpc/todo.router";
import { userRouter } from "../modules/user/trpc/user.router";
import { roleRouter } from "../modules/role/trpc/role.router";
import { permissionRouter } from "../modules/permission";

export const appRouter = router({
  auth: authRouter,
  todo: todoRouter,
  user: userRouter,
  role: roleRouter,
  permission: permissionRouter,
});

export type AppRouter = typeof appRouter;
