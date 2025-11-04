import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const ServerInviteMock = jest.fn();
ServerInviteMock.findOne = jest.fn();
ServerInviteMock.findById = jest.fn();
ServerInviteMock.find = jest.fn();

const ServerMock = {
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../../models/serverInvite.js", () => ({
  __esModule: true,
  default: ServerInviteMock,
}));

jest.unstable_mockModule("../../../services/server/Server.model.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

const {
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
} = await import("../../../controllers/serverInvite.controller.js");

const createInviteDoc = (overrides = {}) => {
  const doc = {
    _id: "invite123",
    from: "user123",
    to: "user456",
    server: "server123",
    status: "pending",
    save: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(doc, overrides);

  doc.toObject =
    overrides.toObject ??
    jest.fn(() => ({
      _id: doc._id,
      from: doc.from,
      to: doc.to,
      server: doc.server,
      status: doc.status,
    }));

  return doc;
};

const createPopulateQuery = (result) => {
  const query = {
    populate: jest.fn(),
  };
  query.populate.mockImplementation(() => query);
  query.populate.mockReturnValue(query);
  query.populate.mockImplementationOnce(() => query);
  query.populate.mockImplementation(() => query);
  query.populate.mockImplementation((path) => {
    if (path === "from" || path === "server") {
      return query;
    }
    return Promise.resolve(result);
  });
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
};

describe("serverInvite.controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
    ServerInviteMock.mockReset();
    ServerInviteMock.findOne.mockReset();
    ServerInviteMock.findById.mockReset();
    ServerInviteMock.find.mockReset();
    ServerMock.findByIdAndUpdate.mockReset();
  });

  describe("sendServerInvite", () => {
    test("retorna 409 cuando ya existe una invitación pendiente", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInviteMock.findOne.mockResolvedValue(createInviteDoc());

      await sendServerInvite(req, res, next);

      expect(ServerInviteMock.findOne).toHaveBeenCalledWith({
        from: "user123",
        to: "user456",
        server: "server123",
        status: "pending",
      });
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(409);
      expect(error.code).toBe("INVITE_EXISTS");
      expect(error.message).toBe("Ya existe una invitación pendiente a este usuario para este servidor");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea una invitación nueva y responde con 201", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInviteMock.findOne.mockResolvedValue(null);

      const inviteDoc = createInviteDoc();
      ServerInviteMock.mockImplementation(() => inviteDoc);

      await sendServerInvite(req, res, next);

      expect(ServerInviteMock).toHaveBeenCalledWith({
        from: "user123",
        to: "user456",
        server: "server123",
      });
      expect(inviteDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación enviada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "pending",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 409 cuando el guardado falla por clave duplicada", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInviteMock.findOne.mockResolvedValue(null);

      const duplicateError = { code: 11000 };
      const inviteDoc = createInviteDoc({
        save: jest.fn().mockRejectedValue(duplicateError),
      });
      ServerInviteMock.mockImplementation(() => inviteDoc);

      await sendServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(409);
      expect(error.code).toBe("INVITE_EXISTS");
      expect(error.message).toBe("Invitación duplicada no permitida");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve 500 ante un error inesperado", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInviteMock.findOne.mockResolvedValue(null);

      const unexpectedError = new Error("DB down");
      const inviteDoc = createInviteDoc({
        save: jest.fn().mockRejectedValue(unexpectedError),
      });
      ServerInviteMock.mockImplementation(() => inviteDoc);

      await sendServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("acceptServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };
      ServerInviteMock.findById.mockResolvedValue(null);

      await acceptServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("INVITE_NOT_FOUND");
      expect(error.message).toBe("Invitación no encontrada");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("acepta la invitación y agrega al miembro", async () => {
      req.params = { inviteId: "invite123" };
      const inviteDoc = createInviteDoc();
      ServerInviteMock.findById.mockResolvedValue(inviteDoc);

      await acceptServerInvite(req, res, next);

      expect(inviteDoc.status).toBe("accepted");
      expect(inviteDoc.save).toHaveBeenCalled();
      expect(ServerMock.findByIdAndUpdate).toHaveBeenCalledWith("server123", {
        $addToSet: { members: "user456" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación aceptada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "accepted",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };
      const unexpectedError = new Error("lookup failed");
      ServerInviteMock.findById.mockRejectedValue(unexpectedError);

      await acceptServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("rejectServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };
      ServerInviteMock.findById.mockResolvedValue(null);

      await rejectServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("INVITE_NOT_FOUND");
      expect(error.message).toBe("Invitación no encontrada");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("rechaza la invitación sin tocar el servidor", async () => {
      req.params = { inviteId: "invite123" };
      const inviteDoc = createInviteDoc();
      ServerInviteMock.findById.mockResolvedValue(inviteDoc);

      await rejectServerInvite(req, res, next);

      expect(inviteDoc.status).toBe("rejected");
      expect(inviteDoc.save).toHaveBeenCalled();
      expect(ServerMock.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación rechazada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "rejected",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };
      const unexpectedError = new Error("lookup failed");
      ServerInviteMock.findById.mockRejectedValue(unexpectedError);

      await rejectServerInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getPendingServerInvites", () => {
    test("retorna solo invitaciones con servidor válido", async () => {
      const invites = [
        createInviteDoc({
          _id: "invite1",
          server: {
            _id: "server123",
            name: "Server",
            toObject: () => ({ _id: "server123", name: "Server" }),
          },
          from: {
            _id: "user123",
            username: "Alice",
            email: "alice@example.com",
            toObject: () => ({ _id: "user123", username: "Alice", email: "alice@example.com" }),
          },
          toObject: jest.fn(() => ({
            _id: "invite1",
            from: {
              _id: "user123",
              username: "Alice",
              email: "alice@example.com",
            },
            to: "user456",
            server: {
              _id: "server123",
              name: "Server",
            },
            status: "pending",
          })),
        }),
        createInviteDoc({
          _id: "invite2",
          server: null,
          toObject: jest.fn(() => ({
            _id: "invite2",
            from: "user123",
            to: "user456",
            server: null,
            status: "pending",
          })),
        }),
      ];
      ServerInviteMock.find.mockReturnValue(createPopulateQuery(invites));

      await getPendingServerInvites(req, res, next);

      expect(ServerInviteMock.find).toHaveBeenCalledWith({
        to: "user123",
        status: "pending",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          invites: [
            {
              id: "invite1",
              from: {
                id: "user123",
                username: "Alice",
                email: "alice@example.com",
              },
              to: "user456",
              server: {
                id: "server123",
                name: "Server",
              },
              status: "pending",
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al buscar", async () => {
      const unexpectedError = new Error("query failed");
      ServerInviteMock.find.mockImplementation(() => {
        throw unexpectedError;
      });

      await getPendingServerInvites(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
