---
name: add-model
description: Configure a custom Anthropic-compatible API endpoint for container agents. Use when the user wants to use a different model provider (e.g., OpenRouter, Azure, AWS Bedrock, Anthropic on Google Vertex AI) or self-hosted or custom endpoints. Supports both official and third-party models.
---

# Add Custom Model Support

This skill configures NanoClaw to use a custom Anthropic-compatible API endpoint instead of the default `https://api.anthropic.com`. This is useful when:

- Using alternative providers like ZhipuAI, KimiAI, OpenRouter, Azure OpenAI, AWS Bedrock
- Running self-hosted or local models via a custom endpoint
- Cost optimization through cheaper/faster models
- Testing new models before general availability

## Phase 1: Pre-flight

### Check if already applied

Check if `src/config.ts` exports `ANTHROPIC_BASE_URL`. If container-runner passes `ANTHROPIC_BASE_URL` to container environment, this setting is already configured. Skip to Phase 4 (Configure Endpoint).

### Check prerequisites

Verify the model provider is available:

Common providers and their endpoints:

| Provider | Endpoint                                 | Notes                         |
| -------- | ---------------------------------------- | ----------------------------- |
| ZhipuAI  | `https://open.bigmodel.cn/api/anthropic` | Compatible with Anthropic SDK |
| KimiAI   | `https://api.kimi.com/coding/`           | Compatible with Anthropic SDK |

### Verify endpoint is reachable

Test connectivity:

```bash
curl -s https://your-endpoint.com/v1/models
```

Adjust the URL for your provider's endpoint.

## Phase 2: Apply Code Changes

### Ensure upstream remote

```bash
git remote -v
```

If `upstream` is missing, add it:

```bash
git remote add upstream-cjnchk https://github.com/cjnchk/nanoclaw.git
```

### Merge the skill branch

```bash
git fetch upstream-cjnchk skill/add-model
git merge upstream-cjnchk/skill/add-model
```

This merges in:

- `ANTHROPIC_BASE_URL` config in `src/config.ts`
- `ANTHROPIC_BASE_URL` environment variable passing in `src/container-runner.ts`
- `ANTHROPIC_BASE_URL` example in `.env.example`

If the merge reports conflicts, resolve them by reading the conflicted files and understanding the intent of both sides.

### Validate code changes

```bash
npm run build
```

Build must be clean before proceeding.

## Phase 3: Configure API Credentials via OneCLI

NanoClaw uses OneCLI to manage credentials — API keys are never stored in `.env` or exposed to containers. The OneCLI gateway injects them at request time.

First, check if OneCLI is running and has credentials configured:

```bash
onecli version 2>/dev/null && onecli secrets list
```

### Choose configuration method

Use AskUserQuestion to let the user choose how to configure the API key:

**Option 1: Web UI (Dashboard)** — Best if you have a browser on this machine.

- Open <http://127.0.0.1:10254>
- Click "Add Secret"
- Select "Generic Secret"
- Fill in:
  - **Name**: `CustomModel` (or a descriptive name like `ZhipuAI`, `KimiAI`)
  - **Secret value**: Your API key from the provider
  - **Host pattern**: The API host (e.g., `open.bigmodel.cn`)
  - **Header name**: API authorization header name (e.g., `Authorization`, `x-api-key`)
  - **Value format**: API authorization header value placeholder (e.g., `Bearer {value}`, `{value}`)

**Option 2: CLI** — Best for remote/headless servers.

```bash
onecli secrets create --name CustomModel --type generic --value YOUR_API_KEY --host-pattern your-api-host.com --header-name Authorization --value-format 'Bearer {value}'
```

Examples:

```bash
# ZhipuAI
onecli secrets create --name ZhipuAI --type generic --value your-api-key --host-pattern open.bigmodel.cn --header-name Authorization --value-format 'Bearer {value}'

# KimiAI
onecli secrets create --name KimiAI --type generic --value your-api-key --host-pattern api.moonshot.cn --header-name x-api-key --value-format '{value}'

```

### Verify credential registration

After the user configures the secret:

```bash
onecli secrets list
```

Confirm the new secret appears in the list.

## Phase 4: Configure Endpoint

### Set the API endpoint in .env

Add to `.env`:

```bash
ANTHROPIC_BASE_URL=https://your-api-endpoint.com
```

Examples for common providers:

```bash
# ZhipuAI
ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic

# KimiAI
ANTHROPIC_BASE_URL=https://api.kimi.com/coding/
```

## Phase 5: Restart and Verify

### Restart the service

Apply the configuration:

```bash
# macOS (launchd)
launchctl kickstart -k gui/$(id -u)/com.nanoclaw

# Linux (systemd)
systemctl --user restart nanoclaw
```

### Test the agent

Send a message to your agent:

> "What model are you using?" or "Tell me about the current model configuration"

Check the agent's response to confirm the custom endpoint is being used.

### Check logs if needed

```bash
tail -f logs/nanoclaw.log
```

Look for:

- `OneCLI gateway config applied` — credentials being injected
- Messages indicating the custom base URL is being used

## Troubleshooting

### Agent not using the custom endpoint

1. Check `.env` file contains `ANTHROPIC_BASE_URL`
2. Verify the secret was registered: `onecli secrets list`
3. Restart the service

### Connection errors

1. Verify the endpoint URL is correct and accessible from the container:

   ```bash
   docker run --rm curlimages/curl curl -s https://your-endpoint/v1/models
   ```

2. Check if API key is set correctly in OneCLI
3. For Azure/AWS, ensure the endpoint matches the region
4. For local models, ensure the service is running on the host

### OneCLI gateway not reachable

1. Check if OneCLI is running: `curl -sf http://127.0.0.1:10254/health`
2. Start it if needed: `onecli start`
3. Verify `ONECLI_URL` is set in `.env`

### Rate limit errors

If you encounter rate limits:

1. Check the provider's rate limits and documentation
2. Consider using a different provider or model
3. Use OneCLI to set rate limit policies: `onecli rules create --help`

## Provider-Specific Notes

### ZhipuAI (智谱)

- Get your API key from <https://open.bigmodel.cn/console>
- Supports glm series models
- Set `ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic`

### KimiAI (月之暗面)

- Get your API key from <https://www.kimi.com/code/console>
- Supports kimi-for-coding series models
- Set `ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1`
