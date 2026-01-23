import { router } from "./trpc";

// Merge all feature routers here
import { authRouter } from "../modules/auth/trpc/auth.router";
import { todoRouter } from "../modules/todo/trpc/todo.router";
import { userRouter } from "../modules/user/trpc/user.router";
import { roleRouter } from "../modules/role/trpc/role.router";
import { categoryRouter } from "../modules/category/trpc/category.router";
import { ticketRouter } from "../modules/ticket/trpc/ticket.router";
import { attachmentRouter } from "../modules/attachment/trpc/attachment.router";
import { notificationRouter } from "../modules/notification/trpc/notification.router";
import { statisticsRouter } from "../modules/statistics/trpc/statistics.router";
import { departmentRouter } from "../modules/department";
import { areaRouter } from "../modules/area";
import { permissionRouter } from "../modules/permission";

export const appRouter = router({
  auth: authRouter,
  todo: todoRouter,
  user: userRouter,
  role: roleRouter,
  category: categoryRouter,
  ticket: ticketRouter,
  attachment: attachmentRouter,
  notification: notificationRouter,
  statistics: statisticsRouter,
  department: departmentRouter,
  area: areaRouter,
  permission: permissionRouter,
});

export type AppRouter = typeof appRouter;
