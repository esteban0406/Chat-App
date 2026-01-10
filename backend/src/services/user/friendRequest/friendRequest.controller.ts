// src/services/user/friendRequest/friendRequest.controller.ts
import { Request, Response, NextFunction } from "express";
import { ok } from "../../../utils/response.js";
import {
  defaultFriendRequestService,
  FriendRequestService,
} from "./friendRequest.service.js";

interface FriendRequestControllerDeps {
  friendRequestService?: FriendRequestService;
}

export function createFriendRequestController({
  friendRequestService = defaultFriendRequestService,
}: FriendRequestControllerDeps = {}) {
  if (!friendRequestService) {
    throw new Error(
      "friendRequestService es requerido para crear el controlador de solicitudes de amistad"
    );
  }

  const sendFriendRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = await friendRequestService.sendFriendRequest({
        fromUserId: req.user!._id,
        toUserId: req.body?.to,
        authContext: req.authContext,
      });

      return ok(res, {
        status: 201,
        message: "Solicitud enviada",
        data: { request: request.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const respondFriendRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = await friendRequestService.respondFriendRequest({
        requestId: req.params?.id,
        status: req.body?.status,
      });

      return ok(res, {
        message: `Solicitud ${request.status}`,
        data: { request: request.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getPendingFriendRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pendingRequests =
        await friendRequestService.listPendingFriendRequests({
          userId: req.user!._id,
          authContext: req.authContext,
        });

      const requests = pendingRequests.map(({ request, fromUser }) => ({
        ...request.toJSON(),
        from: fromUser,
        type: "friend",
      }));

      return ok(res, {
        data: { requests },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const friends = await friendRequestService.listFriends({
        userId: req.user!._id,
        authContext: req.authContext,
      });

      return ok(res, {
        data: { friends },
      });
    } catch (error) {
      return next(error);
    }
  };

  return {
    sendFriendRequest,
    respondFriendRequest,
    getPendingFriendRequests,
    getFriends,
  };
}

export const friendRequestController = createFriendRequestController();

export const {
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} = friendRequestController;

export default friendRequestController;
