const http = require("http");
const https = require("https");
const { URL } = require("url");

const backendBaseUrl = process.env.MOCK_PROXY_TARGET ?? "http://localhost:3000";
const backendUrl = new URL(backendBaseUrl);
const transport = backendUrl.protocol === "https:" ? https : http;

function buildMockArticleDetail(id) {
  const articleId = Number(id) || 1001;
  const title = "Mock Learning Article";
  const content =
    "The sun gives light. People read books and drink water in a quiet city.";

  return {
    blocks: [
      {
        level: 1,
        text: title,
        type: "heading",
      },
      {
        children: [
          {
            text: content,
            type: "text",
          },
        ],
        type: "paragraph",
      },
    ],
    content,
    id: articleId,
    title,
    url: `https://example.test/articles/${articleId}`,
  };
}

function buildMockArticleQuiz() {
  return {
    questions: [
      {
        correctOptionIds: ["light"],
        explanation: "The text says the sun gives light.",
        id: "mock-article-question-1",
        options: [
          { id: "light", text: "It gives light." },
          { id: "rain", text: "It makes rain." },
          { id: "books", text: "It writes books." },
        ],
        prompt: "What does the sun give?",
        type: "single_choice",
      },
    ],
  };
}

function pipeToBackend(req, res) {
  // json-server has already consumed JSON request streams before this middleware.
  const body = req.body === undefined ? undefined : JSON.stringify(req.body);
  const headers = { ...req.headers, host: backendUrl.host };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(body);
    delete headers["transfer-encoding"];
  }
  const options = {
    headers,
    hostname: backendUrl.hostname,
    method: req.method,
    path: `${req.originalUrl}`,
    port: backendUrl.port || (backendUrl.protocol === "https:" ? 443 : 80),
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 502);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        res.setHeader(key, value);
      }
    });
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    res.status(502).jsonp({
      message: "The local backend is unavailable.",
    });
  });

  if (body !== undefined) proxyReq.end(body);
  else req.pipe(proxyReq);
}

module.exports = (req, res) => {
  const method = req.method.toUpperCase();
  const articleDetailMatch = req.path.match(/^\/articles\/([^/]+)$/);
  // One authoritative owner/session/reward implementation in development too.
  if (
    req.path.startsWith("/quiz-sessions/") ||
    req.path.startsWith("/api/dictionary/me/") ||
    req.path.startsWith("/achievements/") ||
    req.path.startsWith("/streak/") ||
    req.path === "/api/articles/quiz" ||
    req.path === "/api/articles/vocabulary-quiz"
  ) {
    pipeToBackend(req, res);
    return;
  }
  if (method === "GET" && req.path === "/articles") {
    res.jsonp([
      {
        availableAdaptations: [],
        extract:
          "A short mock article for testing quiz completion and banner ordering.",
        id: 1001,
        pageLength: 320,
        title: "Mock Learning Article",
        url: "https://example.test/articles/1001",
      },
    ]);
    return;
  }

  if (method === "GET" && articleDetailMatch) {
    res.jsonp(buildMockArticleDetail(articleDetailMatch[1]));
    return;
  }

  if (method === "GET" && req.path === "/api/articles/adaptations") {
    res.jsonp({});
    return;
  }

  if (method === "POST" && req.path === "/api/articles/simplify") {
    const article = buildMockArticleDetail(req.body?.articleId ?? 1001);
    const transformationType = req.body?.transformationType ?? "adaptation";

    res.jsonp({
      adaptedBlocks: article.blocks,
      adaptedLength: article.content.length,
      level: req.body?.level ?? "A2",
      originalLength: req.body?.text?.length ?? article.content.length,
      questions: buildMockArticleQuiz().questions,
      title: article.title,
      transformationType,
    });
    return;
  }

  pipeToBackend(req, res);
};
