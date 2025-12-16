import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const FriendRequestMock = jest.fn();
FriendRequestMock.findOne = jest.fn();
FriendRequestMock.findById = jest.fn();
FriendRequestMock.find = jest.fn();

const findUserByIdMock = jest.fn();
const betterAuthContext = {
  internalAdapter: {
    findUserById: findUserByIdMock,
  },
};
const getBetterAuthMock = jest.fn().mockResolvedValue({
  auth: {
    $context: Promise.resolve(betterAuthContext),
  },
});

jest.unstable_mockModule("../../../services/user/friendRequest/FriendRequest.model.js", () => ({
  __esModule: true,
  default: FriendRequestMock,
}));

jest.unstable_mockModule("../../../auth/betterAuth.js", () => ({
  __esModule: true,
  getBetterAuth: getBetterAuthMock,
}));

const {
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} = await import("../../../services/user/friendRequest/friendRequest.controller.js");

const SELF_ID = "507f191e810c19729de860ea";
const OTHER_ID = "507f191e810c19729de860eb";
const THIRD_ID = "507f191e810c19729de860ec";

const createRequestDoc = (overrides = {}) => {
  const doc = {
    _id: "req1",
    from: SELF_ID,
    to: OTHER_ID,
    status: "pending",
    save: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(doc, overrides);

  if (!overrides.toObject) {
    doc.toObject = jest.fn(() => ({
      _id: doc._id,
      from: doc.from,
      to: doc.to,
      status: doc.status,
    }));
  }

  return doc;
};

describe("friend.controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: SELF_ID } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    FriendRequestMock.mockReset();
    FriendRequestMock.findOne.mockReset();
    FriendRequestMock.findById.mockReset();
    FriendRequestMock.find.mockReset();

    findUserByIdMock.mockReset();
    findUserByIdMock.mockImplementation((id) => ({
      id,
      username: `user-${id}`,
      email: `${id}@mail.com`,
    }));
  });

  describe("sendFriendRequest", () => {
    test("retorna 400 si falta el destinatario", async () => {
      req.body = {};

      await sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.message).toBe("Falta el usuario destinatario (to)");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 400 si el usuario intenta enviarse a sí mismo", async () => {
      req.body = { to: req.user._id };

      await sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.message).toBe("No puedes enviarte una solicitud a ti mismo");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 409 si ya existe una solicitud pendiente", async () => {
      req.body = { to: OTHER_ID };
      FriendRequestMock.findOne.mockResolvedValue({ _id: "request123" });

      await sendFriendRequest(req, res, next);

      expect(FriendRequestMock.findOne).toHaveBeenCalledWith({
        from: SELF_ID,
        to: OTHER_ID,
        status: "pending",
      });
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(409);
      expect(error.message).toBe("Ya enviaste una solicitud a este usuario");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea la solicitud cuando no existe", async () => {
      req.body = { to: OTHER_ID };
      FriendRequestMock.findOne.mockResolvedValue(null);
      const requestInstance = createRequestDoc();
      FriendRequestMock.mockImplementation(() => requestInstance);

      await sendFriendRequest(req, res, next);

      expect(FriendRequestMock).toHaveBeenCalledWith({
        from: SELF_ID,
        to: OTHER_ID,
        status: "pending",
      });
      expect(requestInstance.save).toHaveBeenCalled();
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
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { to: OTHER_ID };
      const error = new Error("save failed");
      FriendRequestMock.findOne.mockResolvedValue(null);
      FriendRequestMock.mockImplementation(() => ({
        toObject: jest.fn(() => ({
          _id: "req1",
          from: SELF_ID,
          to: OTHER_ID,
          status: "pending",
        })),
        save: jest.fn().mockRejectedValue(error),
      }));

      await sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("respondFriendRequest", () => {
    test("retorna 404 si la solicitud no existe", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      FriendRequestMock.findById.mockResolvedValue(null);

      await respondFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.message).toBe("Solicitud no encontrada");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("actualiza la solicitud y agrega amigos cuando se acepta", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      const request = createRequestDoc();
      FriendRequestMock.findById.mockResolvedValue(request);

      await respondFriendRequest(req, res, next);

      expect(request.status).toBe("accepted");
      expect(request.save).toHaveBeenCalled();
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
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("actualiza la solicitud sin agregar amigos cuando se rechaza", async () => {
      req.params = { id: "request123" };
      req.body = { status: "rejected" };
      const request = createRequestDoc();
      FriendRequestMock.findById.mockResolvedValue(request);

      await respondFriendRequest(req, res, next);

      expect(request.status).toBe("rejected");
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
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      const error = new Error("lookup failed");
      FriendRequestMock.findById.mockRejectedValue(error);

      await respondFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getPendingFriendRequests", () => {
    test("retorna solicitudes formateadas", async () => {
      const createdAt = new Date("2025-10-31T23:07:04.791Z");
      const requests = [
        {
          _id: "req1",
          from: { _id: "user123", username: "User", email: "user@example.com" },
          status: "pending",
          createdAt,
        },
      ];
      FriendRequestMock.find.mockResolvedValue(requests);
      findUserByIdMock.mockImplementation((id) => {
        if (id === "user123") {
          return {
            id: "user123",
            username: "User",
            email: "user@example.com",
          };
        }
        return null;
      });

      await getPendingFriendRequests(req, res, next);

      expect(FriendRequestMock.find).toHaveBeenCalledWith({
        to: SELF_ID,
        status: "pending",
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
      FriendRequestMock.find.mockImplementation(() => {
        throw error;
      });

      await getPendingFriendRequests(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getFriends", () => {
    test("retorna usuarios amigos", async () => {
      const friendRequests = [
        { from: SELF_ID, to: OTHER_ID },
        { from: THIRD_ID, to: SELF_ID },
      ];
      FriendRequestMock.find.mockResolvedValue(friendRequests);
      findUserByIdMock.mockImplementation((id) => {
        if (id === OTHER_ID) {
          return { id: OTHER_ID, username: "Friend1", email: "friend1@example.com" };
        }
        if (id === THIRD_ID) {
          return { id: THIRD_ID, username: "Friend2", email: "friend2@example.com" };
        }
        return null;
      });

      await getFriends(req, res, next);

      expect(FriendRequestMock.find).toHaveBeenCalledWith({
        status: "accepted",
        $or: [{ from: SELF_ID }, { to: SELF_ID }],
      });
      expect(findUserByIdMock).toHaveBeenCalledWith(OTHER_ID);
      expect(findUserByIdMock).toHaveBeenCalledWith(THIRD_ID);
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
      FriendRequestMock.find.mockRejectedValue(error);

      await getFriends(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
