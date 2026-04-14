import { jsonResponse } from "../utils/response.js";
import { getModelConfig } from "../providers/parser.js";

export async function handleChatCompletions(request, env) {
  try {
    const body = await request.json();
    const model = body.model;
    if (!model) {
      return jsonResponse({ error: { message: "Missing required parameter: model", type: "invalid_request_error" } }, 400);
    }
    const config = getModelConfig(model, env);
    if (!config) {
      return jsonResponse({ error: { message: `Model '${model}' not found in configuration`, type: "invalid_request_error" } }, 404);
    }
    const upstreamURL = `${config.baseURL}/chat/completions`;
    const upstreamResponse = await fetch(upstreamURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (body.stream) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const data = await upstreamResponse.json();
    return jsonResponse(data, upstreamResponse.status);
  } catch (e) {
    return jsonResponse({ error: { message: e.message, type: "server_error" } }, 500);
  }
}
