import { ok } from "../../../utils/response.js";
import { defaultFriendRequestService } from "./friendRequest.service.js";

export function createFriendRequestController({
  friendRequestService = defaultFriendRequestService,
} = {}) {
  if (!friendRequestService) {
    throw new Error(
      "friendRequestService es requerido para crear el controlador de solicitudes de amistad",
    );
  }

  const sendFriendRequest = async (req, res, next) => {
    try {
      const request = await friendRequestService.sendFriendRequest({
        fromUserId: req.user?._id,
        toUserId: req.body?.to,
      });

      return ok(res, {
        status: 201,
        message: "Solicitud enviada",
        data: { request },
      });
    } catch (error) {
      return next(error);
    }
  };

  const respondFriendRequest = async (req, res, next) => {
    try {
      const request = await friendRequestService.respondFriendRequest({
        requestId: req.params?.id,
        status: req.body?.status,
      });

      return ok(res, {
        message: `Solicitud ${request.status}`,
        data: { request },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getPendingFriendRequests = async (req, res, next) => {
    try {
      const requests = await friendRequestService.listPendingFriendRequests({
        userId: req.user?._id,
      });

      return ok(res, {
        data: { requests },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getFriends = async (req, res, next) => {
    try {
      const friends = await friendRequestService.listFriends({
        userId: req.user?._id,
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
