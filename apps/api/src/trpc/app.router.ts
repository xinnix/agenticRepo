import { router } from "./trpc";

// Merge all feature routers here
import { authRouter } from "../modules/auth/trpc/auth.router";
import { todoRouter } from "../modules/todo/trpc/todo.router";
import { userRouter } from "../modules/user/trpc/user.router";

export const appRouter = router({
  auth: authRouter,
  todo: todoRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
