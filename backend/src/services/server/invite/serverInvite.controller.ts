// src/services/server/invite/serverInvite.controller.ts
import { Request, Response, NextFunction } from "express";
import { ok } from "../../../utils/response.js";
import { defaultServerInviteService, ServerInviteService } from "./serverInvite.service.js";

interface ServerInviteControllerDeps {
  serverInviteService?: ServerInviteService;
}

export function createServerInviteController({
  serverInviteService = defaultServerInviteService,
}: ServerInviteControllerDeps = {}) {
  if (!serverInviteService) {
    throw new Error("serverInviteService es requerido para crear el controlador de invitaciones");
  }

  const sendInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invite = await serverInviteService.sendInvite({
        fromUserId: req.user!._id,
        toUserId: req.body?.to,
        serverId: req.body?.serverId,
      });

      return ok(res, {
        status: 201,
        message: "Invitación enviada",
        data: { invite: invite.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invite = await serverInviteService.acceptInvite({
        inviteId: req.params?.inviteId,
        userId: req.user!._id,
      });

      return ok(res, {
        message: "Invitación aceptada",
        data: { invite: invite.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const rejectInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invite = await serverInviteService.rejectInvite({
        inviteId: req.params?.inviteId,
        userId: req.user!._id,
      });

      return ok(res, {
        message: "Invitación rechazada",
        data: { invite: invite.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getPendingInvites = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pendingInvites = await serverInviteService.listPendingInvites({
        userId: req.user!._id,
        authContext: req.authContext,
      });

      const invites = pendingInvites.map(({ invite, fromUser, server }) => ({
        ...invite.toJSON(),
        from: fromUser,
        server,
        type: "server",
      }));

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
