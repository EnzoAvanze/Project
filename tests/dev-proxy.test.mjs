import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { request } from "node:http";
import { createServer, loadConfigFromFile } from "vite";
import { createApp } from "../server/app.mjs";

// node:fetch replaces a custom Host header. Use HTTP directly to model the
// LAN address used by a phone while keeping the connection local to this test.
function send(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        resolve({
          status: res.statusCode,
          headers: {
            get: (name) => {
              const value = res.headers[name.toLowerCase()];
              return Array.isArray(value) ? value[0] : value;
            },
          },
          text: async () => body,
          json: async () => JSON.parse(body),
        });
      });
    });
    req.on("error", reject);
    req.end(options.body);
  });
}

test("proxy Vite aceita localhost e IP de celular, mantém sessão e bloqueia origens externas", async (t) => {
  const { app, db } = createApp({ dbPath: ":memory:" });
  const backend = app.listen(0, "127.0.0.1");
  await new Promise((r) => backend.once("listening", r));
  t.after(() => {
    backend.closeAllConnections();
    backend.close();
    db.close();
  });
  const backendUrl = `http://127.0.0.1:${backend.address().port}`;
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "test" },
    resolve("vite.config.ts"),
  );
  const configuredRule = loaded.config.server.proxy["/api"];
  // Exercise the repository's real proxy options; change only the ephemeral test target.
  const rule =
    typeof configuredRule === "string"
      ? backendUrl
      : { ...configuredRule, target: backendUrl };
  const vite = await createServer({
    ...loaded.config,
    configFile: false,
    appType: "custom",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
      ...loaded.config.server,
      host: "127.0.0.1",
      port: 0,
      hmr: false,
      watch: null,
      proxy: { "/api": rule },
    },
  });
  t.after(() => vite.close());
  await vite.listen();
  const port = vite.httpServer.address().port;
  const url = `http://127.0.0.1:${port}`;
  for (const host of [`localhost:${port}`, `192.168.1.50:${port}`]) {
    const headers = {
      Host: host,
      Origin: `http://${host}`,
      "Content-Type": "application/json",
    };
    const credentials = {
      name: "Teste acesso pelo celular",
      email: `${randomUUID()}@example.test`,
      phone: "11999999999",
      birth_date: "1950-01-01",
      password: "SenhaSegura123!",
      role: "elder",
      consent: true,
    };
    const registered = await send(url + "/api/auth/register", {
      method: "POST",
      headers,
      body: JSON.stringify(credentials),
    });
    assert.equal(registered.status, 201, `${host}: ${await registered.text()}`);
    const cookie = registered.headers.get("set-cookie").split(";")[0];
    assert.match(cookie, /^cuidali_session=/);
    const state = await send(url + "/api/state", {
      headers: { Host: host, Cookie: cookie },
    });
    assert.equal(state.status, 200);
    assert.equal((await state.json()).patient.name, credentials.name);
    const loggedOut = await send(url + "/api/auth/logout", {
      method: "POST",
      headers: { ...headers, Cookie: cookie },
      body: "{}",
    });
    assert.equal(loggedOut.status, 200);
    const login = await send(url + "/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify(credentials),
    });
    assert.equal(login.status, 200);
    for (const origin of [
      "https://malicioso.example",
      `http://192.168.1.51:${port}`,
      `http://localhost:${port + 1}`,
      "null",
    ]) {
      const blocked = await send(url + "/api/auth/demo", {
        method: "POST",
        headers: { ...headers, Origin: origin },
        body: "{}",
      });
      assert.equal(
        blocked.status,
        403,
        `Não deve aceitar ${origin} no host ${host}`,
      );
    }
  }
});
