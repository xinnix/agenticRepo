import { router } from "./trpc";

// Merge all feature routers here
import { authRouter } from "../modules/auth/trpc/auth.router";
import { todoRouter } from "../modules/todo/trpc/todo.router";
import { userRouter } from "../modules/user/trpc/user.router";
import { roleRouter } from "../modules/role/trpc/role.router";
import { categoryRouter } from "../modules/category/trpc/category.router";

export const appRouter = router({
  auth: authRouter,
  todo: todoRouter,
  user: userRouter,
  role: roleRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
