// src/services/server/invite/serverInvite.service.ts
import { Types } from "mongoose";
import ServerInviteModel, { IServerInviteDocument } from "./ServerInvite.model.js";
import Server from "../Server.model.js";
import { createHttpError, validationError } from "../../../utils/httpError.js";
import { betterAuthUserApi, BetterAuthUserApi } from "../../user/betterAuthUser.api.js";
import type { AuthContext, SanitizedUser } from "../../../auth/betterAuth.types.js";

// =======================
// Types
// =======================

export interface UserSummary {
  id: string;
  username?: string;
  email?: string;
}

export interface ServerSummary {
  id: string;
  name: string;
}

interface SendInviteParams {
  fromUserId: string;
  toUserId: string;
  serverId: string;
}

interface RespondInviteParams {
  inviteId: string;
  userId: string;
}

interface ListPendingParams {
  userId: string;
  authContext?: AuthContext;
}

interface PendingInviteResult {
  invite: IServerInviteDocument;
  fromUser: UserSummary | null;
  server: ServerSummary | null;
}

interface ServerInviteServiceDeps {
  ServerInviteModel?: typeof ServerInviteModel;
  ServerModel?: typeof Server;
  userApi?: BetterAuthUserApi;
}

export interface ServerInviteService {
  sendInvite(params: SendInviteParams): Promise<IServerInviteDocument>;
  acceptInvite(params: RespondInviteParams): Promise<IServerInviteDocument>;
  rejectInvite(params: RespondInviteParams): Promise<IServerInviteDocument>;
  listPendingInvites(params: ListPendingParams): Promise<PendingInviteResult[]>;
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
      username: (u.username ?? u.name ?? u.email ?? id) as string,
      email: u.email as string | undefined,
    };
  }

  return { id: toStringId(user), username: toStringId(user) };
};

// =======================
// Service Factory
// =======================

export function createServerInviteService({
  ServerInviteModel: Model = ServerInviteModel,
  ServerModel = Server,
  userApi = betterAuthUserApi,
}: ServerInviteServiceDeps = {}): ServerInviteService {

  const getUserSummariesMap = async (
    userIds: (string | Types.ObjectId)[] = [],
    authContext?: AuthContext
  ): Promise<Map<string, UserSummary>> => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map();
    }

    const uniqueIds = Array.from(new Set(userIds.map((id) => toStringId(id)))).filter(Boolean);
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

  const getServerSummariesMap = async (
    serverIds: (string | Types.ObjectId)[] = []
  ): Promise<Map<string, ServerSummary>> => {
    if (!Array.isArray(serverIds) || serverIds.length === 0) {
      return new Map();
    }

    const uniqueIds = Array.from(new Set(serverIds.map((id) => toStringId(id)))).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }

    const servers = await ServerModel.find({ _id: { $in: uniqueIds } }).select("name");
    const map = new Map<string, ServerSummary>();

    for (const server of servers) {
      const id = toStringId(server._id);
      map.set(id, {
        id,
        name: server.name,
      });
    }
    return map;
  };

  const sendInvite = async ({
    fromUserId,
    toUserId,
    serverId,
  }: SendInviteParams): Promise<IServerInviteDocument> => {
    if (!fromUserId || !toUserId || !serverId) {
      throw validationError("El remitente, destinatario y servidor son requeridos", {
        fields: ["fromUserId", "toUserId", "serverId"],
      });
    }

    const existingInvite = await Model.findOne({
      from: fromUserId,
      to: toUserId,
      server: serverId,
      status: "pending",
    });

    if (existingInvite) {
      throw createHttpError(
        409,
        "Ya existe una invitación pendiente a este usuario para este servidor",
        { code: "INVITE_EXISTS" }
      );
    }

    const invite = new Model({
      from: fromUserId,
      to: toUserId,
      server: serverId,
    });

    try {
      await invite.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw createHttpError(409, "Invitación duplicada no permitida", {
          code: "INVITE_EXISTS",
        });
      }
      throw error;
    }

    return invite;
  };

  const acceptInvite = async ({
    inviteId,
  }: RespondInviteParams): Promise<IServerInviteDocument> => {
    if (!inviteId) {
      throw validationError("El inviteId es requerido", { field: "inviteId" });
    }

    const invite = await Model.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "accepted";
    await invite.save();

    await ServerModel.findByIdAndUpdate(invite.server, {
      $addToSet: { members: invite.to },
    });

    return invite;
  };

  const rejectInvite = async ({
    inviteId,
  }: RespondInviteParams): Promise<IServerInviteDocument> => {
    if (!inviteId) {
      throw validationError("El inviteId es requerido", { field: "inviteId" });
    }

    const invite = await Model.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "rejected";
    await invite.save();

    return invite;
  };

  const listPendingInvites = async ({
    userId,
    authContext,
  }: ListPendingParams): Promise<PendingInviteResult[]> => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const invites = await Model.find({ to: userId, status: "pending" });

    const [userMap, serverMap] = await Promise.all([
      getUserSummariesMap(
        invites.map((invite) => invite.from),
        authContext
      ),
      getServerSummariesMap(invites.map((invite) => invite.server)),
    ]);

    return invites
      .map((invite) => {
        const fromId = toStringId(invite.from);
        const serverId = toStringId(invite.server);
        const serverSummary = serverMap.get(serverId);

        if (!serverSummary) {
          return null;
        }

        return {
          invite,
          fromUser: userMap.get(fromId) ?? null,
          server: serverSummary,
        };
      })
      .filter((item): item is PendingInviteResult => item !== null);
  };

  return {
    sendInvite,
    acceptInvite,
    rejectInvite,
    listPendingInvites,
  };
}

export const defaultServerInviteService = createServerInviteService();
