import { jest } from "@jest/globals";
import registerChannelHandlers from "../../../sockets/channels.js";

describe("sockets/channels", () => {
  let socket;
  let events;

  beforeEach(() => {
    events = {};
    socket = {
      on: jest.fn((event, handler) => {
        events[event] = handler;
      }),
      join: jest.fn(),
      leave: jest.fn(),
    };
  });

  test("registra el handler joinChannel y une al socket al canal", () => {
    registerChannelHandlers({}, socket);

    expect(socket.on).toHaveBeenCalledWith("joinChannel", expect.any(Function));

    const channelId = "channel-123";
    events.joinChannel(channelId);

    expect(socket.join).toHaveBeenCalledWith(channelId);
  });

  test("registra el handler leaveChannel y saca al socket del canal", () => {
    registerChannelHandlers({}, socket);

    expect(socket.on).toHaveBeenCalledWith("leaveChannel", expect.any(Function));

    const channelId = "channel-456";
    events.leaveChannel(channelId);

    expect(socket.leave).toHaveBeenCalledWith(channelId);
  });
});
