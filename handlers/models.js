import { jsonResponse } from "../utils/response.js";
import { parseProviders } from "../providers/parser.js";

export function handleModels(env) {
  try {
    const modelMap = parseProviders(env);
    const modelList = Object.keys(modelMap).map(id => {
      const configs = modelMap[id];
      const accountCount = configs.length;
      const provider = configs[0]?.provider || "system";
      return {
        id,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: accountCount > 1 ? `${provider} (${accountCount} accounts)` : provider
      };
    });
    return jsonResponse({ object: "list", data: modelList });
  } catch (e) {
    return jsonResponse({ error: { message: "Failed to parse PROVIDERS configuration", type: "server_error" } }, 500);
  }
}
