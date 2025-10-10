const axios = require("axios");

console.log("[artillery] processor loaded");

async function httpRequest(context, options) {
  const {
    method = "GET",
    url,
    headers = {},
    json,
    body,
    ...rest
  } = options;

  if (!url) {
    throw new Error("httpRequest requires a url");
  }

  const config = {
    method,
    url,
    headers: { ...headers },
    validateStatus: () => true,
    ...rest,
  };

  if (json !== undefined) {
    config.data = json;
    if (
      !config.headers["Content-Type"] &&
      !config.headers["content-type"]
    ) {
      config.headers["Content-Type"] = "application/json";
    }
  } else if (body !== undefined) {
    config.data = body;
  }

  try {
    const response = await axios(config);
    return {
      res: { statusCode: response.status, headers: response.headers },
      body: response.data,
    };
  } catch (err) {
    throw err;
  }
}

async function ensureServerAndChannel(context, headers) {
  const listResponse = await httpRequest(context, {
    method: "GET",
    url: `${context.config.target}/api/servers`,
    headers,
  });

  const servers = Array.isArray(listResponse.body) ? listResponse.body : [];

  if (servers.length === 0) {
    const createResponse = await httpRequest(context, {
      method: "POST",
      url: `${context.config.target}/api/servers`,
      headers,
      json: {
        name: `Stress Server ${Date.now()}`,
        description: "Created by Artillery",
      },
    });

    if (createResponse.res.statusCode !== 201) {
      throw new Error(
        `Failed to create server: ${createResponse.res.statusCode}`
      );
    }

    const server = createResponse.body;
    const defaultChannel =
      server?.defaultChannel?._id ||
      server?.defaultChannel ||
      (Array.isArray(server?.channels) && server.channels[0]?._id) ||
      (Array.isArray(server?.channels) && server.channels[0]);

    return {
      serverId: server._id,
      channelId: normalizeId(defaultChannel),
    };
  }

  const server = servers[0];
  let channelId =
    (Array.isArray(server.channels) && server.channels[0]?._id) ||
    (Array.isArray(server.channels) && server.channels[0]) ||
    server.defaultChannel?._id ||
    server.defaultChannel;

  if (!channelId) {
    const channelResponse = await httpRequest(context, {
      method: "POST",
      url: `${context.config.target}/api/channels`,
      headers,
      json: {
        name: "general",
        serverId: server._id,
      },
    });

    if (channelResponse.res.statusCode !== 201) {
      throw new Error(
        `Failed to create channel: ${channelResponse.res.statusCode}`
      );
    }
    channelId = channelResponse.body._id;
  }

  return {
    serverId: server._id,
    channelId: normalizeId(channelId),
  };
}

function normalizeId(value) {
  if (!value) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value._id) {
    return value._id;
  }
  if (value.id) {
    return value.id;
  }
  return String(value);
}
let loggedFailures = 0;
let loggedSuccesses = 0;

async function login(context, events) {
  try {
    const email =
      process.env.STRESS_USER_EMAIL || "stressuser@example.com";
    const password =
      process.env.STRESS_USER_PASSWORD || "Passw0rd!";
    const username =
      process.env.STRESS_USER_USERNAME || "stressuser";

    let { res, body } = await httpRequest(context, {
      method: "POST",
      url: `${context.config.target}/api/auth/login`,
      json: { email, password },
    });

    if (res.statusCode !== 200) {
      await httpRequest(context, {
        method: "POST",
        url: `${context.config.target}/api/auth/register`,
        json: { username, email, password },
      }).catch(() => {});

      ({ res, body } = await httpRequest(context, {
        method: "POST",
        url: `${context.config.target}/api/auth/login`,
        json: { email, password },
      }));
    }

    if (res.statusCode !== 200 || !body || !body.token) {
      if (loggedFailures < 10) {
        console.error(
          `[artillery] login failed before throw status=${res.statusCode}`,
          body
        );
      }
      throw new Error(
        `Login failed with status ${res.statusCode}. Body: ${JSON.stringify(body)}`
      );
    }

    context.vars.token = body.token;
    context.vars.userId = body.user?._id || body.user?.id;
    context.vars.identity =
      context.vars.identity ||
      `stress-${Math.random().toString(36).slice(2, 10)}`;

    const authHeaders = {
      Authorization: `Bearer ${context.vars.token}`,
    };

    const { serverId, channelId } = await ensureServerAndChannel(
      context,
      authHeaders
    );
    context.vars.serverId = serverId;
    context.vars.channelId = channelId;

    if (loggedSuccesses < 5) {
      console.log(
        `[artillery] login success user=${context.vars.userId} server=${context.vars.serverId} channel=${context.vars.channelId}`
      );
      loggedSuccesses += 1;
    }

  } catch (err) {
    if (loggedFailures < 10) {
      console.error(
        "[artillery] login sequence failed:",
        err && err.message ? err.message : err
      );
      loggedFailures += 1;
    }
    throw err;
  }
}

module.exports = {
  login,
};
