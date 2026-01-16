import { router } from "./trpc";

import { skilltodoRouter } from "./skill_todo.router";

import { testproductRouter } from "./test_product.router";

import { skilltodoRouter } from "./skill_todo.router";

import { testtodoRouter } from "./test_todo.router";

import { skilltodoRouter } from "./skill_todo.router";

import { testproductRouter } from "./test_product.router";

import { skilltodoRouter } from "./skill_todo.router";

export const appRouter = router({
  // Routers will be merged here
});

export type AppRouter = typeof appRouter;
