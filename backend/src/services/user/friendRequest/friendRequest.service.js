import mongoose from "mongoose";
import FriendRequest from "./FriendRequest.model.js";
import { createHttpError, validationError } from "../../../utils/httpError.js";
import { betterAuthUserApi as defaultUserApi } from "../betterAuthUser.api.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const sanitizeSummaryUser = (user) => {
  if (!user) return null;

  if (typeof user === "object" && typeof user.toObject === "function") {
    const { _id, username, name, email } = user.toObject();
    return {
      id: toStringId(_id),
      username: username ?? name ?? email ?? toStringId(_id),
      email,
    };
  }

  if (typeof user === "object") {
    return {
      id: toStringId(user._id ?? user.id),
      username: user.username ?? user.name ?? user.email ?? toStringId(user._id ?? user.id),
      email: user.email,
    };
  }

  return { id: toStringId(user) };
};

const sanitizeFriendRequestDocument = (request) => {
  if (!request) return null;

  const plain =
    typeof request.toObject === "function" ? request.toObject() : { ...request };

  return {
    id: toStringId(plain._id ?? request),
    from: toStringId(plain.from),
    to: toStringId(plain.to),
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export function createFriendRequestService({
  FriendRequestModel = FriendRequest,
  userApi = defaultUserApi,
  mongooseLib = mongoose,
} = {}) {
  const getUserSummariesMap = async (userIds = [], authContext) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map();
    }

    const uniqueIds = Array.from(new Set(userIds.map((id) => toStringId(id)))).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }

    const users = await userApi.getUsersByIds(uniqueIds, authContext);
    const map = new Map();
    for (const user of users) {
      const summary = sanitizeSummaryUser(user);
      if (summary?.id) {
        map.set(summary.id, summary);
      }
    }
    return map;
  };

  const sendFriendRequest = async ({ fromUserId, toUserId, authContext }) => {
    if (!toUserId) {
      throw validationError("Falta el usuario destinatario (to)", { field: "to" });
    }

    if (!mongooseLib.Types.ObjectId.isValid(toUserId)) {
      throw validationError("ID de usuario no válido", { field: "to" });
    }

    if (!fromUserId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (toStringId(fromUserId) === toStringId(toUserId)) {
      throw createHttpError(400, "No puedes enviarte una solicitud a ti mismo", {
        code: "INVALID_OPERATION",
      });
    }

    const receiver = await userApi.getUserById(toUserId, authContext);
    if (!receiver) {
      throw createHttpError(404, "El usuario destinatario no existe", {
        code: "USER_NOT_FOUND",
      });
    }

    const existing = await FriendRequestModel.findOne({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    if (existing) {
      throw createHttpError(409, "Ya enviaste una solicitud a este usuario", {
        code: "REQUEST_EXISTS",
      });
    }

    const request = new FriendRequestModel({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    await request.save();

    return sanitizeFriendRequestDocument(request);
  };

  const respondFriendRequest = async ({ requestId, status }) => {
    if (!["accepted", "rejected"].includes(status)) {
      throw validationError("Estado inválido", { field: "status" });
    }

    const request = await FriendRequestModel.findById(requestId);
    if (!request) {
      throw createHttpError(404, "Solicitud no encontrada", {
        code: "REQUEST_NOT_FOUND",
      });
    }

    request.status = status;
    await request.save();

    return sanitizeFriendRequestDocument(request);
  };

  const listPendingFriendRequests = async ({ userId, authContext }) => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const requests = await FriendRequestModel.find({
      to: userId,
      status: "pending",
    });

    const sendersMap = await getUserSummariesMap(
      requests.map((request) => request.from),
      authContext,
    );

    return requests.map((request) => {
      const sanitized = sanitizeFriendRequestDocument(request);
      return {
        ...sanitized,
        to: toStringId(userId),
        from: sendersMap.get(toStringId(request.from)) ?? sanitizeSummaryUser(request.from),
        type: "friend",
      };
    });
  };

  const listFriends = async ({ userId, authContext }) => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const requests = await FriendRequestModel.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    });

    const friendIds = Array.from(
      new Set(
        requests.map((request) =>
          toStringId(
            toStringId(request.from) === toStringId(userId)
              ? request.to
              : request.from,
          ),
        ),
      ),
    );

    if (friendIds.length === 0) {
      return [];
    }

    const userMap = await getUserSummariesMap(friendIds, authContext);
    return friendIds
      .map((id) => userMap.get(toStringId(id)))
      .filter(Boolean);
  };

  return {
    sendFriendRequest,
    respondFriendRequest,
    listPendingFriendRequests,
    listFriends,
    sanitizeFriendRequest: sanitizeFriendRequestDocument,
  };
}

export const defaultFriendRequestService = createFriendRequestService();
