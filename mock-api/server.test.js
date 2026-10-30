const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { test } = require("node:test");
const jsonServer = require("json-server");

test("proxies parsed quiz JSON and authentication to the authoritative backend", async () => {
  const backend = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    assert.ok(
      [
        "/quiz-sessions/session-1/answers",
        "/auth/login",
        "/api/dictionary/me/words",
      ].includes(req.url),
    );
    assert.equal(req.method, "POST");
    assert.equal(req.headers.authorization, "Bearer test-token");
    assert.deepEqual(JSON.parse(body), {
      questionId: "q1",
      selectedOptionIds: ["a"],
    });
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify({ isCorrect: true }));
  });
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  const previousTarget = process.env.MOCK_PROXY_TARGET;
  const address = backend.address();
  assert.ok(address && typeof address === "object");
  process.env.MOCK_PROXY_TARGET = `http://127.0.0.1:${address.port}`;
  const app = jsonServer.create();
  app.use(jsonServer.bodyParser);
  app.use(require("./server"));
  const proxy = app.listen(0, "127.0.0.1");
  await once(proxy, "listening");
  try {
    const proxyAddress = proxy.address();
    assert.ok(proxyAddress && typeof proxyAddress === "object");
    for (const path of [
      "/quiz-sessions/session-1/answers",
      "/auth/login",
      "/api/dictionary/me/words",
    ]) {
      const response = await fetch(
        `http://127.0.0.1:${proxyAddress.port}${path}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer test-token",
          },
          body: JSON.stringify({ questionId: "q1", selectedOptionIds: ["a"] }),
          signal: AbortSignal.timeout(5000),
        },
      );
      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), { isCorrect: true });
    }
  } finally {
    await Promise.all([
      new Promise((resolve) => proxy.close(resolve)),
      new Promise((resolve) => backend.close(resolve)),
    ]);
    if (previousTarget === undefined) delete process.env.MOCK_PROXY_TARGET;
    else process.env.MOCK_PROXY_TARGET = previousTarget;
  }
});
