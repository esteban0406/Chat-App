import { ok } from "../../utils/response.js";
import { defaultServerService } from "./server.service.js";

export function createServerController({ serverService = defaultServerService } = {}) {
  if (!serverService) {
    throw new Error("serverService es requerido para crear el controlador de servidores");
  }

  const createServer = async (req, res, next) => {
    try {
      const result = await serverService.createServer({
        name: req.body?.name,
        description: req.body?.description,
        ownerId: req.user?._id,
        authContext: req.authContext,
      });

      return ok(res, {
        status: 201,
        message: "Servidor creado",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  const joinServer = async (req, res, next) => {
    try {
      const server = await serverService.joinServer({
        serverId: req.body?.serverId,
        userId: req.body?.userId,
        authContext: req.authContext,
      });

      return ok(res, {
        message: "Usuario unido al servidor",
        data: { server },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getServers = async (req, res, next) => {
    try {
      const servers = await serverService.listServersForMember({
        userId: req.user?._id,
        authContext: req.authContext,
      });

      return ok(res, {
        data: { servers },
      });
    } catch (error) {
      return next(error);
    }
  };

  const deleteServer = async (req, res, next) => {
    try {
      await serverService.deleteServer({
        serverId: req.params?.serverId,
      });

      return ok(res, { message: "Servidor eliminado con éxito" });
    } catch (error) {
      return next(error);
    }
  };

  const removeMember = async (req, res, next) => {
    try {
      const server = await serverService.removeMember({
        serverId: req.params?.serverId,
        memberId: req.params?.memberId,
        requesterId: req.user?._id,
        authContext: req.authContext,
      });

      return ok(res, {
        message: "Miembro eliminado",
        data: { server },
      });
    } catch (error) {
      return next(error);
    }
  };

  const leaveServer = async (req, res, next) => {
    try {
      await serverService.leaveServer({
        serverId: req.params?.serverId,
        userId: req.user?._id,
      });

      return ok(res, { message: "Has salido del servidor" });
    } catch (error) {
      return next(error);
    }
  };

  return {
    createServer,
    joinServer,
    getServers,
    deleteServer,
    removeMember,
    leaveServer,
  };
}

export const serverController = createServerController();

export const {
  createServer,
  joinServer,
  getServers,
  deleteServer,
  removeMember,
  leaveServer,
} = serverController;

export default serverController;
