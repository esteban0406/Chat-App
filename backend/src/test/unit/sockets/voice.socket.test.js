import { jest } from "@jest/globals";
import registerVoiceHandlers from "../../../sockets/voice.js";

describe("sockets/voice", () => {
  let socket;
  let io;
  let events;

  beforeEach(() => {
    events = {};
    socket = {
      id: "socket-123",
      on: jest.fn((event, handler) => {
        events[event] = handler;
      }),
      join: jest.fn(),
      leave: jest.fn(),
    };
    io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
  });

  test("maneja joinVoice y leaveVoice", () => {
    registerVoiceHandlers(io, socket);

    expect(socket.on).toHaveBeenCalledWith("joinVoice", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("leaveVoice", expect.any(Function));

    const channelId = "channel-voice";
    events.joinVoice(channelId);
    events.leaveVoice(channelId);

    expect(socket.join).toHaveBeenCalledWith(channelId);
    expect(socket.leave).toHaveBeenCalledWith(channelId);
  });

  test("reenvía offer hacia el destino correcto", () => {
    registerVoiceHandlers(io, socket);

    const payload = { to: "peer-1", offer: { sdp: "fake-offer" } };
    events.offer(payload);

    expect(io.to).toHaveBeenCalledWith("peer-1");
    expect(io.emit).toHaveBeenCalledWith("offer", {
      from: "socket-123",
      offer: payload.offer,
    });
  });

  test("reenvía answer hacia el destino correcto", () => {
    registerVoiceHandlers(io, socket);

    const payload = { to: "peer-2", answer: { sdp: "fake-answer" } };
    events.answer(payload);

    expect(io.to).toHaveBeenCalledWith("peer-2");
    expect(io.emit).toHaveBeenCalledWith("answer", {
      from: "socket-123",
      answer: payload.answer,
    });
  });

  test("reenvía candidate hacia el destino correcto", () => {
    registerVoiceHandlers(io, socket);

    const payload = { to: "peer-3", candidate: { candidate: "fake" } };
    events.candidate(payload);

    expect(io.to).toHaveBeenCalledWith("peer-3");
    expect(io.emit).toHaveBeenCalledWith("candidate", {
      from: "socket-123",
      candidate: payload.candidate,
    });
  });
});
