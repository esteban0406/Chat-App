import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let appRef;
let serverRef;
let serverPort;
let restoreEnv;

const captureEnv = () => {
  const snapshot = new Map(Object.entries(process.env));
  return () => {
    for (const key of Object.keys(process.env)) {
      if (!snapshot.has(key)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of snapshot.entries()) {
      process.env[key] = value;
    }
  };
};

export const startE2EServer = async ({
  extraRoutes,
  env = {},
  port = 0,
} = {}) => {
  if (serverRef) {
    throw new Error("E2E server already running. Call stopE2EServer first.");
  }

  if (!mongo) {
    restoreEnv = captureEnv();

    const binaryOptions = {};
    if (process.env.MONGOMS_SYSTEM_BINARY) {
      binaryOptions.systemBinary = process.env.MONGOMS_SYSTEM_BINARY;
    } else {
      const pinnedVersion =
        process.env.MONGOMS_VERSION || process.env.MONGODB_VERSION || "7.0.5";
      binaryOptions.version = pinnedVersion;
    }

    mongo = await MongoMemoryServer.create({
      binary: binaryOptions,
    });
  }

  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }

  const { createServer } = await import("../../src/server.js");
  const { app, server } = await createServer({ extraRoutes });

  await new Promise((resolve) => server.listen(port, resolve));

  const address = server.address();
  serverPort =
    typeof address === "object" && address
      ? address.port
      : typeof address === "string"
      ? Number(new URL(address).port)
      : port;

  appRef = app;
  serverRef = server;

  return {
    app: appRef,
    server: serverRef,
    port: serverPort,
    mongo,
    url: `http://127.0.0.1:${serverPort}`,
  };
};

export const resetDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
};

export const stopE2EServer = async () => {
  if (serverRef) {
    await new Promise((resolve) => serverRef.close(resolve));
    serverRef = undefined;
    appRef = undefined;
    serverPort = undefined;
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongo) {
    await mongo.stop();
    mongo = undefined;
  }

  if (restoreEnv) {
    restoreEnv();
    restoreEnv = undefined;
  }
};
