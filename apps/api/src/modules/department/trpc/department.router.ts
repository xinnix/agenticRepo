import { createCrudRouter } from "../../../trpc/trpc.helper";
import { DepartmentSchema } from "@opencode/shared";

/**
 * Department tRPC Router
 *
 * Provides standard CRUD operations for departments.
 * Departments are flat (no hierarchy).
 */
export const departmentRouter = createCrudRouter("Department", {
  create: DepartmentSchema.createInput,
  update: DepartmentSchema.updateInput,
});
