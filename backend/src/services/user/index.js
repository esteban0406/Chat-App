import { createUserService, defaultUserService } from "./user.service.js";
import { createUserController } from "./user.controller.js";
import { createUserRouter } from "./user.routes.js";

export function registerUserService(
  app,
  {
    mountPath = "/api/users",
    userService = defaultUserService,
    controller,
    router,
    authMiddleware,
  } = {}
) {
  if (!app || typeof app.use !== "function") {
    throw new Error("Se requiere una instancia válida de Express para registrar el servicio de usuarios");
  }

  const serviceInstance = userService ?? createUserService();
  const controllerInstance =
    controller ?? createUserController({ userService: serviceInstance });

  const routerOptions = { controller: controllerInstance };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createUserRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createUserService, defaultUserService } from "./user.service.js";
export {
  createUserController,
  userController as defaultUserController,
} from "./user.controller.js";
export { createUserRouter } from "./user.routes.js";

export default registerUserService;
