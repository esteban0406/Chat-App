import { ok } from "../../utils/response.js";
import { defaultChannelService } from "./channel.service.js";

export function createChannelController({ channelService = defaultChannelService } = {}) {
  if (!channelService) {
    throw new Error("channelService es requerido para crear el controlador de canales");
  }

  const createChannel = async (req, res, next) => {
    try {
      const channel = await channelService.createChannel({
        name: req.body?.name,
        type: req.body?.type,
        serverId: req.body?.serverId,
        requesterId: req.user?._id,
      });

      return ok(res, {
        status: 201,
        message: "Canal creado correctamente",
        data: { channel },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getChannels = async (req, res, next) => {
    try {
      const channels = await channelService.listChannelsForServer({
        serverId: req.params?.serverId,
        requesterId: req.user?._id,
      });

      return ok(res, {
        data: { channels },
      });
    } catch (error) {
      return next(error);
    }
  };

  const updateChannel = async (req, res, next) => {
    try {
      const channel = await channelService.updateChannel({
        channelId: req.params?.channelId,
        name: req.body?.name,
        requesterId: req.user?._id,
      });

      return ok(res, {
        message: "Canal actualizado correctamente",
        data: { channel },
      });
    } catch (error) {
      return next(error);
    }
  };

  const deleteChannel = async (req, res, next) => {
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
