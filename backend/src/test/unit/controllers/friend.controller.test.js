import { jest } from "@jest/globals";

const FriendRequestMock = jest.fn();
FriendRequestMock.findOne = jest.fn();
FriendRequestMock.findById = jest.fn();
FriendRequestMock.find = jest.fn();

const UserMock = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
};

jest.unstable_mockModule("../../../models/friendRequest.js", () => ({
  __esModule: true,
  default: FriendRequestMock,
}));

jest.unstable_mockModule("../../../models/User.js", () => ({
  __esModule: true,
  default: UserMock,
}));

const {
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} = await import("../../../controllers/friend.controller.js");

const SELF_ID = "507f191e810c19729de860ea";
const OTHER_ID = "507f191e810c19729de860eb";
const THIRD_ID = "507f191e810c19729de860ec";

const createPopulateQuery = (result) => {
  const query = {
    populate: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  query.populate.mockImplementation(() => query);
  query.then = (resolve, reject) => query.exec().then(resolve, reject);
  return query;
};

describe("friend.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: SELF_ID } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    UserMock.findById.mockResolvedValue({ _id: OTHER_ID });
  });

  describe("sendFriendRequest", () => {
    test("retorna 400 si falta el destinatario", async () => {
      req.body = {};

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Falta el usuario destinatario (to)",
      });
    });

    test("retorna 400 si el usuario intenta enviarse a sí mismo", async () => {
      req.body = { to: req.user._id };

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "No puedes enviarte una solicitud a ti mismo",
      });
    });

    test("retorna 400 si ya existe una solicitud pendiente", async () => {
      req.body = { to: OTHER_ID };
      FriendRequestMock.findOne.mockResolvedValue({ _id: "request123" });

      await sendFriendRequest(req, res);

      expect(FriendRequestMock.findOne).toHaveBeenCalledWith({
        from: SELF_ID,
        to: OTHER_ID,
        status: "pending",
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ya enviaste una solicitud a este usuario",
      });
    });

    test("crea la solicitud cuando no existe", async () => {
      req.body = { to: OTHER_ID };
      FriendRequestMock.findOne.mockResolvedValue(null);
      const requestInstance = {
        save: jest.fn().mockResolvedValue(true),
      };
      FriendRequestMock.mockImplementation(() => requestInstance);

      await sendFriendRequest(req, res);

      expect(FriendRequestMock).toHaveBeenCalledWith({
        from: SELF_ID,
        to: OTHER_ID,
        status: "pending",
      });
      expect(requestInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(requestInstance);
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { to: OTHER_ID };
      const error = new Error("save failed");
      FriendRequestMock.findOne.mockResolvedValue(null);
      FriendRequestMock.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("respondFriendRequest", () => {
    test("retorna 404 si la solicitud no existe", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      FriendRequestMock.findById.mockResolvedValue(null);

      await respondFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Solicitud no encontrada" });
    });

    test("actualiza la solicitud y agrega amigos cuando se acepta", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      const request = {
        from: SELF_ID,
        to: OTHER_ID,
        save: jest.fn().mockResolvedValue(true),
      };
      FriendRequestMock.findById.mockResolvedValue(request);

      await respondFriendRequest(req, res);

      expect(request.status).toBe("accepted");
      expect(request.save).toHaveBeenCalled();
      expect(UserMock.findByIdAndUpdate).toHaveBeenNthCalledWith(1, SELF_ID, {
        $addToSet: { friends: OTHER_ID },
      });
      expect(UserMock.findByIdAndUpdate).toHaveBeenNthCalledWith(2, OTHER_ID, {
        $addToSet: { friends: SELF_ID },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Solicitud accepted",
        request,
      });
    });

    test("actualiza la solicitud sin agregar amigos cuando se rechaza", async () => {
      req.params = { id: "request123" };
      req.body = { status: "rejected" };
      const request = {
        from: SELF_ID,
        to: OTHER_ID,
        save: jest.fn().mockResolvedValue(true),
      };
      FriendRequestMock.findById.mockResolvedValue(request);

      await respondFriendRequest(req, res);

      expect(request.status).toBe("rejected");
      expect(UserMock.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Solicitud rejected",
        request,
      });
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { id: "request123" };
      req.body = { status: "accepted" };
      const error = new Error("lookup failed");
      FriendRequestMock.findById.mockRejectedValue(error);

      await respondFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getPendingFriendRequests", () => {
    test("retorna solicitudes formateadas", async () => {
      const requests = [
        {
          _id: "req1",
          from: { _id: "user123", username: "User", email: "user@example.com" },
          status: "pending",
          createdAt: new Date(),
        },
      ];
      FriendRequestMock.find.mockReturnValue(createPopulateQuery(requests));

      await getPendingFriendRequests(req, res);

      expect(FriendRequestMock.find).toHaveBeenCalledWith({
        to: SELF_ID,
        status: "pending",
      });
      expect(res.json).toHaveBeenCalledWith([
        {
          _id: "req1",
          from: requests[0].from,
          type: "friend",
          status: "pending",
          createdAt: requests[0].createdAt,
        },
      ]);
    });

    test("retorna 500 cuando ocurre un error", async () => {
      const error = new Error("lookup failed");
      FriendRequestMock.find.mockImplementation(() => {
        throw error;
      });

      await getPendingFriendRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getFriends", () => {
    test("retorna usuarios amigos", async () => {
      const friendRequests = [
        { from: SELF_ID, to: OTHER_ID },
        { from: THIRD_ID, to: SELF_ID },
      ];
      FriendRequestMock.find.mockResolvedValue(friendRequests);
      const friends = [
        { _id: OTHER_ID, username: "Friend1" },
        { _id: THIRD_ID, username: "Friend2" },
      ];
      const selectMock = jest.fn().mockResolvedValue(friends);
      UserMock.find.mockReturnValue({ select: selectMock });

      await getFriends(req, res);

      expect(FriendRequestMock.find).toHaveBeenCalledWith({
        status: "accepted",
        $or: [{ from: SELF_ID }, { to: SELF_ID }],
      });
      expect(UserMock.find).toHaveBeenCalledWith({
        _id: { $in: [OTHER_ID, THIRD_ID] },
      });
      expect(selectMock).toHaveBeenCalledWith("username email");
      expect(res.json).toHaveBeenCalledWith(friends);
    });

    test("retorna 500 cuando ocurre un error", async () => {
      const error = new Error("lookup failed");
      FriendRequestMock.find.mockRejectedValue(error);

      await getFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
