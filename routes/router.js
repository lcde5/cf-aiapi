import { jsonResponse, handleCORS } from "../utils/response.js";
import { verifyAuth } from "../auth/verify.js";
import { handleModels } from "../handlers/models.js";
import { handleChatCompletions } from "../handlers/chat.js";
import { handleEmbeddings } from "../handlers/embeddings.js";
import { handleAnthropicMessages } from "../handlers/anthropic.js";
import { handleUpstreamDebug } from "../handlers/debug.js";

export async function fetch(request, env) {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return handleCORS();
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Health check (no auth)
  if (path === "/health" && request.method === "GET") {
    return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
  }

  // Auth check
  const authError = verifyAuth(request, env);
  if (authError) return authError;

  // Route handling
  if (path === "/v1/models" && request.method === "GET") {
    return handleModels(env);
  }
  if (path === "/v1/chat/completions" && request.method === "POST") {
    return handleChatCompletions(request, env);
  }
  if (path === "/v1/embeddings" && request.method === "POST") {
    return handleEmbeddings(request, env);
  }
  if (path === "/v1/messages" && request.method === "POST") {
    return handleAnthropicMessages(request, env);
  }
  if (path === "/debug/upstream-test" && request.method === "GET") {
    return handleUpstreamDebug(request, env);
  }

  return jsonResponse({ error: { message: "Not found", type: "invalid_request_error" } }, 404);
}
