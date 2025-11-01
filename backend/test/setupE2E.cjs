const {
  startE2EServer: baseStartE2EServer,
  resetDatabase,
  stopE2EServer: baseStopE2EServer,
} = require("./helpers/e2eServer.js");

const snapshotEnv = () => new Map(Object.entries(process.env));

const restoreEnv = (snapshot) => {
  if (!snapshot) return;

  for (const key of Object.keys(process.env)) {
    if (!snapshot.has(key)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of snapshot.entries()) {
    process.env[key] = value;
  }
};

const setupE2ESuite = (options = {}) => {
  const state = {
    envSnapshot: null,
    started: false,
    context: null,
  };

  beforeAll(async () => {
    state.envSnapshot = snapshotEnv();
    state.context = await baseStartE2EServer(options);
    state.started = true;
  });

  beforeEach(async () => {
    if (state.started) {
      await resetDatabase();
    }
  });

  afterAll(async () => {
    if (state.started) {
      await baseStopE2EServer();
      state.started = false;
      state.context = null;
    }

    restoreEnv(state.envSnapshot);
    state.envSnapshot = null;
  });

  return {
    get app() {
      return state.context?.app;
    },
    get server() {
      return state.context?.server;
    },
    get port() {
      return state.context?.port;
    },
    get url() {
      return state.context?.url;
    },
  };
};

module.exports = {
  setupE2ESuite,
  startE2EServer: baseStartE2EServer,
  resetDatabase,
  stopE2EServer: baseStopE2EServer,
};
