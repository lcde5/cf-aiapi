/**
 * Parse PROVIDERS configuration and provide model mapping utilities.
 */
export function parseProviders(env) {
  try {
    const providers = JSON.parse(env.PROVIDERS || "{}");
    const modelMap = {};

    for (const [providerName, providerConfig] of Object.entries(providers)) {
      const { baseURL, apiKey, models } = providerConfig;

      if (!baseURL || !apiKey || !models || !Array.isArray(models)) {
        continue;
      }

      // Support multiple accounts / base URLs
      const accounts = Array.isArray(apiKey) ? apiKey : [apiKey];
      const baseURLs = Array.isArray(baseURL) ? baseURL : [baseURL];

      for (const model of models) {
        if (!modelMap[model]) {
          modelMap[model] = [];
        }
        // Create a config per account/baseURL combination
        const maxLen = Math.max(accounts.length, baseURLs.length);
        for (let i = 0; i < maxLen; i++) {
          const account = accounts[i % accounts.length];
          const url = baseURLs[i % baseURLs.length];

          // Resolve apiKey if it references another env var
          let resolvedApiKey = account;
          if (account && /^[A-Z_]+$/.test(account)) {
            resolvedApiKey = env[account] || account;
          }

          modelMap[model].push({
            baseURL: url,
            apiKey: resolvedApiKey,
            provider: providerName
          });
        }
      }
    }
    return modelMap;
  } catch (e) {
    return {};
  }
}

/**
 * Get configuration for a specific model.
 * Supports round‑robin style load‑balancing across multiple accounts.
 */
export function getModelConfig(model, env) {
  const modelMap = parseProviders(env);
  const configs = modelMap[model];
  if (!configs || configs.length === 0) {
    return null;
  }
  // Simple time‑based rotation (one second per config)
  const index = Math.floor(Date.now() / 1000) % configs.length;
  return configs[index];
}
