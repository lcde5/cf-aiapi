import { jsonResponse } from "../utils/response.js";
import { getModelConfig } from "../providers/parser.js";

function maskApiKey(apiKey) {
  if (!apiKey) return null;
  if (apiKey.length <= 8) return "***";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export async function handleUpstreamDebug(request, env) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model") || "gpt-5.4-pro";
  const prompt = url.searchParams.get("prompt") || "Hello, how are you?";

  const config = getModelConfig(model, env);
  if (!config) {
    return jsonResponse({ error: { message: `Model '${model}' not found in configuration`, type: "invalid_request_error" } }, 404);
  }

  const upstreamURL = `${config.baseURL}/chat/completions`;
  const upstreamBody = {
    model,
    messages: [{ role: "user", content: prompt }]
  };
  const upstreamHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiKey}`
  };

  try {
    const upstreamResponse = await fetch(upstreamURL, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody)
    });

    const responseText = await upstreamResponse.text();

    return jsonResponse({
      request: {
        upstreamURL,
        method: "POST",
        headers: {
          "Content-Type": upstreamHeaders["Content-Type"],
          "Authorization": `Bearer ${maskApiKey(config.apiKey)}`
        },
        body: upstreamBody
      },
      response: {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: Object.fromEntries(upstreamResponse.headers.entries()),
        bodyPreview: responseText.slice(0, 2000)
      }
    }, upstreamResponse.ok ? 200 : 502);
  } catch (error) {
    return jsonResponse({
      request: {
        upstreamURL,
        method: "POST",
        headers: {
          "Content-Type": upstreamHeaders["Content-Type"],
          "Authorization": `Bearer ${maskApiKey(config.apiKey)}`
        },
        body: upstreamBody
      },
      error: {
        message: error.message,
        type: "upstream_fetch_error"
      }
    }, 500);
  }
}
