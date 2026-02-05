// src/services/server/server.service.ts
import mongoose, { Types } from "mongoose";
import Channel, { IChannelDocument } from "../channel/Channel.model.js";
import Server, { IServerDocument } from "./Server.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";
import { betterAuthUserApi, BetterAuthUserApi } from "../user/betterAuthUser.api.js";
import type { AuthContext, SanitizedUser } from "../../auth/betterAuth.types.js";

// =======================
// Types
// =======================

export interface UserSummary {
  id: string;
  username: string;
  email?: string;
}

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

interface CreateServerParams {
  name: string;
  description?: string;
  ownerId: string;
  authContext?: AuthContext;
}

interface CreateServerResult {
  server: IServerDocument;
  defaultChannel: IChannelDocument;
  members: UserSummary[];
}

interface ServerWithMembers {
  server: IServerDocument;
  members: UserSummary[];
}

interface JoinServerParams {
  serverId: string;
  userId: string;
  authContext?: AuthContext;
}

interface ListServersParams {
  userId: string;
  authContext?: AuthContext;
}

interface RemoveMemberParams {
  serverId: string;
  memberId: string;
  requesterId: string;
  authContext?: AuthContext;
}

interface LeaveServerParams {
  serverId: string;
  userId: string;
}

interface DeleteServerParams {
  serverId: string;
}

interface ServerServiceDeps {
  ServerModel?: typeof Server;
  ChannelModel?: typeof Channel;
  userApi?: BetterAuthUserApi;
}

export interface ServerService {
  createServer(params: CreateServerParams): Promise<CreateServerResult>;
  joinServer(params: JoinServerParams): Promise<ServerWithMembers>;
  listServersForMember(params: ListServersParams): Promise<ServerWithMembers[]>;
  removeMember(params: RemoveMemberParams): Promise<ServerWithMembers>;
  leaveServer(params: LeaveServerParams): Promise<void>;
  deleteServer(params: DeleteServerParams): Promise<void>;
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

// =======================
// Service Factory
// =======================

export function createServerService({
  ServerModel = Server,
  ChannelModel = Channel,
  userApi = betterAuthUserApi,
}: ServerServiceDeps = {}): ServerService {

  const ensureServerExists = async (serverId: string): Promise<IServerDocument> => {
    const server = await ServerModel.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", {
        code: "SERVER_NOT_FOUND",
      });
    }
    return server;
  };

  const getMembersMap = async (
    memberIds: (string | Types.ObjectId)[],
    authContext?: AuthContext
  ): Promise<Map<string, UserSummary>> => {
    const uniqueIds = Array.from(new Set(memberIds.map((id) => toStringId(id)))).filter(Boolean);
    if (!uniqueIds.length) return new Map();

    const users = await userApi.getUsersByIds(uniqueIds, authContext);
    const userMap = new Map<string, UserSummary>();

    for (const user of users) {
      const summary = toUserSummary(user);
      if (summary?.id) {
        userMap.set(summary.id, summary);
      }
    }

    return userMap;
  };

  const hydrateMembers = (
    memberIds: Types.ObjectId[],
    userMap: Map<string, UserSummary>
  ): UserSummary[] => {
    return (memberIds ?? []).map((member) => {
      const id = toStringId(member);
      return userMap.get(id) ?? { id, username: id };
    });
  };

  const createServer = async ({
    name,
    ownerId,
    authContext,
  }: CreateServerParams): Promise<CreateServerResult> => {
    if (!name?.trim()) {
      throw validationError("El nombre es requerido", { field: "name" });
    }

    if (!ownerId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const server = await ServerModel.create({
      name: name.trim(),
      owner: ownerId,
      members: [ownerId],
    });

    const channel = await ChannelModel.create({
      name: "general",
      type: "text",
      server: server._id,
    });

    server.channels.push(channel._id);
    await server.save();

    await server.populate("channels");

    const userMap = await getMembersMap(server.members, authContext);
    const members = hydrateMembers(server.members, userMap);

    return {
      server,
      defaultChannel: channel,
      members,
    };
  };

  const joinServer = async ({
    serverId,
    userId,
    authContext,
  }: JoinServerParams): Promise<ServerWithMembers> => {
    if (!serverId || !userId) {
      throw validationError("serverId y userId requeridos", {
        fields: ["serverId", "userId"],
      });
    }

    const server = await ensureServerExists(serverId);

    if (!server.members.some((m) => toStringId(m) === toStringId(userId))) {
      server.members.push(new mongoose.Types.ObjectId(userId));
      await server.save();
    }

    await server.populate("channels");

    const userMap = await getMembersMap(server.members, authContext);
    const members = hydrateMembers(server.members, userMap);

    return { server, members };
  };

  const listServersForMember = async ({
    userId,
    authContext,
  }: ListServersParams): Promise<ServerWithMembers[]> => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const servers = await ServerModel.find({ members: userId }).populate("channels");

    // Collect all member IDs from all servers
    const allMemberIds: Types.ObjectId[] = [];
    for (const server of servers) {
      allMemberIds.push(...server.members);
    }

    const userMap = await getMembersMap(allMemberIds, authContext);

    return servers.map((server) => ({
      server,
      members: hydrateMembers(server.members, userMap),
    }));
  };

  const removeMember = async ({
    serverId,
    memberId,
    requesterId,
    authContext,
  }: RemoveMemberParams): Promise<ServerWithMembers> => {
    if (!serverId || !memberId) {
      throw validationError("serverId y memberId requeridos", {
        fields: ["serverId", "memberId"],
      });
    }

    const server = await ensureServerExists(serverId);

    if (toStringId(server.owner) !== toStringId(requesterId)) {
      throw createHttpError(403, "Solo el dueño puede eliminar miembros", {
        code: "FORBIDDEN",
      });
    }

    server.members = server.members.filter(
      (m) => toStringId(m) !== toStringId(memberId)
    ) as Types.ObjectId[];

    await server.save();
    await server.populate("channels");

    const userMap = await getMembersMap(server.members, authContext);
    const members = hydrateMembers(server.members, userMap);

    return { server, members };
  };

  const leaveServer = async ({ serverId, userId }: LeaveServerParams): Promise<void> => {
    if (!serverId) {
      throw validationError("Se requiere el serverId", { field: "serverId" });
    }

    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const server = await ensureServerExists(serverId);

    if (toStringId(server.owner) === toStringId(userId)) {
      throw createHttpError(400, "El dueño no puede abandonar su servidor", {
        code: "INVALID_OPERATION",
      });
    }

    server.members = server.members.filter(
      (m) => toStringId(m) !== toStringId(userId)
    ) as Types.ObjectId[];

    await server.save();
  };

  const deleteServer = async ({ serverId }: DeleteServerParams): Promise<void> => {
    if (!serverId) {
      throw validationError("Se requiere el serverId", { field: "serverId" });
    }

    await ChannelModel.deleteMany({ server: serverId });
    await ServerModel.findByIdAndDelete(serverId);
  };

  return {
    createServer,
    joinServer,
    listServersForMember,
    removeMember,
    leaveServer,
    deleteServer,
  };
}

export const defaultServerService = createServerService();
