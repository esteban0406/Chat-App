// src/services/channel/channel.controller.ts
import { Request, Response, NextFunction } from "express";
import { ok } from "../../utils/response.js";
import { defaultChannelService, ChannelService } from "./channel.service.js";

interface ChannelControllerDeps {
  channelService?: ChannelService;
}

export function createChannelController({
  channelService = defaultChannelService,
}: ChannelControllerDeps = {}) {
  if (!channelService) {
    throw new Error("channelService es requerido para crear el controlador de canales");
  }

  const createChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.createChannel({
        name: req.body?.name,
        type: req.body?.type,
        serverId: req.body?.serverId,
        requesterId: req.user!._id,
      });

      return ok(res, {
        status: 201,
        message: "Canal creado correctamente",
        data: { channel: channel.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getChannels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channels = await channelService.listChannelsForServer({
        serverId: req.params?.serverId,
        requesterId: req.user!._id,
      });

      return ok(res, {
        data: { channels: channels.map((c) => c.toJSON()) },
      });
    } catch (error) {
      return next(error);
    }
  };

  const updateChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.updateChannel({
        channelId: req.params?.channelId,
        name: req.body?.name,
        requesterId: req.user!._id,
      });

      return ok(res, {
        message: "Canal actualizado correctamente",
        data: { channel: channel.toJSON() },
      });
    } catch (error) {
      return next(error);
    }
  };

  const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await channelService.deleteChannel({
        channelId: req.params?.channelId,
      });

      return ok(res, {
        message: "Canal eliminado correctamente",
        data: { channelId: req.params?.channelId },
      });
    } catch (error) {
      return next(error);
    }
  };

  return {
    createChannel,
    getChannels,
    updateChannel,
    deleteChannel,
  };
}

export const channelController = createChannelController();

export const {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
} = channelController;

export default channelController;
