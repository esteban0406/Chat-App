import { jest } from "@jest/globals";
import { HttpError, createHttpError, validationError } from "../../../src/utils/httpError.js";

const SELF_ID = "507f191e810c19729de860ea";
const OTHER_ID = "507f191e810c19729de860eb";
const THIRD_ID = "507f191e810c19729de860ec";

// Create mock service
const mockFriendRequestService = {
  sendFriendRequest: jest.fn(),
  respondFriendRequest: jest.fn(),
  listPendingFriendRequests: jest.fn(),
  listFriends: jest.fn(),
};

// Mock the service module
jest.unstable_mockModule("../../../src/services/user/friendRequest/friendRequest.service.js", () => ({
  __esModule: true,
  createFriendRequestService: jest.fn(() => mockFriendRequestService),
  defaultFriendRequestService: mockFriendRequestService,
}));

const { createFriendRequestController } = await import(
  "../../../src/services/user/friendRequest/friendRequest.controller.js"
);

const createRequestDoc = (overrides = {}) => {
  const doc = {
    _id: "req1",
    from: SELF_ID,
    to: OTHER_ID,
    status: "pending",
    createdAt: new Date("2025-10-31T23:07:04.791Z"),
    toJSON: jest.fn(() => ({
      id: doc._id,
      from: doc.from,
      to: doc.to,
      status: doc.status,
      createdAt: doc.createdAt,
    })),
  };

  Object.assign(doc, overrides);
  if (overrides.toJSON) {
    doc.toJSON = overrides.toJSON;
  } else {
    doc.toJSON = jest.fn(() => ({
      id: doc._id,
      from: doc.from,
      to: doc.to,
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  }

  return doc;
};

describe("friend.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createFriendRequestController({
      friendRequestService: mockFriendRequestService,
    });
    req = { body: {}, params: {}, user: { _id: SELF_ID }, authContext: { headers: {} } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("sendFriendRequest", () => {
    test("retorna 400 si falta el destinatario", async () => {
      req.body = {};

      const error = validationError("Falta el usuario destinatario (to)");
      mockFriendRequestService.sendFriendRequest.mockRejectedValue(error);

      await controller.sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.message).toBe("Falta el usuario destinatario (to)");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 400 si el usuario intenta enviarse a sí mismo", async () => {
      req.body = { to: req.user._id };

      const error = createHttpError(400, "No puedes enviarte una solicitud a ti mismo", { code: "INVALID_OPERATION" });
      mockFriendRequestService.sendFriendRequest.mockRejectedValue(error);

      await controller.sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.message).toBe("No puedes enviarte una solicitud a ti mismo");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 409 si ya existe una solicitud pendiente", async () => {
      req.body = { to: OTHER_ID };

      const error = createHttpError(409, "Ya enviaste una solicitud a este usuario", { code: "REQUEST_EXISTS" });
      mockFriendRequestService.sendFriendRequest.mockRejectedValue(error);

      await controller.sendFriendRequest(req, res, next);

      expect(mockFriendRequestService.sendFriendRequest).toHaveBeenCalledWith({
        fromUserId: SELF_ID,
        toUserId: OTHER_ID,
        authContext: req.authContext,
      });
      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(409);
      expect(receivedError.message).toBe("Ya enviaste una solicitud a este usuario");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea la solicitud cuando no existe", async () => {
      req.body = { to: OTHER_ID };

      const requestDoc = createRequestDoc();
      mockFriendRequestService.sendFriendRequest.mockResolvedValue(requestDoc);

      await controller.sendFriendRequest(req, res, next);

      expect(mockFriendRequestService.sendFriendRequest).toHaveBeenCalledWith({
        fromUserId: SELF_ID,
        toUserId: OTHER_ID,
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitud enviada",
        data: {
          request: {
            id: "req1",
            from: SELF_ID,
            to: OTHER_ID,
            status: "pending",
            createdAt: expect.any(Date),
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { to: OTHER_ID };
      const error = new Error("save failed");
      mockFriendRequestService.sendFriendRequest.mockRejectedValue(error);

      await controller.sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("respondFriendRequest", () => {
    test("retorna 404 si la solicitud no existe", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };

      const error = createHttpError(404, "Solicitud no encontrada", { code: "REQUEST_NOT_FOUND" });
      mockFriendRequestService.respondFriendRequest.mockRejectedValue(error);

      await controller.respondFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.message).toBe("Solicitud no encontrada");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("actualiza la solicitud y agrega amigos cuando se acepta", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };

      const requestDoc = createRequestDoc({ status: "accepted" });
      mockFriendRequestService.respondFriendRequest.mockResolvedValue(requestDoc);

      await controller.respondFriendRequest(req, res, next);

      expect(mockFriendRequestService.respondFriendRequest).toHaveBeenCalledWith({
        requestId: "request123",
        status: "accepted",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitud accepted",
        data: {
          request: {
            id: "req1",
            from: SELF_ID,
            to: OTHER_ID,
            status: "accepted",
            createdAt: expect.any(Date),
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("actualiza la solicitud sin agregar amigos cuando se rechaza", async () => {
      req.params = { id: "request123" };
      req.body = { status: "rejected" };

      const requestDoc = createRequestDoc({ status: "rejected" });
      mockFriendRequestService.respondFriendRequest.mockResolvedValue(requestDoc);

      await controller.respondFriendRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitud rejected",
        data: {
          request: {
            id: "req1",
            from: SELF_ID,
            to: OTHER_ID,
            status: "rejected",
            createdAt: expect.any(Date),
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      const error = new Error("lookup failed");
      mockFriendRequestService.respondFriendRequest.mockRejectedValue(error);

      await controller.respondFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getPendingFriendRequests", () => {
    test("retorna solicitudes formateadas", async () => {
      const createdAt = new Date("2025-10-31T23:07:04.791Z");
      const requestDoc = createRequestDoc({
        _id: "req1",
        from: "user123",
        to: SELF_ID,
        createdAt,
      });
      const fromUser = { id: "user123", username: "User", email: "user@example.com" };

      mockFriendRequestService.listPendingFriendRequests.mockResolvedValue([
        { request: requestDoc, fromUser },
      ]);

      await controller.getPendingFriendRequests(req, res, next);

      expect(mockFriendRequestService.listPendingFriendRequests).toHaveBeenCalledWith({
        userId: SELF_ID,
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          requests: [
            {
              id: "req1",
              from: {
                id: "user123",
                username: "User",
                email: "user@example.com",
              },
              to: SELF_ID,
              type: "friend",
              status: "pending",
              createdAt,
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      const error = new Error("lookup failed");
      mockFriendRequestService.listPendingFriendRequests.mockRejectedValue(error);

      await controller.getPendingFriendRequests(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getFriends", () => {
    test("retorna usuarios amigos", async () => {
      const friends = [
        { id: OTHER_ID, username: "Friend1", email: "friend1@example.com" },
        { id: THIRD_ID, username: "Friend2", email: "friend2@example.com" },
      ];

      mockFriendRequestService.listFriends.mockResolvedValue(friends);

      await controller.getFriends(req, res, next);

      expect(mockFriendRequestService.listFriends).toHaveBeenCalledWith({
        userId: SELF_ID,
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          friends: [
            {
              id: OTHER_ID,
              username: "Friend1",
              email: "friend1@example.com",
            },
            {
              id: THIRD_ID,
              username: "Friend2",
              email: "friend2@example.com",
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      const error = new Error("lookup failed");
      mockFriendRequestService.listFriends.mockRejectedValue(error);

      await controller.getFriends(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
