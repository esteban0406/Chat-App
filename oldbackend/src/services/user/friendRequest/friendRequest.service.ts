// src/services/user/friendRequest/friendRequest.service.ts
import { Types } from "mongoose";
import {
  FriendRequestModel,
  IFriendRequestDocument,
} from "./FriendRequest.model.js";
import { createHttpError, validationError } from "../../../utils/httpError.js";
import { betterAuthUserApi, BetterAuthUserApi } from "../betterAuthUser.api.js";
import type {
  AuthContext,
  SanitizedUser,
} from "../../../auth/betterAuth.types.js";

// =======================
// Types
// =======================

export interface UserSummary {
  id: string;
  username: string;
  email?: string;
}

interface SendFriendRequestParams {
  fromUserId: string;
  toUserId: string;
  authContext?: AuthContext;
}

interface RespondFriendRequestParams {
  requestId: string;
  status: "accepted" | "rejected";
}

interface ListParams {
  userId: string;
  authContext?: AuthContext;
}

interface FriendRequestServiceDeps {
  FriendRequestModel?: typeof FriendRequestModel;
  userApi?: BetterAuthUserApi;
}

export interface FriendRequestService {
  sendFriendRequest(
    params: SendFriendRequestParams
  ): Promise<IFriendRequestDocument>;
  respondFriendRequest(
    params: RespondFriendRequestParams
  ): Promise<IFriendRequestDocument>;
  listPendingFriendRequests(
    params: ListParams
  ): Promise<
    { request: IFriendRequestDocument; fromUser: UserSummary | null }[]
  >;
  listFriends(params: ListParams): Promise<UserSummary[]>;
}

// =======================
// Helper Functions
// =======================

const toStringId = (value: Types.ObjectId | string | unknown): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString(): string }).toString();
  }
  return String(value);
};

const toUserSummary = (user: SanitizedUser | unknown): UserSummary | null => {
  if (!user) return null;

  if (typeof user === "object" && user !== null) {
    const u = user as Record<string, unknown>;
    const id = toStringId(u._id ?? u.id);
    return {
      id,
      username: String(u.username ?? u.name ?? u.email ?? id),
      email: u.email as string | undefined,
    };
  }

  return { id: toStringId(user), username: toStringId(user) };
};

// =======================
// Service Factory
// =======================

export function createFriendRequestService({
  FriendRequestModel: Model = FriendRequestModel,
  userApi = betterAuthUserApi,
}: FriendRequestServiceDeps = {}): FriendRequestService {
  const getUserSummariesMap = async (
    userIds: (string | Types.ObjectId)[] = [],
    authContext?: AuthContext
  ): Promise<Map<string, UserSummary>> => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map();
    }

    const uniqueIds = Array.from(
      new Set(userIds.map((id) => toStringId(id)))
    ).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }

    const users = await userApi.getUsersByIds(uniqueIds, authContext);
    const map = new Map<string, UserSummary>();

    for (const user of users) {
      const summary = toUserSummary(user);
      if (summary?.id) {
        map.set(summary.id, summary);
      }
    }
    return map;
  };

  const sendFriendRequest = async ({
    fromUserId,
    toUserId,
    authContext,
  }: SendFriendRequestParams): Promise<IFriendRequestDocument> => {
    if (!toUserId) {
      throw validationError("Falta el usuario destinatario (to)", {
        field: "to",
      });
    }

    if (!fromUserId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (toStringId(fromUserId) === toStringId(toUserId)) {
      throw createHttpError(
        400,
        "No puedes enviarte una solicitud a ti mismo",
        {
          code: "INVALID_OPERATION",
        }
      );
    }

    const receiver = await userApi.getUserById(toUserId, authContext);
    if (!receiver) {
      throw createHttpError(404, "El usuario destinatario no existe", {
        code: "USER_NOT_FOUND",
      });
    }

    const existing = await Model.findOne({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    if (existing) {
      throw createHttpError(409, "Ya enviaste una solicitud a este usuario", {
        code: "REQUEST_EXISTS",
      });
    }

    const request = new Model({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    await request.save();

    return request;
  };

  const respondFriendRequest = async ({
    requestId,
    status,
  }: RespondFriendRequestParams): Promise<IFriendRequestDocument> => {
    if (!["accepted", "rejected"].includes(status)) {
      throw validationError("Estado inválido", { field: "status" });
    }

    const request = await Model.findById(requestId);
    if (!request) {
      throw createHttpError(404, "Solicitud no encontrada", {
        code: "REQUEST_NOT_FOUND",
      });
    }

    request.status = status;
    await request.save();

    return request;
  };

  const listPendingFriendRequests = async ({
    userId,
    authContext,
  }: ListParams): Promise<
    { request: IFriendRequestDocument; fromUser: UserSummary | null }[]
  > => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const requests = await Model.find({
      to: userId,
      status: "pending",
    });

    const sendersMap = await getUserSummariesMap(
      requests.map((request) => request.from),
      authContext
    );

    return requests.map((request) => ({
      request,
      fromUser: sendersMap.get(toStringId(request.from)) ?? null,
    }));
  };

  const listFriends = async ({
    userId,
    authContext,
  }: ListParams): Promise<UserSummary[]> => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const requests = await Model.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    });

    const friendIds = Array.from(
      new Set(
        requests.map((request) =>
          toStringId(
            toStringId(request.from) === toStringId(userId)
              ? request.to
              : request.from
          )
        )
      )
    );

    if (friendIds.length === 0) {
      return [];
    }

    const userMap = await getUserSummariesMap(friendIds, authContext);
    return friendIds
      .map((id) => userMap.get(toStringId(id)))
      .filter((user): user is UserSummary => user !== undefined);
  };

  return {
    sendFriendRequest,
    respondFriendRequest,
    listPendingFriendRequests,
    listFriends,
  };
}

export const defaultFriendRequestService = createFriendRequestService();
