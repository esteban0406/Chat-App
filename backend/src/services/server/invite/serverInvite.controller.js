import { ok } from "../../../utils/response.js";
import { defaultServerInviteService } from "./serverInvite.service.js";

export function createServerInviteController({
  serverInviteService = defaultServerInviteService,
} = {}) {
  if (!serverInviteService) {
    throw new Error("serverInviteService es requerido para crear el controlador de invitaciones");
  }

  const sendInvite = async (req, res, next) => {
    try {
      const invite = await serverInviteService.sendInvite({
        fromUserId: req.user?._id,
        toUserId: req.body?.to,
        serverId: req.body?.serverId,
      });

      return ok(res, {
        status: 201,
        message: "Invitación enviada",
        data: { invite },
      });
    } catch (error) {
      return next(error);
    }
  };

  const acceptInvite = async (req, res, next) => {
    try {
      const invite = await serverInviteService.acceptInvite({
        inviteId: req.params?.inviteId,
        userId: req.user?._id,
      });

      return ok(res, {
        message: "Invitación aceptada",
        data: { invite },
      });
    } catch (error) {
      return next(error);
    }
  };

  const rejectInvite = async (req, res, next) => {
    try {
      const invite = await serverInviteService.rejectInvite({
        inviteId: req.params?.inviteId,
        userId: req.user?._id,
      });

      return ok(res, {
        message: "Invitación rechazada",
        data: { invite },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getPendingInvites = async (req, res, next) => {
    try {
      const invites = await serverInviteService.listPendingInvites({
        userId: req.user?._id,
        authContext: req.authContext,
      });

      return ok(res, {
        data: { invites },
      });
    } catch (error) {
      return next(error);
    }
  };

  return {
    sendInvite,
    acceptInvite,
    rejectInvite,
    getPendingInvites,
  };
}

export const serverInviteController = createServerInviteController();

export const {
  sendInvite: sendServerInvite,
  acceptInvite: acceptServerInvite,
  rejectInvite: rejectServerInvite,
  getPendingInvites: getPendingServerInvites,
} = serverInviteController;

export default serverInviteController;
