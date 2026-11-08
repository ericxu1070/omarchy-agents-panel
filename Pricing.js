.pragma library

// API list prices in USD per million tokens, matched by model id prefix
// (longest first wins). Cache writes are the 5-minute rate, 1.25x input.
// Source: Anthropic model pricing as of 2026-10-06. A model missing here
// is left out of the estimate rather than guessed at.
var rates = [
  { prefix: "claude-fable-5-1",  input: 10.00, output: 50.00, cacheWrite: 12.50, cacheRead: 0.25 },
  { prefix: "claude-fable-5",    input: 10.00, output: 50.00, cacheWrite: 12.50, cacheRead: 1.00 },
  { prefix: "claude-opus-5-5",   input: 4.00,  output: 20.00, cacheWrite: 5.00,  cacheRead: 0.20 },
  { prefix: "claude-opus-5",     input: 5.00,  output: 25.00, cacheWrite: 6.25,  cacheRead: 0.50 },
  { prefix: "claude-opus-4",     input: 5.00,  output: 25.00, cacheWrite: 6.25,  cacheRead: 0.50 },
  { prefix: "claude-sonnet-5-5", input: 2.00,  output: 10.00, cacheWrite: 2.50,  cacheRead: 0.20 },
  { prefix: "claude-sonnet-5",   input: 2.00,  output: 10.00, cacheWrite: 2.50,  cacheRead: 0.20 },
  { prefix: "claude-sonnet-4-6", input: 3.00,  output: 15.00, cacheWrite: 3.75,  cacheRead: 0.30 },
  { prefix: "claude-haiku-5-5",  input: 0.10,  output: 0.50,  cacheWrite: 0.125, cacheRead: 0.01 },
  { prefix: "claude-haiku-4-5",  input: 1.00,  output: 5.00,  cacheWrite: 1.25,  cacheRead: 0.10 }
].sort(function(a, b) { return b.prefix.length - a.prefix.length })

function rateFor(modelId) {
  var id = String(modelId || "")
  for (var i = 0; i < rates.length; i++) if (id.indexOf(rates[i].prefix) === 0) return rates[i]
  return null
}

// What `modelUsage` ({ modelId: { inputTokens, outputTokens,
// cacheReadInputTokens, cacheCreationInputTokens } }) would cost at list
// price, and how many of its tokens that covers.
function price(modelUsage) {
  var usd = 0
  var tokens = 0
  for (var id in modelUsage || {}) {
    var rate = rateFor(id)
    var b = modelUsage[id] || {}
    if (!rate) continue
    var input = Number(b.inputTokens || 0)
    var output = Number(b.outputTokens || 0)
    var read = Number(b.cacheReadInputTokens || 0)
    var write = Number(b.cacheCreationInputTokens || 0)
    usd += (input * rate.input + output * rate.output + read * rate.cacheRead + write * rate.cacheWrite) / 1e6
    tokens += input + output + read + write
  }
  return { usd: usd, tokens: tokens }
}

// This week's tokens for one agent at the dollars per token its all-time
// model and cache mix works out to. Null when none of its models is priced.
function weekEstimate(weekTokens, modelUsage) {
  var all = price(modelUsage)
  if (!(all.tokens > 0) || !(weekTokens > 0)) return null
  return weekTokens * all.usd / all.tokens
}
