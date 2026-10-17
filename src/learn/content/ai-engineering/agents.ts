import type { Topic } from "../../types/content";
import { md } from "./md";

export const aiAgentTopics: Topic[] = [
  {
    id: "what-is-an-agent",
    title: "What is an AI Agent?",
    level: "beginner",
    description: "An LLM that decides its own next steps in a loop, using tools, until a goal is done - and when a simpler design is better.",
    explanation: md(
      "An **AI agent** gives a large language model (LLM) a goal, a set of **tools** (functions it can ask your code to run, like 'read a file' or 'search the docs'), and a loop. Each turn, the model looks at everything so far and decides what to do: call one or more tools, or stop and answer. Your code runs the tools, sends back the results, and the model decides again.",
      "The key word is **decides**. The *model* picks the steps at run time. You don't know in advance whether it will take two steps or twelve, or which tools it will use. That flexibility is the whole point, and the whole risk.",
      "People often confuse three designs:",
      "- **Chatbot (single call)**: one request, one reply. No tools, no loop. Example: 'rewrite this email to sound friendlier'.\n- **Workflow**: the LLM runs inside steps that *your code* defines. The path is fixed or chosen by simple rules: classify the ticket, route it, draft a reply, check the draft. The model fills in the blanks; the program steers.\n- **Agent**: the model steers. It picks a tool, reads the result, and keeps going until it judges the task done (or your safety limits stop it).",
      "A common definition: workflows run LLMs and tools through **predefined code paths**; agents let the LLM **dynamically direct its own process and tool usage**. Both are useful. Neither is automatically better.",
      "Every agent has four parts:",
      "- **Model**: the LLM that reasons and chooses actions.\n- **Tools**: functions with a name, a description, and an input schema (a JSON Schema for the arguments). The model can only *request* a tool; your code runs it.\n- **Loop**: call the model, run requested tools, append the results, call the model again, until it stops asking for tools.\n- **Guardrails**: a step limit, timeouts, permission checks, human approval for risky actions, and logging.",
      "**When NOT to build an agent** is the most important lesson here. Start with a single well-written prompt. If that's not enough, add retrieval (fetching relevant documents) or a fixed workflow. Only use an agent when the steps truly can't be known in advance. Agents cost more (many model calls per task), are slower, are harder to test (each run can take a different path), and make compounding mistakes (one wrong early step leads every later step astray).",
      "Good agent tasks are open-ended, need a varying number of steps, get feedback from the environment (test results, search hits, file contents), and have mistakes that are cheap to spot and fix. Classic examples: coding assistants that edit files and run tests, research assistants that search and read in rounds, and support assistants that look up orders and take bounded actions.",
    ),
    analogy:
      "A chatbot is a calculator: press keys, get one answer. A workflow is a recipe: chop, fry, serve, in that order. An agent is a chef you give a goal ('dinner for four, one vegetarian') and a stocked kitchen. The chef opens the fridge, tastes, adjusts, and decides each next step. You get flexibility, but you need house rules: a budget, ask before using the expensive knives, and a deadline.",
    examples: [
      {
        title: "Chatbot vs workflow vs agent, side by side (runnable, offline)",
        code: `// A fake LLM so this runs without a network. Real code would call an API.
function llm(prompt) {
  if (prompt.startsWith("Classify:")) return prompt.includes("refund") ? "billing" : "technical";
  if (prompt.startsWith("Reply:")) return "Thanks for writing in - we are on it.";
  return "Our opening hours are 9am-5pm.";
}

// 1) CHATBOT: one call, text in -> text out.
console.log("chatbot  :", llm("What are your hours?"));

// 2) WORKFLOW: YOUR code fixes the steps; the LLM fills in each one.
const ticket = "I was charged twice, I want a refund for order 42";
const team = llm("Classify: " + ticket);           // step 1 (LLM)
const draft = llm("Reply: " + ticket);              // step 2 (LLM)
console.log("workflow : routed to", team, "| draft:", draft);

// 3) AGENT: the MODEL picks the next action each turn, in a loop.
const orders = { 42: { paid: 2, amount: 30 } };
const tools = {
  lookup_order: (id) => JSON.stringify(orders[id]),
  issue_refund: (id) => { orders[id].paid -= 1; return "refunded " + orders[id].amount; },
};
// A scripted "model": it decides based on what it has observed so far.
function agentModel(history) {
  const seen = history.join(" ");
  if (!seen.includes("paid")) return { tool: "lookup_order", arg: 42 };
  if (seen.includes('"paid":2') && !seen.includes("refunded")) return { tool: "issue_refund", arg: 42 };
  return { final: "You were charged twice; I refunded one charge of 30." };
}
const history = [];
for (let step = 1; step <= 5; step++) {               // max-steps guard
  const action = agentModel(history);
  if (action.final) { console.log("agent    : FINAL ->", action.final); break; }
  const observation = tools[action.tool](action.arg);
  console.log("agent    : step", step, action.tool + "(" + action.arg + ") ->", observation);
  history.push(observation);
}`,
        explanation: "Notice who picks the order of steps. The workflow hard-codes classify-then-reply. The agent's scripted model looked up the order, saw a double charge, chose to refund, then chose to stop. A real LLM makes those choices from the conversation instead of a script.",
        walkthrough: [
          { code: "console.log(\"chatbot  :\", llm(\"What are your hours?\"));", explanation: "A chatbot is one model call. No tools, no loop, no memory beyond what you send." },
          { code: "const team = llm(\"Classify: \" + ticket);", explanation: "In a workflow, your program decides to classify first and draft second." },
          { code: "function agentModel(history) { ... }", explanation: "In an agent, the model reads everything observed so far and returns a tool request or a final answer." },
          { code: "for (let step = 1; step <= 5; step++)", explanation: "The loop runs until the model gives a final answer, but never more than 5 steps, so a confused model can't run forever." },
        ],
      },
      {
        title: "The simplest LLM call (a chatbot turn) with the Anthropic SDK",
        language: "python",
        code: `# pip install anthropic   and set ANTHROPIC_API_KEY in your environment
import anthropic

client = anthropic.Anthropic()

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system="You are a friendly support assistant for an online shop.",
    messages=[{"role": "user", "content": "What is your returns window?"}],
)
for block in resp.content:
    if block.type == "text":
        print(block.text)

# Before building an agent, ask: is this already good enough?
# If one call (plus maybe retrieved documents) solves it, stop here.`,
        explanation: "Every agent project should beat this baseline. An agent is this same call inside a loop, with tools attached.",
      },
      {
        title: "Decision checklist: do I need an agent?",
        language: "text",
        code: `1. Can one prompt (with good instructions + examples) do it?   -> single call
2. Does it need facts from your documents?                      -> add retrieval (RAG)
3. Are the steps always the same, in the same order?            -> workflow (chain)
4. Are there a few known kinds of input needing different handling? -> workflow (routing)
5. Are the steps unknown until you see intermediate results,
   and can the model check its own progress (tests, search hits)? -> agent
6. Are mistakes expensive or irreversible (money, deletes, emails)?
   -> agent only with human approval + tight permissions, or don't`,
        explanation: "Walk down the list and stop at the first 'yes'. Most production LLM features stop at step 1-4.",
      },
    ],
    howItWorks: md(
      "An agent is an ordinary program. The model never touches your files or databases. It produces a structured request like `{name: \"read_file\", input: {path: \"todo.txt\"}}`. Your code checks it, runs the real function, and appends the output as a **tool result**. Then it calls the model again with the whole conversation, because LLM APIs are **stateless**: the model remembers nothing between calls unless you send it.",
      "Each pass through the loop is a **step** or **turn**. The loop ends when the model replies without asking for a tool (task done), when a safety limit is hit (steps, time, or cost), or when a human must decide.",
      "Every step re-sends the growing conversation, so cost and latency grow with the step count. A 10-step run can easily cost 10-30 times a single call. Prove you need the flexibility before paying for it.",
    ),
    diagram: `  CHATBOT          WORKFLOW                AGENT
  -------          --------                -----
  input            input                   goal
    |                |                       |
  [LLM]           [LLM step 1]         +-> [LLM decides] --+
    |                |                 |       |           |
  output          [LLM step 2]         |   tool call?    answer
                     |                 |       |
                  [check]              |   [run tool]
                     |                 |       |
                  output               +-- result
  1 call          fixed path           model picks path`,
    whyItExists: md(
      "Many tasks can't be scripted in advance. Fixing a bug means reading code, guessing, running tests, and reacting to what fails. Research means searching, reading, and searching again. A fixed pipeline can't foresee every branch; an LLM that chooses actions and sees results can.",
      "Agents turn a model that only *talks* into a system that can *act*, safely, within limits you set.",
    ),
    whenToUse: md(
      "Use an agent when the task is open-ended, the steps depend on intermediate results, the environment gives clear feedback (a test passes, a search returns hits), and you can limit the damage of a wrong action. Typical fits: coding assistants, research assistants, data-exploration helpers, and support bots with a few safe actions.",
    ),
    whenNotToUse: md(
      "Skip the agent when a single prompt, retrieval, or a fixed workflow would do. Also skip it when every step is known in advance (a workflow is cheaper, faster and testable), when latency must be very low, when cost per request must be predictable, or when actions are irreversible and you can't add human approval. 'Agent' is not a goal; a reliable feature is.",
    ),
    commonMistakes: [
      "Starting with an agent framework before trying a single good prompt - most problems never need a loop.",
      "Calling any LLM feature an 'agent'; if your code fixes the steps it is a workflow, which is usually a good thing.",
      "Running the loop with no maximum step count, so a confused model can burn money forever.",
      "Giving the agent powerful tools (delete, send email, pay) with no permission checks or human approval.",
      "Expecting the model to 'remember' earlier calls automatically - the API is stateless, you must send the history.",
      "Not logging each step, which makes it impossible to understand why an agent did something strange.",
      "Assuming more autonomy means better results; reliability usually drops as the number of free choices grows.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each of these, say whether a single call, a workflow, or an agent fits best, and why: translating a paragraph; triaging support tickets into 4 queues; fixing a failing unit test in an unknown codebase; writing a weekly report from a fixed set of 3 dashboards." },
      { difficulty: "Easy", prompt: "In the runnable demo, change the order data so the customer was charged only once. Predict what the scripted agent does, then run it and check." },
      { difficulty: "Medium", prompt: "Extend the demo's agent with a third tool, `send_email`, and make the loop refuse to run it unless a variable `approved` is true. Print what the agent does in both cases." },
      { difficulty: "Medium", prompt: "Write down the guardrails (limits, permissions, approvals, logs) you would require before letting an agent issue refunds in a real shop." },
      { difficulty: "Hard", prompt: "Pick a task from your own work. Build it first as a single prompt, then as a 2-3 step workflow. Write a short note on whether an agent would actually add value, with evidence from the failures you saw." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a workflow and an agent?", answer: "In a workflow, your code defines the sequence of LLM calls and tool calls (fixed steps or rule-based branching). In an agent, the LLM decides at run time which tools to call and when to stop, inside a loop. Workflows are more predictable and cheaper; agents are more flexible for open-ended tasks." },
      { question: "What are the core components of an agent?", answer: "A model that reasons and chooses actions, a set of tools with names, descriptions and input schemas, a loop that runs requested tools and feeds results back, and guardrails such as maximum steps, permissions, human approval and logging." },
      { question: "When would you advise against building an agent?", answer: "When a single prompt, retrieval, or a fixed workflow solves the task; when steps are known in advance; when latency or cost must be low and predictable; or when actions are irreversible and cannot be gated by a human. Agents add cost, latency, nondeterminism and compounding errors." },
      { question: "Does the model execute tools itself?", answer: "No. The model only emits a structured request naming a tool and its arguments. Your application validates it, executes the real function with its own permissions, and sends the result back as a tool result message." },
      { question: "Why do agents cost more than a single call?", answer: "Each step is another model call, and because the API is stateless each call re-sends the growing conversation, including all previous tool calls and results. Token usage grows with the number of steps and with the size of tool outputs." },
      { question: "What makes a task a good fit for an agent?", answer: "Open-ended goals where the steps depend on intermediate results, clear feedback signals from the environment (tests, search results, errors), the ability to recover from mistakes, and actions whose risk can be bounded with permissions or approval." },
    ],
    prerequisites: ["how-llms-work", "calling-an-llm-api"],
    relatedTopics: ["tool-use", "the-agent-loop", "workflow-patterns", "build-an-agent-from-scratch", "ai-security"],
    keywords: ["ai agent", "agentic", "autonomous", "chatbot", "workflow", "llm loop", "tools", "when not to use agents", "agent vs workflow", "guardrails"],
  },

  {
    id: "tool-use",
    title: "Tool Use and Function Calling",
    level: "intermediate",
    description: "How an LLM asks your code to run functions: tool definitions, JSON Schema inputs, tool_use and tool_result blocks.",
    explanation: md(
      "**Tool use** (or **function calling**) lets a model ask your app to run a function and return the result. The model can't browse, read your database, or reliably do arithmetic, but it can say: 'please call `get_weather` with `{\"city\": \"Paris\"}`'. Your code runs it and replies. This one mechanism turns a text generator into something that can look things up and act.",
      "A **tool definition** has three parts:",
      "- **name**: a short identifier like `get_weather` (letters, digits, underscores, hyphens).\n- **description**: plain text saying *what the tool does, when to use it, and what it returns*. This matters most: the model picks tools mainly by reading descriptions.\n- **input_schema**: a **JSON Schema** (a standard format for describing data shape) listing the arguments, their types, which are required, and allowed values (`enum`).",
      "The conversation then gets two new kinds of **content blocks** (a message's content can be a list of typed blocks instead of a string):",
      "- **tool_use** (in the assistant's message): `{type: \"tool_use\", id: \"toolu_...\", name: \"get_weather\", input: {city: \"Paris\"}}`. The `id` is unique per call.\n- **tool_result** (in the next user message): `{type: \"tool_result\", tool_use_id: \"toolu_...\", content: \"18°C and cloudy\"}`. The `tool_use_id` must match the call it answers. If the tool failed, add `is_error: true` with an error message as content, so the model tries something else.",
      "When the model wants a tool, **stop_reason** is `tool_use`. Append the assistant message to your history *exactly as received* (tool_use blocks included), run the tools, send one user message with the tool_result blocks, and call the model again.",
      "**Parallel tool calls**: one assistant turn can hold several tool_use blocks (say, weather in Paris *and* Oslo). Run them all (in parallel if independent) and return **all results in one user message**, one tool_result per tool_use id. Splitting them across messages is a common bug.",
      "**tool_choice** controls tool use. The default, `auto`, lets the model decide whether to call a tool or answer directly. On current Claude models, use `auto` plus clear instructions in the system prompt and tool descriptions ('Always use the calculator for arithmetic') instead of forcing a specific tool.",
      "Designing good tools is a skill, sometimes called the **agent-computer interface**:",
      "- Write descriptions like docs for a new colleague: what it does, when to use it and when *not* to, what the output looks like, and limits (max rows, units).\n- Keep the set small and non-overlapping. Two tools that both 'search' confuse the model.\n- Make arguments hard to misuse: enums instead of free text, clear units ('amount_cents'), and explicitly stated absolute or workspace-relative paths.\n- Return short, useful output. A 2 MB JSON dump wastes context; return the fields that matter and say when results were truncated.\n- Return helpful errors ('No file named todo.txt; available: notes.txt, plan.md') so the model can recover.",
      "Tool use is also a handy way to get **structured data**: the model's `input` always follows your schema. For pure data extraction, dedicated structured-output features (see Structured Output) are usually simpler.",
    ),
    analogy:
      "Picture a manager on the phone with an assistant at the office. The manager can't reach the filing cabinet, so they say: 'Please pull the file for order 42.' The assistant reads it back, and the manager decides what to ask next. The manager is the model, the assistant is your code, and the list of allowed jobs (with instructions for each) is your tool list.",
    examples: [
      {
        title: "Validate and dispatch tool calls like an API would send them (runnable)",
        code: `// One tool definition, in the same shape you send to the API.
const tools = [{
  name: "get_weather",
  description: "Get the current temperature for a city. Use when the user asks about weather.",
  input_schema: {
    type: "object",
    properties: {
      city: { type: "string", description: "City name, e.g. Paris" },
      unit: { type: "string", enum: ["celsius", "fahrenheit"], description: "Defaults to celsius" },
    },
    required: ["city"],
  },
}];

// A tiny JSON Schema check (real projects use a library such as ajv or pydantic).
function validate(schema, input) {
  const errors = [];
  for (const key of schema.required || []) if (!(key in input)) errors.push("missing required field '" + key + "'");
  for (const [key, value] of Object.entries(input)) {
    const prop = schema.properties[key];
    if (!prop) { errors.push("unknown field '" + key + "'"); continue; }
    if (prop.type === "string" && typeof value !== "string") errors.push(key + " must be a string");
    if (prop.enum && !prop.enum.includes(value)) errors.push(key + " must be one of: " + prop.enum.join(", "));
  }
  return errors;
}

const impl = {
  get_weather: ({ city, unit = "celsius" }) => {
    const c = { paris: 18, oslo: 4 }[city.toLowerCase()];
    if (c === undefined) throw new Error("No weather data for " + city + ". Known cities: Paris, Oslo");
    return unit === "celsius" ? c + " C" : Math.round(c * 9 / 5 + 32) + " F";
  },
};

// Turn ONE tool_use block into ONE tool_result block - never throw.
function handleToolUse(block) {
  const def = tools.find((t) => t.name === block.name);
  if (!def) return { type: "tool_result", tool_use_id: block.id, content: "Unknown tool: " + block.name, is_error: true };
  const errors = validate(def.input_schema, block.input);
  if (errors.length) return { type: "tool_result", tool_use_id: block.id, content: "Invalid input: " + errors.join("; "), is_error: true };
  try {
    return { type: "tool_result", tool_use_id: block.id, content: impl[block.name](block.input) };
  } catch (err) {
    return { type: "tool_result", tool_use_id: block.id, content: err.message, is_error: true };
  }
}

// Pretend the model asked for four tools in ONE turn (parallel tool calls).
const assistantContent = [
  { type: "text", text: "Let me check both cities." },
  { type: "tool_use", id: "toolu_1", name: "get_weather", input: { city: "Paris" } },
  { type: "tool_use", id: "toolu_2", name: "get_weather", input: { city: "Oslo", unit: "fahrenheit" } },
  { type: "tool_use", id: "toolu_3", name: "get_weather", input: { town: "Rome" } },
  { type: "tool_use", id: "toolu_4", name: "get_stock_price", input: {} },
];
const results = assistantContent.filter((b) => b.type === "tool_use").map(handleToolUse);
// ALL results go back in ONE user message:
const nextUserMessage = { role: "user", content: results };
for (const r of nextUserMessage.content) console.log(JSON.stringify(r));`,
        explanation: "Each tool_use gets exactly one tool_result with the matching id. Errors are returned with is_error (not thrown) so the model can recover. All results go back together in one user message.",
      },
      {
        title: "One full tool round trip with the Anthropic SDK",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

tools = [{
    "name": "get_weather",
    "description": "Get the current weather for a city. Use when the user asks about weather. "
                   "Returns temperature in Celsius and a short condition, e.g. '18 C, cloudy'.",
    "input_schema": {
        "type": "object",
        "properties": {"city": {"type": "string", "description": "City name, e.g. 'Paris'"}},
        "required": ["city"],
    },
}]

def get_weather(city: str) -> str:
    fake = {"paris": "18 C, cloudy", "oslo": "4 C, snow"}
    if city.lower() not in fake:
        raise ValueError(f"No data for {city}. Try a major city.")
    return fake[city.lower()]

messages = [{"role": "user", "content": "Should I pack a coat for Paris and Oslo?"}]

# Turn 1: the model asks for tools
resp = client.messages.create(model="claude-opus-5-5", max_tokens=16000,
                              tools=tools, messages=messages)
print(resp.stop_reason)                       # "tool_use"
messages.append({"role": "assistant", "content": resp.content})   # keep tool_use blocks!

results = []
for block in resp.content:
    if block.type == "tool_use":
        try:
            out = get_weather(**block.input)
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})
        except Exception as e:
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": f"Error: {e}", "is_error": True})
messages.append({"role": "user", "content": results})               # ALL results, ONE message

# Turn 2: the model uses the results to answer
resp = client.messages.create(model="claude-opus-5-5", max_tokens=16000,
                              tools=tools, messages=messages)
print(next(b.text for b in resp.content if b.type == "text"))`,
        explanation: "Two calls: the first returns tool_use blocks, the second gets the results. Put these two calls in a loop and you have an agent (see The Agent Loop).",
      },
      {
        title: "What the message history looks like after one tool round",
        language: "json",
        code: `[
  {"role": "user", "content": "Should I pack a coat for Paris and Oslo?"},
  {"role": "assistant", "content": [
    {"type": "text", "text": "I'll check the weather in both cities."},
    {"type": "tool_use", "id": "toolu_01A", "name": "get_weather", "input": {"city": "Paris"}},
    {"type": "tool_use", "id": "toolu_01B", "name": "get_weather", "input": {"city": "Oslo"}}
  ]},
  {"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01A", "content": "18 C, cloudy"},
    {"type": "tool_result", "tool_use_id": "toolu_01B", "content": "4 C, snow"}
  ]}
]`,
        explanation: "Roles still alternate user/assistant. Tool results use role 'user' because they come from your side. The ids are illustrative.",
      },
    ],
    howItWorks: md(
      "When you pass `tools`, the API turns your definitions into special instructions the model was trained to follow. If the model decides a tool would help, it writes a tool_use block instead of (or after) plain text and stops with `stop_reason: \"tool_use\"`.",
      "The model shapes `input` to match your JSON Schema, but treat it as **untrusted input**: validate types and ranges, check permissions, and never pass it straight to a shell or SQL query. Text in a web page or document the model read can trick it into requesting harmful actions. This is *prompt injection*, covered in AI Security.",
      "Tool definitions go with every request and count as input tokens, so 50 verbose tools cost you on every call. Keep the list focused.",
    ),
    diagram: `  your app                       model
  --------                       -----
  messages + tool defs  ------>  reads, decides
                        <------  tool_use {id, name, input}
  validate input                 (stop_reason = tool_use)
  run real function
  tool_result {tool_use_id,
    content, is_error?}  ------> reads result
                        <------  final text
                                 (stop_reason = end_turn)`,
    whyItExists: md(
      "Models are frozen at training time and live in a text box. They don't know today's weather, your customer's order status, or what's in your repo, and they make arithmetic slips. Tool use gives them a structured way to ask for fresh data and trigger actions, while your code controls what actually runs.",
    ),
    whenToUse: md(
      "Use tools when the model needs information it can't know (live data, private data, search), exact computation (math, dates, code execution), or an action (create a ticket, write a file). A tool definition also gets you arguments in a guaranteed shape.",
    ),
    whenNotToUse: md(
      "Don't wrap things in tools that could just go in the prompt: if the model always needs the same small document, include it. Don't expose dangerous capabilities (arbitrary shell, raw SQL, payments) without strict validation and approval. Don't create dozens of overlapping tools; merge or remove them.",
    ),
    commonMistakes: [
      "Writing one-line tool descriptions; the model picks tools by their descriptions, so vague ones cause wrong or missing calls.",
      "Dropping the assistant's tool_use blocks from the history and sending only the text - the next request then has tool_results with no matching tool_use and fails.",
      "Sending parallel tool results as separate user messages instead of one message with several tool_result blocks.",
      "Raising an exception and crashing the program when a tool fails, instead of returning a tool_result with is_error: true.",
      "Trusting tool inputs blindly - passing a model-supplied path or query straight to the file system, shell or database.",
      "Returning huge raw outputs (whole web pages, full tables) that flood the context window.",
      "Defining overlapping tools (search_docs and find_documents) so the model has to guess which one to use.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a tool definition (name, description, input_schema) for `convert_currency` with amount, from and to fields, using enums for currency codes." },
      { difficulty: "Easy", prompt: "In the runnable demo, add a `days` integer field to get_weather and extend the validator to check numbers. Send an invalid value and confirm the error result." },
      { difficulty: "Medium", prompt: "Rewrite three tool descriptions from a real API you know so that a new colleague could use them correctly without other docs. Include when NOT to use each." },
      { difficulty: "Medium", prompt: "Using the Python round-trip example, ask a question that needs no tool ('What is the capital of France?') and print the stop_reason. Explain the result." },
      { difficulty: "Hard", prompt: "Build a dispatcher in Python that runs independent tool calls from one turn concurrently with a thread pool, preserves the matching ids, applies a 10-second timeout per tool, and reports timeouts as is_error results." },
    ],
    interviewQuestions: [
      { question: "Walk through one tool-use round trip.", answer: "You send messages plus tool definitions. The model returns an assistant message with one or more tool_use blocks and stop_reason tool_use. You append that assistant message unchanged, run each tool, then append one user message with a tool_result per tool_use id. You call the model again; it reads the results and either calls more tools or answers." },
      { question: "Why does the tool description matter so much?", answer: "The model decides whether and which tool to call almost entirely from names and descriptions. A good description states what the tool does, when to use it and not use it, argument meanings and units, and what the output looks like. Most tool-selection bugs are description bugs." },
      { question: "How should a tool failure be reported to the model?", answer: "Return a tool_result for that tool_use id with is_error set to true and a clear, actionable message (what failed and how to fix it). The model can then retry with different arguments or choose another approach instead of the program crashing." },
      { question: "How do you handle parallel tool calls?", answer: "Run every tool_use in the assistant turn (concurrently if independent) and send all tool_result blocks together in a single user message, each referencing its tool_use_id." },
      { question: "Is a tool's input safe to use directly?", answer: "No. It is model-generated and can be influenced by prompt injection from content the model read. Validate against the schema, enforce permissions and allow-lists, sanitize paths and queries, and require human approval for risky actions." },
      { question: "What does tool_choice auto mean?", answer: "The model decides on its own whether to call a tool or answer directly. On current Claude models you guide this with clear system-prompt instructions and descriptions rather than forcing a specific tool." },
    ],
    prerequisites: ["what-is-an-agent", "calling-an-llm-api", "structured-output"],
    relatedTopics: ["the-agent-loop", "build-an-agent-from-scratch", "model-context-protocol", "structured-output", "ai-security"],
    keywords: ["function calling", "tool use", "tool_use", "tool_result", "json schema", "input_schema", "is_error", "parallel tool calls", "tool_choice", "agent computer interface"],
  },

  {
    id: "the-agent-loop",
    title: "The Agent Loop",
    level: "intermediate",
    description: "Perceive, think, act, observe - repeated: the loop at the heart of every agent, ReAct, and how and when it must stop.",
    explanation: md(
      "The **agent loop** is the small piece of code that turns tool use into an agent. It repeats four phases until done:",
      "- **Perceive**: the model gets the goal plus everything so far (the full message history).\n- **Think**: it reasons about the next move. Current Claude models use built-in adaptive *thinking*; older systems prompted the model to write its reasoning out.\n- **Act**: it requests one or more tool calls (or decides it's finished).\n- **Observe**: your code runs the tools and appends the results; the next round starts with this new information.",
      "**ReAct** (Reason + Act) made this popular. The model wrote alternating 'Thought:', 'Action:' and 'Observation:' lines in plain text, and the program parsed the Action lines. Modern APIs use native tool_use blocks instead of text parsing, but the rhythm is the same: reason, act, observe, repeat.",
      "The code is short: call the model and append its reply. If it asked for tools, run them, append the results as one user message, and loop. Otherwise, stop. The interesting part is **when to stop**. The response's `stop_reason` tells you:",
      "- `end_turn`: the model finished. Normal exit.\n- `tool_use`: the model wants tools run. Keep looping.\n- `max_tokens`: the reply was cut off at your `max_tokens` limit. It's incomplete: raise the limit or ask the model to continue. Don't treat it as final.\n- `stop_sequence`: generation hit one of your custom stop strings.\n- `refusal`: the model declined for safety reasons. Stop and surface it; don't retry the same request in a loop.\n- `pause_turn`: with server-side tools (run by the provider), the model paused a long turn. Send the conversation back, with the paused assistant content appended, so it can continue.",
      "**You** must also add stop conditions, because a model can loop: repeating a search, retrying a broken tool, or wandering.",
      "- **Max steps**: the most important guard. 10-30 is typical for interactive agents.\n- **Budget**: stop when tokens or cost pass a limit (sum `usage.input_tokens` and `usage.output_tokens` each step).\n- **Wall-clock timeout**: stop after N seconds.\n- **Repetition detection**: stop (or warn the model) when the same tool is called with the same input several times.\n- **Human checkpoints**: pause for approval before risky actions, or when the agent is stuck.",
      "When a guard triggers, end gracefully: return what you have and say why it stopped, instead of crashing. Log every step (model text, each tool name and input, each result truncated, stop_reason, token usage) so you can replay and debug runs.",
    ),
    analogy:
      "A detective looks at the evidence (perceive), forms a theory (think), interviews a witness or checks a record (act), notes what they learned (observe), and repeats. A good detective also has a boss who says 'you have three days and a fixed budget; report back either way'. That boss is your max-steps and budget guard.",
    examples: [
      {
        title: "Classic text ReAct: parse Thought / Action / Observation (runnable)",
        code: `// Before native tool calling, ReAct agents wrote actions as text and the program parsed them.
const kb = { "capital of france": "Paris", "population of paris": "about 2.1 million (city proper)" };
const tools = {
  search: (q) => kb[q.toLowerCase()] || "no result",
};

// Scripted model output for each turn (a real LLM would generate these lines).
const modelTurns = [
  "Thought: I need the capital first.\\nAction: search[capital of France]",
  "Thought: Now I need its population.\\nAction: search[population of Paris]",
  "Thought: I have both facts.\\nFinal Answer: The capital is Paris, with about 2.1 million people in the city proper.",
];

let transcript = "Question: What is the capital of France and how many people live there?";
for (let step = 0; step < 5; step++) {
  const output = modelTurns[step];
  transcript += "\\n" + output;
  const lines = output.split("\\n");
  const final = lines.find((l) => l.startsWith("Final Answer:"));
  if (final) { console.log(transcript); console.log("--> stopped: model gave a final answer at step", step + 1); break; }
  const action = lines.find((l) => l.startsWith("Action:"));
  const name = action.slice("Action: ".length, action.indexOf("["));
  const arg = action.slice(action.indexOf("[") + 1, action.lastIndexOf("]"));
  transcript += "\\nObservation: " + tools[name](arg);
}`,
        explanation: "Same loop as today: model output -> run action -> append observation -> repeat. Native tool_use blocks just replace the fragile string parsing with structured JSON.",
      },
      {
        title: "Guards in action: a model stuck in a loop (runnable)",
        code: `// A buggy "model" that keeps searching for the same thing forever.
function stuckModel(history) {
  return { stop_reason: "tool_use", call: { name: "search", input: { q: "refund policy" } }, tokens: 1200 };
}

function runLoop(model, { maxSteps, maxTokens, maxRepeats }) {
  const history = [];
  const seen = {};
  let tokensUsed = 0;
  for (let step = 1; step <= maxSteps; step++) {
    const resp = model(history);
    tokensUsed += resp.tokens;
    if (resp.stop_reason === "end_turn") return "done: " + resp.text;
    if (resp.stop_reason === "max_tokens") return "incomplete: reply was truncated";
    if (resp.stop_reason === "refusal") return "refused: surfacing to the user";
    if (tokensUsed > maxTokens) return "stopped: token budget exceeded at step " + step + " (" + tokensUsed + " tokens)";
    const key = resp.call.name + JSON.stringify(resp.call.input);
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] > maxRepeats) return "stopped: repeated " + key + " " + seen[key] + " times at step " + step;
    console.log("step", step, "->", resp.call.name, JSON.stringify(resp.call.input));
    history.push({ call: resp.call, result: "Refunds within 30 days." });
  }
  return "stopped: hit max steps (" + maxSteps + ")";
}

console.log(runLoop(stuckModel, { maxSteps: 10, maxTokens: 100000, maxRepeats: 2 }));
console.log(runLoop(stuckModel, { maxSteps: 3, maxTokens: 100000, maxRepeats: 99 }));
console.log(runLoop(stuckModel, { maxSteps: 50, maxTokens: 5000, maxRepeats: 99 }));`,
        explanation: "Three different guards catch the same runaway model: repetition detection, max steps, and a token budget. Production loops usually combine all three.",
      },
      {
        title: "A production-shaped loop handling every stop_reason",
        language: "python",
        code: `import anthropic, json, logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("agent")
client = anthropic.Anthropic()

def agent_loop(task, tools, run_tool, system, max_steps=15, max_total_tokens=400_000):
    messages = [{"role": "user", "content": task}]
    total = 0
    for step in range(1, max_steps + 1):
        resp = client.messages.create(model="claude-opus-5-5", max_tokens=16000,
                                      system=system, tools=tools, messages=messages)
        total += resp.usage.input_tokens + resp.usage.output_tokens
        log.info("step=%d stop=%s tokens_so_far=%d", step, resp.stop_reason, total)
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":
            return "".join(b.text for b in resp.content if b.type == "text")
        if resp.stop_reason == "max_tokens":
            return "[incomplete] the reply hit max_tokens; raise the limit or split the task"
        if resp.stop_reason == "refusal":
            return "[refused] the model declined this request"
        if resp.stop_reason == "pause_turn":
            continue                      # server tool paused: send history back so it resumes
        if resp.stop_reason != "tool_use":
            return f"[stopped] unexpected stop_reason {resp.stop_reason}"

        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            log.info("  call %s %s", block.name, json.dumps(block.input)[:200])
            try:
                out = run_tool(block.name, block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})
            except Exception as e:
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": f"Error: {e}", "is_error": True})
        messages.append({"role": "user", "content": results})

        if total > max_total_tokens:
            return "[stopped] token budget exceeded"
    return f"[stopped] no answer after {max_steps} steps"`,
        explanation: "Every exit is explicit: normal finish, truncated, refused, paused, unknown, budget, and max steps. The per-step log line is what you'll debug with later.",
      },
    ],
    howItWorks: md(
      "Each round re-sends the full history: the task, every earlier assistant message (with its tool_use blocks), and every tool result. That's how the model 'remembers' what it tried. It's also why long runs get slower and pricier, and why you should trim large tool outputs.",
      "The history must stay well-formed: roles alternate, every tool_use is answered in the very next user message by a tool_result with the same id, and tool results come first in that message. Breaking these rules causes API errors, a frequent bug when pruning or editing history.",
      "Reliability compounds. If each step is right 95% of the time, a 10-step run with no recovery succeeds only about 60% of the time (0.95 to the power 10). Agents survive by observing results and correcting course, so clear tool errors and good feedback signals (tests, validators) matter a lot.",
    ),
    diagram: `        +-----------------------------+
        |  messages = [task]          |
        +--------------+--------------+
                       v
            +---------------------+
   +------->|  call model         |
   |        +----------+----------+
   |                   v
   |          stop_reason?
   |      tool_use  |  end_turn / max_tokens /
   |                |  refusal / guard hit
   |                v            \\
   |   run tools, append ONE      --> return answer
   |   user msg of tool_results       or reason
   |                |
   +-- step < max --+`,
    whyItExists: md(
      "One model call can only use what's in the prompt. Real tasks need several rounds of gathering information and acting on it. The loop lets the model use each observation to pick its next move, which makes multi-step problem solving possible. Explicit stop conditions exist because models don't always know when to give up.",
    ),
    whenToUse: md(
      "Use a loop when the model may need more than one round of tools: research, debugging, data exploration, multi-step support actions. Write it yourself at least once; later, an SDK helper such as a tool runner can manage it.",
    ),
    whenNotToUse: md(
      "If the model always needs exactly one tool call (or a fixed sequence), skip the loop and write a workflow; two explicit calls are easier to test. If latency matters more than flexibility, cap the loop at 1-3 steps or avoid it.",
    ),
    commonMistakes: [
      "No max-steps limit - the single most expensive agent bug.",
      "Treating stop_reason max_tokens as a finished answer, shipping a truncated reply.",
      "Retrying in a loop after a refusal instead of stopping and explaining.",
      "Only checking `stop_reason == 'end_turn'` and silently exiting on anything else, hiding problems.",
      "Not appending the assistant's full content before the tool results, breaking the tool_use/tool_result pairing.",
      "Logging nothing, or logging only the final answer, so failed runs cannot be diagnosed.",
      "Letting tool results grow without limit so each step re-sends megabytes of text.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Compute the success rate of a 5-step, 10-step and 20-step run when each step is independently correct 90% of the time. What does this suggest about long agent runs?" },
      { difficulty: "Easy", prompt: "Add a fourth guard to the runnable guard demo: a wall-clock limit using Date.now(). Test it by making the fake model slow with a busy loop." },
      { difficulty: "Medium", prompt: "Extend the ReAct demo with a `calculate` tool and a question that needs search then arithmetic. Keep the text format and parsing." },
      { difficulty: "Medium", prompt: "Modify the Python loop so that after 3 identical tool calls it injects a user note: 'You have called X with the same input 3 times; try a different approach or answer with what you have.'" },
      { difficulty: "Hard", prompt: "Make the Python loop write a JSON-lines trace file with one record per step (step, stop_reason, tool calls, truncated results, tokens, elapsed ms). Write a 20-line script that replays a trace as a readable timeline." },
    ],
    interviewQuestions: [
      { question: "Describe the agent loop.", answer: "Call the model with the full history and tool definitions; append its response; if stop_reason is tool_use, execute each requested tool, append one user message with all tool_results, and repeat; otherwise stop. Wrap it with guards: max steps, token or cost budget, timeouts, repetition detection, and approval for risky actions." },
      { question: "What is ReAct?", answer: "Reasoning and Acting: a prompting pattern where the model interleaves reasoning ('Thought'), actions ('Action' calling a tool), and the results ('Observation') in a loop. It showed that letting models act and observe improves multi-step tasks. Native tool calling is the structured modern form of the same idea." },
      { question: "What stop reasons should an agent loop handle?", answer: "end_turn (done), tool_use (run tools and continue), max_tokens (truncated - not a valid final answer), stop_sequence (custom stop string), refusal (stop and surface), and pause_turn (server tools paused; resend to continue). Anything unexpected should be logged and handled explicitly." },
      { question: "Why do long agent runs fail more often?", answer: "Errors compound: each step has some chance of a wrong action, and later steps build on earlier ones. The context also grows, adding noise and cost. Mitigations are feedback signals, clear tool errors, smaller tasks, step limits and checkpoints." },
      { question: "Why does every step re-send the whole conversation?", answer: "The API is stateless. The model only knows what is in the current request, so to remember earlier tool calls and results you must include them each time. Prompt caching can reduce the cost of the repeated prefix." },
      { question: "What should you log per step?", answer: "Step number, stop_reason, model text, each tool name and input, each result (truncated) and whether it errored, token usage and latency. This lets you reconstruct the trajectory and find where a run went wrong." },
    ],
    prerequisites: ["tool-use"],
    relatedTopics: ["build-an-agent-from-scratch", "agent-memory", "evaluating-agents", "observability-and-debugging", "cost-and-latency"],
    keywords: ["agent loop", "react", "reason act", "perceive think act observe", "stop_reason", "end_turn", "max_tokens", "pause_turn", "refusal", "max steps", "iteration limit", "guardrails"],
  },

  {
    id: "build-an-agent-from-scratch",
    title: "Build an Agent from Scratch",
    level: "intermediate",
    description: "Step by step: a real command-line agent with file, calculator and notes tools, a guarded loop, error handling, logging and human approval.",
    explanation: md(
      "You'll build a complete agent twice. First, an **offline JavaScript version** you can run here in the browser, with a scripted fake model so you can watch every step. Then a **real Python command-line agent** using the Anthropic SDK. Finally, the same agent rebuilt with the SDK's **tool runner**, which writes the loop for you. No framework needed: an agent is about 150 lines of ordinary code.",
      "**What we're building.** `mini_agent.py` answers questions about the files in a `workspace/` folder. It has five tools:",
      "- `list_files`\n- `read_file` (restricted to the workspace)\n- `calculator` (safe arithmetic)\n- `search_notes` (keyword search across workspace text files)\n- `save_note` (writes to `notes.txt`, so it needs human approval)",
      "Example task: 'Add up the amounts in budget.txt and save the total as a note.'",
      "**Why an agent here?** If every request were exactly 'read budget.txt, then sum it', a two-step workflow would be cheaper and more predictable. The questions are open-ended, though: the model must decide which files to read, whether it needs arithmetic, and when it knows enough. Start simple and add the loop only when the task needs it.",
      "**Step 1 - Set up.** Run `pip install anthropic`, set `ANTHROPIC_API_KEY`, and create a `workspace/` folder with a few text files. Keep the model id and limits as constants at the top (`MODEL`, `MAX_STEPS`).",
      "**Step 2 - Write the system prompt.** Give the model its role, environment and rules: 'Use tools instead of guessing. Always use the calculator for arithmetic. If a tool returns an error, read it and adjust. Say which files you used.' Short, concrete rules beat long essays.",
      "**Step 3 - Define the tools.** Each gets a name, a description (what it does, when to use it, what it returns), and a JSON Schema for its input. Most of the agent's quality comes from the descriptions.",
      "**Step 4 - Implement the tools safely.** This is ordinary code, and it's your security boundary:",
      "- `read_file` resolves the path and refuses anything outside the workspace, so `../../.ssh/id_rsa` or an absolute path fails. It also caps how much text it returns.\n- `calculator` must **never** call `eval()` on model text, which would run arbitrary code. It parses the expression into a syntax tree (Python's `ast` module) and evaluates only numbers and `+ - * / ** %`, with an exponent cap so `9**9**9` can't freeze your machine.\n- `search_notes` does a case-insensitive keyword search and returns up to 20 `file:line: text` hits.\n- `save_note` appends to a file (a side effect), so it's marked **risky**.",
      "**Step 5 - Write the dispatcher.** `run_tool(name, input)` maps names to functions and raises on bad input or unknown tools. The loop catches exceptions and turns them into `is_error` results so the model can recover.",
      "**Step 6 - Add the human-approval gate.** Before running a tool in `RISKY_TOOLS`, show what the agent wants to do and ask `Allow? [y/N]`. If the human says no, return an `is_error` result saying the user denied it, so the model carries on without it instead of retrying.",
      "**Step 7 - Write the loop.** Call the model with system prompt, tools and history. Log stop_reason and token usage, and append the assistant content unchanged. On `end_turn`, return the text. On `max_tokens` or `refusal`, stop with a clear message. On `tool_use`, run every tool_use block and append **all** results in **one** user message (this handles parallel tool calls). Repeat up to `MAX_STEPS`, then stop with an explanation.",
      "**Step 8 - Log every step.** One line per model call (step, stop_reason, tokens) and one per tool call (name, input, first 200 characters of output or the error). When the agent misbehaves, this log tells you why.",
      "**Step 9 - Run it and read the trace.** Try a task that needs several tools, one that triggers an error (ask for a missing file), one that tries to escape the workspace, and one that saves a note (answer 'n' and watch it adapt).",
      "**Step 10 - Simplify with the tool runner.** Once you understand the loop, the SDK's beta tool runner can run it. Decorate plain Python functions with `@beta_tool` (type hints and docstrings become the schema and description) and iterate over `client.beta.messages.tool_runner(...)`. Same tools, same safety code; you just stop hand-writing the loop.",
    ),
    analogy:
      "Building an agent is like setting up a new intern's desk. The system prompt is the onboarding note. The tools are the keys you hand over (filing room, calculator, but not the company credit card). The approval gate is 'ask me before you send anything outside'. The max-steps guard is 'if you're not done by 5pm, tell me where you got stuck'. The log is their notebook of everything they did.",
    examples: [
      {
        title: "Complete offline agent: watch every step (runnable)",
        code: `// ---------- 1. The environment: a tiny fake workspace ----------
const workspace = {
  "todo.txt": "buy milk\\nship release 1.2\\ncall the bank",
  "budget.txt": "rent 1200\\nfood 450\\ntransport 130",
};
const notes = ["Release 1.2 is due on Friday.", "The bank closes at 5pm."];

// ---------- 2. Safe calculator: a tiny parser, NOT eval() ----------
function calculate(expr) {
  for (const ch of expr) if (!"0123456789.+-*/() ".includes(ch)) throw new Error("calculator only accepts numbers and + - * / ( )");
  const s = expr.split(" ").join("");
  let pos = 0;
  function number() {
    const start = pos;
    while (pos < s.length && "0123456789.".includes(s[pos])) pos++;
    if (start === pos) throw new Error("expected a number at position " + pos);
    return parseFloat(s.slice(start, pos));
  }
  function factor() {
    if (s[pos] === "(") { pos++; const v = sum(); if (s[pos] !== ")") throw new Error("missing )"); pos++; return v; }
    if (s[pos] === "-") { pos++; return -factor(); }
    return number();
  }
  function product() {
    let v = factor();
    while (s[pos] === "*" || s[pos] === "/") { const op = s[pos++]; const r = factor(); v = op === "*" ? v * r : v / r; }
    return v;
  }
  function sum() {
    let v = product();
    while (s[pos] === "+" || s[pos] === "-") { const op = s[pos++]; const r = product(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  const result = sum();
  if (pos !== s.length) throw new Error("unexpected character at position " + pos);
  return result;
}

// ---------- 3. Tools registry: name -> description + implementation ----------
const tools = {
  list_files: { description: "List files in the workspace.", run: () => Object.keys(workspace).join(", ") },
  read_file: {
    description: "Read a text file from the workspace. Path must be relative.",
    run: ({ path }) => {
      if (path.startsWith("/") || path.includes("..")) throw new Error("path escapes the workspace: " + path);
      if (!(path in workspace)) throw new Error("no such file: " + path + ". Available: " + Object.keys(workspace).join(", "));
      return workspace[path];
    },
  },
  calculator: { description: "Evaluate arithmetic exactly.", run: ({ expression }) => String(calculate(expression)) },
  search_notes: {
    description: "Keyword search over saved notes.",
    run: ({ query }) => {
      const hits = notes.filter((n) => n.toLowerCase().includes(query.toLowerCase()));
      return hits.length ? hits.join(" | ") : "no matches for " + query;
    },
  },
};

// ---------- 4. Fake LLM: returns API-shaped responses from a script ----------
// It "decides" based on how many rounds of tool results it has seen.
function llm(messages) {
  const rounds = messages.filter((m) => m.role === "user" && Array.isArray(m.content)).length;
  const lastResults = rounds ? messages[messages.length - 1].content : [];
  if (rounds === 0) return { stop_reason: "tool_use", content: [
    { type: "text", text: "Let me see what files exist." },
    { type: "tool_use", id: "t1", name: "list_files", input: {} } ] };
  if (rounds === 1) return { stop_reason: "tool_use", content: [   // two calls at once
    { type: "text", text: "I'll read the budget and check notes about the release." },
    { type: "tool_use", id: "t2", name: "read_file", input: { path: "budget.txt" } },
    { type: "tool_use", id: "t3", name: "search_notes", input: { query: "release" } } ] };
  if (rounds === 2) return { stop_reason: "tool_use", content: [
    { type: "text", text: "Maybe there are more costs in a parent folder." },
    { type: "tool_use", id: "t4", name: "read_file", input: { path: "../secrets.env" } } ] };
  if (rounds === 3) return { stop_reason: "tool_use", content: [
    { type: "text", text: "That was not allowed; I'll total what I have." },
    { type: "tool_use", id: "t5", name: "calculator", input: { expression: "1200 + 450 + 130" } } ] };
  const total = lastResults[0].content;
  return { stop_reason: "end_turn", content: [{ type: "text",
    text: "Your monthly costs total " + total + " (rent 1200 + food 450 + transport 130), from budget.txt. Note: Release 1.2 is due on Friday." }] };
}

// ---------- 5. The agent loop with max steps, errors and a step log ----------
function runAgent(task, maxSteps) {
  const messages = [{ role: "user", content: task }];
  for (let step = 1; step <= maxSteps; step++) {
    const resp = llm(messages);
    messages.push({ role: "assistant", content: resp.content });   // keep tool_use blocks
    for (const b of resp.content) if (b.type === "text") console.log("[step " + step + "] model: " + b.text);
    if (resp.stop_reason !== "tool_use") {
      console.log("[step " + step + "] stop_reason=" + resp.stop_reason + ", " + messages.length + " messages in history");
      return resp.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    }
    const results = [];
    for (const b of resp.content) {
      if (b.type !== "tool_use") continue;
      try {
        const tool = tools[b.name];
        if (!tool) throw new Error("unknown tool " + b.name);
        const output = tool.run(b.input);
        console.log("[step " + step + "]   " + b.name + JSON.stringify(b.input) + " -> " + JSON.stringify(output));
        results.push({ type: "tool_result", tool_use_id: b.id, content: output });
      } catch (err) {
        console.log("[step " + step + "]   " + b.name + JSON.stringify(b.input) + " -> ERROR " + err.message);
        results.push({ type: "tool_result", tool_use_id: b.id, content: "Error: " + err.message, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });               // ALL results, ONE message
  }
  return "Stopped: reached the limit of " + maxSteps + " steps.";
}

console.log("FINAL ANSWER: " + runAgent("What do my monthly costs add up to? Anything about the release?", 8));
console.log("With maxSteps=2: " + runAgent("Same question", 2));`,
        explanation: "It has everything a real agent has: a tool registry, a safe calculator, a workspace guard that rejects '../secrets.env', parallel tool calls answered in one message, an is_error result the model recovers from, a step log, and a max-steps guard (the second run shows it firing). Swap llm() for a real API call and you get the Python version below.",
        walkthrough: [
          { code: "function calculate(expr) { ... }", explanation: "A recursive-descent parser: sum handles + and -, product handles * and /, factor handles numbers, parentheses and unary minus. Only arithmetic can run; no eval()." },
          { code: "if (path.startsWith(\"/\") || path.includes(\"..\")) throw ...", explanation: "The workspace guard. The model can ask for any path; your code decides what's allowed." },
          { code: "function llm(messages) { ... }", explanation: "Stands in for the real model and returns the same shape as the API: stop_reason plus content blocks." },
          { code: "messages.push({ role: \"assistant\", content: resp.content });", explanation: "Append the model's full reply, tool_use blocks included, before adding results." },
          { code: "results.push({ ..., is_error: true });", explanation: "Failures become data the model can read, not crashes." },
          { code: "messages.push({ role: \"user\", content: results });", explanation: "All tool results for the turn go back together in one user message." },
        ],
      },
      {
        title: "mini_agent.py - the real command-line agent",
        language: "python",
        code: `"""mini_agent.py - a small command-line agent over a workspace folder.

Setup:  pip install anthropic
        export ANTHROPIC_API_KEY=...
        mkdir workspace && echo "rent 1200" > workspace/budget.txt
Run:    python mini_agent.py "What do the costs in budget.txt add up to? Save the total as a note."
"""
import ast
import json
import logging
import operator
import sys
from pathlib import Path

import anthropic

MODEL = "claude-opus-5-5"
MAX_STEPS = 12
MAX_FILE_CHARS = 20_000
WORKSPACE = Path("workspace").resolve()
NOTES_FILE = WORKSPACE / "notes.txt"
RISKY_TOOLS = {"save_note"}          # tools with side effects need a human "yes"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger("agent")
client = anthropic.Anthropic()

SYSTEM = """You are a careful assistant working inside a workspace folder of text files.
Rules:
- Use tools to look things up; never guess file contents.
- Always use the calculator for arithmetic, even simple sums.
- If a tool returns an error, read it and change your approach; do not repeat the same call.
- If the user denies an action, continue without it and mention that it was not done.
- Finish with a short answer that names the files you used."""

# ---------------- Step 3: tool definitions ----------------
TOOLS = [
    {"name": "list_files",
     "description": "List all files in the workspace, one relative path per line. "
                    "Use this first when you do not know which files exist.",
     "input_schema": {"type": "object", "properties": {}}},
    {"name": "read_file",
     "description": "Read a UTF-8 text file from the workspace and return its contents "
                    f"(at most {MAX_FILE_CHARS} characters). Paths are relative to the workspace, "
                    "e.g. 'budget.txt' or 'reports/q1.md'. Files outside the workspace cannot be read.",
     "input_schema": {"type": "object",
                      "properties": {"path": {"type": "string", "description": "Workspace-relative path"}},
                      "required": ["path"]}},
    {"name": "calculator",
     "description": "Evaluate an arithmetic expression exactly. Supports numbers, parentheses and "
                    "+ - * / ** %. Example: '(1200 + 450) * 0.2'. Returns the numeric result.",
     "input_schema": {"type": "object",
                      "properties": {"expression": {"type": "string"}},
                      "required": ["expression"]}},
    {"name": "search_notes",
     "description": "Case-insensitive keyword search across all .txt and .md files in the workspace. "
                    "Returns up to 20 matching lines as 'file:line: text'. Use short keywords.",
     "input_schema": {"type": "object",
                      "properties": {"query": {"type": "string", "description": "One or two keywords"}},
                      "required": ["query"]}},
    {"name": "save_note",
     "description": "Append a one-line note to notes.txt in the workspace. Requires user approval. "
                    "Only use when the user asks you to save or remember something.",
     "input_schema": {"type": "object",
                      "properties": {"text": {"type": "string", "maxLength": 500}},
                      "required": ["text"]}},
]

# ---------------- Step 4: safe tool implementations ----------------
def safe_path(relative: str) -> Path:
    path = (WORKSPACE / relative).resolve()          # resolves '..' and symlinks
    if not path.is_relative_to(WORKSPACE):           # Python 3.9+
        raise PermissionError(f"'{relative}' is outside the workspace")
    return path

_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
        ast.Div: operator.truediv, ast.Mod: operator.mod, ast.Pow: operator.pow,
        ast.USub: operator.neg, ast.UAdd: operator.pos}

def _eval(node):
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        left, right = _eval(node.left), _eval(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > 100:
            raise ValueError("exponent too large")
        return _OPS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.operand))
    raise ValueError("only numbers, parentheses and + - * / ** % are allowed")

def calculator(expression: str) -> str:
    if len(expression) > 200:
        raise ValueError("expression too long")
    return str(_eval(ast.parse(expression, mode="eval").body))   # parse, never eval()

def search_notes(query: str) -> str:
    hits = []
    for file in sorted(WORKSPACE.rglob("*")):
        if file.suffix not in {".txt", ".md"} or not file.is_file():
            continue
        lines = file.read_text(encoding="utf-8", errors="replace").splitlines()
        for n, line in enumerate(lines, 1):
            if query.lower() in line.lower():
                hits.append(f"{file.relative_to(WORKSPACE)}:{n}: {line.strip()}")
    return "\\n".join(hits[:20]) or f"No matches for '{query}'."

# ---------------- Step 5: dispatcher ----------------
def run_tool(name: str, args: dict) -> str:
    if name == "list_files":
        files = [str(p.relative_to(WORKSPACE)) for p in sorted(WORKSPACE.rglob("*")) if p.is_file()]
        return "\\n".join(files) or "(the workspace is empty)"
    if name == "read_file":
        path = safe_path(args["path"])
        if not path.is_file():
            raise FileNotFoundError(f"No file '{args['path']}'. Call list_files to see what exists.")
        text = path.read_text(encoding="utf-8", errors="replace")
        return text if len(text) <= MAX_FILE_CHARS else text[:MAX_FILE_CHARS] + "\\n[truncated]"
    if name == "calculator":
        return calculator(args["expression"])
    if name == "search_notes":
        return search_notes(args["query"])
    if name == "save_note":
        with NOTES_FILE.open("a", encoding="utf-8") as f:
            f.write(args["text"].replace("\\n", " ").strip() + "\\n")
        return "Saved to notes.txt"
    raise ValueError(f"Unknown tool '{name}'")

# ---------------- Step 6: human approval ----------------
def approved(name: str, args: dict) -> bool:
    if name not in RISKY_TOOLS:
        return True
    answer = input(f"\\nAgent wants to run {name}({json.dumps(args)}). Allow? [y/N] ")
    return answer.strip().lower() == "y"

# ---------------- Step 7 + 8: the loop, with logging ----------------
def run_agent(task: str) -> str:
    messages = [{"role": "user", "content": task}]
    for step in range(1, MAX_STEPS + 1):
        resp = client.messages.create(model=MODEL, max_tokens=16000, system=SYSTEM,
                                      tools=TOOLS, messages=messages)
        log.info("step %d stop=%s in=%d out=%d", step, resp.stop_reason,
                 resp.usage.input_tokens, resp.usage.output_tokens)
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":
            return "".join(b.text for b in resp.content if b.type == "text")
        if resp.stop_reason == "max_tokens":
            return "Stopped: the reply was cut off by max_tokens."
        if resp.stop_reason == "refusal":
            return "The model declined this request."
        if resp.stop_reason != "tool_use":
            return f"Stopped: unexpected stop_reason '{resp.stop_reason}'."

        results = []                                  # one entry per tool_use block
        for block in resp.content:
            if block.type != "tool_use":
                continue
            log.info("  -> %s %s", block.name, json.dumps(block.input))
            if not approved(block.name, block.input):
                results.append({"type": "tool_result", "tool_use_id": block.id, "is_error": True,
                                "content": "The user denied this action. Do not retry it."})
                log.info("  <- denied by user")
                continue
            try:
                output = run_tool(block.name, block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
                log.info("  <- %s", output[:200].replace("\\n", " | "))
            except Exception as e:                    # report errors to the model, never crash
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": f"Error: {e}", "is_error": True})
                log.info("  <- ERROR %s", e)
        messages.append({"role": "user", "content": results})   # ALL results in ONE message
    return f"Stopped after {MAX_STEPS} steps without a final answer."

if __name__ == "__main__":
    WORKSPACE.mkdir(exist_ok=True)
    task = " ".join(sys.argv[1:]) or input("Task: ")
    print("\\n" + run_agent(task))`,
        explanation: "About 170 lines, no framework. The security-critical parts are ordinary code you control: safe_path, the AST-based calculator, output caps, and the approval gate. Everything the model produces (tool names, paths, expressions) is treated as untrusted input.",
      },
      {
        title: "The same agent with the SDK tool runner",
        language: "python",
        code: `# runner_agent.py - reuses the safe helpers from mini_agent.py
import json
import anthropic
from anthropic import beta_tool
from mini_agent import SYSTEM, WORKSPACE, NOTES_FILE, MODEL, safe_path, calculator as calc, search_notes as search

client = anthropic.Anthropic()

@beta_tool
def list_files() -> str:
    """List all files in the workspace, one relative path per line."""
    return "\\n".join(str(p.relative_to(WORKSPACE)) for p in sorted(WORKSPACE.rglob("*")) if p.is_file())

@beta_tool
def read_file(path: str) -> str:
    """Read a UTF-8 text file from the workspace.
    Args:
        path: Workspace-relative path, e.g. 'budget.txt'.
    """
    try:
        return safe_path(path).read_text(encoding="utf-8", errors="replace")[:20_000]
    except Exception as e:
        return f"Error: {e}"          # return errors as text so the model can recover

@beta_tool
def calculator(expression: str) -> str:
    """Evaluate an arithmetic expression exactly (numbers, parentheses, + - * / ** %).
    Args:
        expression: For example '(1200 + 450) * 0.2'.
    """
    try:
        return calc(expression)
    except Exception as e:
        return f"Error: {e}"

@beta_tool
def search_notes(query: str) -> str:
    """Keyword search across .txt and .md files in the workspace.
    Args:
        query: One or two keywords.
    """
    return search(query)

@beta_tool
def save_note(text: str) -> str:
    """Append a one-line note to notes.txt. Only use when the user asks to save something.
    Args:
        text: The note to save.
    """
    if input(f"Allow save_note({json.dumps(text)})? [y/N] ").strip().lower() != "y":
        return "The user denied this action. Do not retry it."
    with NOTES_FILE.open("a", encoding="utf-8") as f:
        f.write(text.strip() + "\\n")
    return "Saved."

runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=16000,
    system=SYSTEM,
    tools=[list_files, read_file, calculator, search_notes, save_note],
    messages=[{"role": "user", "content": "Total the costs in budget.txt and save the total as a note."}],
)
for step, message in enumerate(runner, 1):      # one assistant message per loop iteration
    for block in message.content:
        if block.type == "text":
            print(f"[{step}] {block.text}")
        elif block.type == "tool_use":
            print(f"[{step}] tool {block.name} {block.input}")
    if step >= 12:                              # your own max-steps guard
        print("Stopping: step limit reached.")
        break`,
        explanation: "The decorator builds each tool's JSON Schema from type hints and its description from the docstring. The runner calls the model, runs requested tools, and feeds results back until the model stops. The safety code (workspace guard, safe calculator, approval) doesn't go away; it moves into the tool functions.",
      },
      {
        title: "A sample run log (what you should see)",
        language: "text",
        code: `$ python mini_agent.py "Total the costs in budget.txt and save the total as a note."
INFO step 1 stop=tool_use in=1450 out=60
INFO   -> read_file {"path": "budget.txt"}
INFO   <- rent 1200 | food 450 | transport 130
INFO step 2 stop=tool_use in=1540 out=55
INFO   -> calculator {"expression": "1200 + 450 + 130"}
INFO   <- 1780
INFO step 3 stop=tool_use in=1610 out=70
INFO   -> save_note {"text": "Monthly costs total 1780 (from budget.txt)"}

Agent wants to run save_note({"text": "Monthly costs total 1780 (from budget.txt)"}). Allow? [y/N] y
INFO   <- Saved to notes.txt
INFO step 4 stop=end_turn in=1700 out=40

Your monthly costs total 1780 (rent 1200 + food 450 + transport 130), from budget.txt.
I saved this total to notes.txt.`,
        explanation: "Illustrative output; token counts and wording differ every run. Input tokens grow each step because the whole history is re-sent.",
      },
    ],
    howItWorks: md(
      "The Python agent and the JavaScript demo share one skeleton: **messages** (the growing history), **TOOLS** (what the model may request), **run_tool** (what actually happens), and the **loop** (call, append, run, append, repeat). The model never runs code. It only emits tool_use blocks, and the dispatcher decides what to do with them.",
      "Parallel tool calls need no extra code. If the model returns three tool_use blocks in one turn, the inner `for block in resp.content` loop runs all three and the results go back in one user message. To speed it up, run independent tools concurrently with `concurrent.futures.ThreadPoolExecutor`, as long as each result keeps its `tool_use_id`.",
      "The approval gate sits between the model's request and execution. A denial is reported as an `is_error` result, so the conversation stays well-formed and the model can explain what it couldn't do. In a web app this becomes a 'pending approval' state the user resolves with a button.",
      "The tool runner automates the loop and schema generation, but you still own limits, safety and logging. Write the manual loop first so you know what the runner does for you.",
    ),
    diagram: `  user task
     |
     v
  +---------------- run_agent ----------------+
  |  messages ----> client.messages.create    |
  |     ^             |  log stop/tokens      |
  |     |        end_turn? --yes--> answer    |
  |     |             | tool_use              |
  |     |      for each tool_use block:       |
  |     |        risky? -> ask human (y/N)    |
  |     |        run_tool -> output | error   |
  |     +---- ONE user msg of tool_results    |
  |           step > MAX_STEPS -> stop        |
  +-------------------------------------------+
  tools: list_files read_file calculator
         search_notes save_note(risky)`,
    whyItExists: md(
      "Frameworks hide the loop behind abstractions, so when something breaks you can't see why. Building from scratch shows there's no magic: a model, a list of tools, a dispatcher and a loop. Then you can debug any framework, decide whether you need one, and put security controls where they belong: in your code, not the prompt.",
    ),
    whenToUse: md(
      "Build your own loop when you need full control over safety, logging and cost, when you have a few well-defined tools, when you're learning, or when a framework would add more complexity than it removes. Switch to the SDK tool runner once the manual loop is clear and you want less boilerplate.",
    ),
    whenNotToUse: md(
      "If the task is always the same two or three steps, write a workflow instead. If you need durable long-running agents (resume after crashes, distributed workers, scheduling), use an established agent framework or platform rather than growing this script forever. Never ship an approval-free version of a tool that sends, deletes or pays.",
    ),
    commonMistakes: [
      "Implementing a calculator with eval() or exec() on model output - that is remote code execution.",
      "Checking paths with string prefix tests (startswith) without resolving them first, so '..' or symlinks escape the workspace.",
      "Forgetting to cap file and search output, so one large file fills the context window.",
      "Letting a tool exception crash the agent instead of returning an is_error tool_result.",
      "Asking for approval but treating 'no' by silently skipping the tool_result, which breaks the tool_use/tool_result pairing.",
      "Writing the loop without MAX_STEPS 'just for testing' and forgetting to add it later.",
      "Logging full tool outputs that contain secrets or personal data to shared log files.",
      "Using the tool runner before understanding the manual loop, then being unable to debug it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the offline demo, then change the fake llm() so that at round 2 it asks for 'notes.txt' (which does not exist). Check the error message and confirm the loop continues." },
      { difficulty: "Easy", prompt: "Add a `*` precedence test to the JS calculator: confirm '2 + 3 * 4' returns 14 and '(2 + 3) * 4' returns 20, and that 'alert(1)' is rejected." },
      { difficulty: "Medium", prompt: "Build mini_agent.py on your machine with three text files in workspace/. Try to make it read ../mini_agent.py and confirm the guard blocks it. Paste the log." },
      { difficulty: "Medium", prompt: "Add a `write_file` tool that can only create new .md files inside workspace/drafts/, requires approval, and refuses to overwrite existing files." },
      { difficulty: "Hard", prompt: "Add a token budget to mini_agent.py: stop when cumulative input + output tokens exceed a limit and return a summary of the steps taken so far. Then add a JSON-lines trace file of every step." },
      { difficulty: "Hard", prompt: "Port the agent to the tool runner fully, including your write_file tool, and compare the two versions on five tasks. Note any behaviour differences and why." },
    ],
    interviewQuestions: [
      { question: "What are the minimum components of an agent you would build from scratch?", answer: "A system prompt, tool definitions with good descriptions and JSON Schemas, a dispatcher that runs tools safely and converts failures into is_error results, a loop that appends assistant content and all tool results each turn, and guards: max steps, budgets, approval for risky tools, and per-step logging." },
      { question: "How do you implement a calculator tool safely?", answer: "Never eval model text. Parse the expression into a syntax tree (for example with Python's ast module) and evaluate only whitelisted node types - numeric constants, binary and unary arithmetic operators - with limits on expression length and exponent size. Anything else raises an error that is returned to the model." },
      { question: "How do you restrict a file tool to a folder?", answer: "Join the requested path to the workspace, fully resolve it (which collapses '..' and follows symlinks), and check that the resolved path is still inside the resolved workspace directory before reading. Reject absolute paths and anything that resolves outside." },
      { question: "How would you add human-in-the-loop approval?", answer: "Classify tools by risk. Before executing a risky tool, show the exact name and arguments to a human and wait for an explicit yes. On denial, still return a tool_result for that id with is_error and a message saying the user denied it, so the model can continue without retrying." },
      { question: "What does the SDK tool runner change and what does it not?", answer: "It generates schemas from decorated functions and runs the call-execute-append loop for you. It does not remove the need for safe tool implementations, step limits, approval for side effects, logging and cost control - those remain your responsibility." },
      { question: "How do you test an agent like this without spending API credits?", answer: "Replace the model call with a scripted fake that returns API-shaped responses (tool_use blocks, then a final answer), and unit-test tools and the dispatcher directly - path guard, calculator, error paths, approval denial, and the max-steps exit." },
    ],
    prerequisites: ["tool-use", "the-agent-loop"],
    relatedTopics: ["what-is-an-agent", "agent-memory", "model-context-protocol", "ai-security", "evaluating-agents", "capstone-docs-assistant"],
    keywords: ["build an agent", "agent from scratch", "cli agent", "anthropic sdk", "tool runner", "beta_tool", "safe calculator", "ast", "path traversal", "human in the loop", "approval", "max steps", "dispatcher", "parallel tool calls"],
  },

  {
    id: "agent-memory",
    title: "Agent Memory",
    level: "intermediate",
    description: "How agents remember: the context window as working memory, summarization and compaction, and long-term stores with retrieval.",
    explanation: md(
      "LLMs have no memory between API calls. Everything an agent 'remembers' is something your code put in the next request. **Agent memory** is about deciding what to keep, what to compress, what to store outside the model, and what to bring back when needed.",
      "Terms borrowed from human memory help:",
      "- **Working memory (short-term)**: the current **context window**: system prompt, message history, and this run's tool calls and results. Fast and precise, but limited in size, and you pay for every token on every call.\n- **Long-term memory**: information stored *outside* the model (files, a database, a vector store). It survives across sessions and can be far larger than any context window.\n- Long-term memory is often split further: **semantic** (facts: 'the user prefers Python'), **episodic** (events: 'last Tuesday we migrated the billing DB and it failed on step 3'), and **procedural** (how to do things: instructions and learned rules, often in the system prompt or a rules file).",
      "**Managing working memory.** A long run fills the context with old tool outputs. Trouble starts before the hard limit: cost and latency grow every step, and models track details buried in very long contexts less reliably (sometimes called *context rot*). Techniques, simplest first:",
      "- **Trim tool outputs at the source**: return 20 relevant lines, not 2,000.\n- **Sliding window**: keep only the last N turns. Simple, but the agent forgets the goal unless you always keep the first user message.\n- **Clear old tool results**: swap bulky earlier results for a short placeholder like '[result removed - re-run read_file if needed]', keeping the tool_use/tool_result structure valid.\n- **Summarization / compaction**: when history passes a threshold, have the model summarize the older part (decisions, facts learned, open questions, files touched), then continue with *summary + recent turns*. You keep the essentials at a fraction of the tokens.\n- **Scratchpad / notes file**: give the agent a tool to write and read its own progress notes (a to-do list, findings). Its plan then survives even aggressive compaction.",
      "**Long-term memory** usually works through tools or automatic retrieval:",
      "- **Explicit memory tools**: `remember(fact)` and `recall(query)`. The model decides what to save. Simple and transparent; users can see what was stored and delete it.\n- **Retrieval-based memory**: store memories as embeddings (vectors that capture meaning, see Embeddings) in a vector store. Before each turn, retrieve the few most similar to the current message and add them to the prompt. This is RAG over the agent's own past.\n- **Structured profiles**: for known fields (name, timezone, plan tier), a normal database row beats fuzzy retrieval.",
      "Memory needs housekeeping. Memories go stale ('user works at Acme' after a job change), conflict, or hold sensitive data. Store a timestamp and source with each one, prefer newer facts, let users view and delete what's stored, and never save secrets like passwords or API keys.",
      "Some providers, including Anthropic, offer built-in context management (for example automatic compaction, clearing old tool results, and a client-side memory tool). They use the same ideas; check the current docs before relying on a specific one.",
    ),
    analogy:
      "Working memory is your desk: only so many papers fit, but everything is in front of you. Compaction is clearing the desk after a meeting by writing a one-page summary and filing the rest. Long-term memory is the filing cabinet: huge, but only useful if you know what to pull out, and if someone throws away the outdated folders.",
    examples: [
      {
        title: "Compaction: summarize old turns when over budget (runnable)",
        code: `// Token counting approximated by words, just for the demo.
const countTokens = (msgs) => msgs.reduce((n, m) => n + m.content.split(" ").length, 0);

// Fake summarizer LLM: keeps only sentences containing decisions or preferences.
function summarize(msgs) {
  const keep = msgs.filter((m) => ["decided", "prefers", "deadline"].some((w) => m.content.includes(w)));
  return "Summary of earlier conversation: " + keep.map((m) => m.content).join(" ");
}

function compact(system, msgs, budget, keepRecent) {
  if (countTokens(msgs) <= budget) return { system, msgs };
  let cut = msgs.length - keepRecent;
  while (cut < msgs.length && msgs[cut].role !== "user") cut++;   // recent part must start with a user turn
  const summary = summarize(msgs.slice(0, cut));
  return { system: system + " " + summary, msgs: msgs.slice(cut) };
}

let system = "You are a project assistant.";
let msgs = [
  { role: "user", content: "Let's plan the website relaunch for the bakery client" },
  { role: "assistant", content: "Sure. What matters most to them?" },
  { role: "user", content: "The client prefers a green colour scheme and hates pop ups" },
  { role: "assistant", content: "Noted. Any hard dates?" },
  { role: "user", content: "The deadline is the 3rd of June because of their anniversary sale" },
  { role: "assistant", content: "Then we should freeze the design two weeks before." },
  { role: "user", content: "Agreed, we decided to use the existing logo, no redesign" },
  { role: "assistant", content: "Great, that saves a week of work on branding and approvals." },
  { role: "user", content: "Now draft the homepage sections please" },
];

console.log("before:", msgs.length, "messages,", countTokens(msgs), "tokens");
const out = compact(system, msgs, 60, 3);
console.log("after :", out.msgs.length, "messages,", countTokens(out.msgs), "tokens");
console.log("system now:", out.system);
console.log("first kept message:", out.msgs[0].role, "-", out.msgs[0].content);`,
        explanation: "Old turns fold into a short summary in the system prompt; recent turns stay verbatim. The cut point shifts so the kept history starts with a user message, keeping roles valid. A real summarizer is an LLM call told what to preserve.",
      },
      {
        title: "Retrieval-based long-term memory with tiny vectors (runnable)",
        code: `const STOP = new Set(["the", "is", "a", "for", "of", "should", "be", "how", "which", "what", "my", "to", "on", "does"]);
function embed(text) {                  // toy bag-of-words "embedding"
  const v = {};
  for (const w of text.toLowerCase().split(/[^a-z0-9]+/)) if (w && !STOP.has(w)) v[w] = (v[w] || 0) + 1;
  return v;
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; }
  for (const k in b) nb += b[k] * b[k];
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const memory = [];
function remember(text, day) { memory.push({ text, day, vec: embed(text) }); }
function recall(query, k) {
  const q = embed(query);
  return memory
    .map((m) => ({ ...m, score: cosine(q, m.vec) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

remember("User prefers Python for data scripts", 1);
remember("User dog is named Biscuit", 2);
remember("Project deadline is 3 June", 3);
remember("User dislikes long answers, keep replies short", 4);
remember("Project deadline moved to 10 June", 9);

for (const q of ["which language for data scripts", "how long should replies be", "project deadline"]) {
  const hits = recall(q, 2);
  console.log(q, "->", hits.map((h) => h.text + " (" + h.score.toFixed(2) + ", day " + h.day + ")").join(" | "));
}
// Pure similarity ranked the STALE deadline first (shorter text, higher score).
// Fix: among relevant hits, prefer the newest, and label memories with their date.
const relevant = recall("project deadline", 3).filter((m) => m.score >= 0.5);
const newest = relevant.sort((a, b) => b.day - a.day)[0];
console.log("prompt context: - (saved day " + newest.day + ") " + newest.text);`,
        explanation: "Each memory is stored with a vector. At question time, the most similar memories are retrieved and added to the prompt. The conflicting deadlines show a real trap: similarity alone ranks the outdated deadline first, so you need timestamps and a recency rule (here, the newest relevant memory wins). Real systems use a real embedding model and a vector store.",
      },
      {
        title: "Long-term memory as tools, persisted in a JSON file",
        language: "python",
        code: `import json, time
from pathlib import Path

MEMORY_FILE = Path("memory.json")

MEMORY_TOOLS = [
    {"name": "remember",
     "description": "Save a durable fact about the user or project for future sessions "
                    "(preferences, decisions, deadlines). Do NOT save secrets, passwords or "
                    "one-off details. Write the fact as one self-contained sentence.",
     "input_schema": {"type": "object",
                      "properties": {"fact": {"type": "string", "maxLength": 300}},
                      "required": ["fact"]}},
    {"name": "recall",
     "description": "Search saved facts by keyword. Use at the start of a task when past "
                    "preferences or decisions could matter. Returns newest matches first.",
     "input_schema": {"type": "object",
                      "properties": {"query": {"type": "string"}},
                      "required": ["query"]}},
]

def _load() -> list[dict]:
    return json.loads(MEMORY_FILE.read_text()) if MEMORY_FILE.exists() else []

def remember(fact: str) -> str:
    items = _load()
    items.append({"fact": fact.strip(), "saved_at": time.strftime("%Y-%m-%d %H:%M")})
    MEMORY_FILE.write_text(json.dumps(items, indent=2))
    return "remembered"

def recall(query: str) -> str:
    words = [w for w in query.lower().split() if len(w) > 2]
    hits = [m for m in _load() if any(w in m["fact"].lower() for w in words)]
    hits.sort(key=lambda m: m["saved_at"], reverse=True)
    return "\\n".join(f"[{m['saved_at']}] {m['fact']}" for m in hits[:10]) or "no saved facts match"

# Add MEMORY_TOOLS to your agent's tool list and route "remember"/"recall" in run_tool.
# Upgrade path: swap keyword matching for embeddings + a vector store (e.g. Chroma).`,
        explanation: "The model decides what to save and when to look things up. Memory lives in a plain file, so users can inspect and edit it, which matters for trust and privacy.",
      },
      {
        title: "Compacting an agent's history with an LLM summary",
        language: "python",
        code: `import json
import anthropic

client = anthropic.Anthropic()

def render(m: dict) -> str:
    """Turn one message (string or content blocks) into readable text for the summarizer."""
    if isinstance(m["content"], str):
        return f"{m['role']}: {m['content']}"
    parts = []
    for b in m["content"]:
        b = b if isinstance(b, dict) else b.model_dump()      # SDK blocks are pydantic models
        if b["type"] == "text":
            parts.append(b["text"])
        elif b["type"] == "tool_use":
            parts.append(f"[called {b['name']} {json.dumps(b['input'])}]")
        elif b["type"] == "tool_result":
            parts.append(f"[result: {str(b['content'])[:500]}]")
    return f"{m['role']}: " + " ".join(parts)

def compact(messages: list, keep_recent: int = 6) -> list:
    # Cut only at a plain user message, so no tool_use is separated from its tool_result.
    cut = len(messages) - keep_recent
    while cut < len(messages) and not (messages[cut]["role"] == "user"
                                       and isinstance(messages[cut]["content"], str)):
        cut += 1
    if cut <= 1 or cut >= len(messages):
        return messages                                         # nothing safe to compact
    transcript = "\\n".join(render(m) for m in messages[:cut])
    summary = client.messages.create(
        model="claude-opus-5-5", max_tokens=2000,
        system="You compress agent transcripts. Keep: the original goal, decisions, facts "
               "learned, files touched, errors seen, and open next steps. Be terse.",
        messages=[{"role": "user", "content": transcript}],
    ).content[0].text
    first = messages[cut]
    return [{"role": "user",
             "content": f"Summary of earlier work:\\n{summary}\\n\\nContinue with: {first['content']}"}] \\
           + messages[cut + 1:]

# In the loop: if resp.usage.input_tokens > THRESHOLD: messages = compact(messages)`,
        explanation: "The tricky part is choosing a safe cut point: never separate a tool_use from its tool_result. Folding the summary into the first kept user message keeps roles alternating.",
      },
    ],
    howItWorks: md(
      "Every call is built fresh: system prompt (instructions, maybe plus retrieved long-term memories) + message history (working memory, maybe compacted) + the new user message. Memory management is just the code that assembles that request.",
      "Compaction trades detail for space. A good summary prompt lists what must survive: the goal, constraints, decisions, facts learned, what was tried and failed, and next steps. Without that, summaries drop the one detail that mattered.",
      "Retrieval-based memory follows the RAG pipeline:",
      "- **Write**: embed and store with metadata such as time, user and source.\n- **Read**: embed the current query, find nearest neighbours, filter by user and recency.\n- **Inject**: add the top few to the prompt, clearly labelled as memories that may be outdated.",
      "Scoping by user id is essential: one user's memories must never leak into another's prompt.",
    ),
    diagram: `   each model call is assembled from:
  +------------------------------------------+
  | system: instructions                     |
  |         + recalled long-term memories <--+-- vector store /
  |         + summary of old turns           |   files / DB
  | messages: recent turns (verbatim)        |
  |           + new user message             |
  +------------------------------------------+
        |  context full?  -> compact old turns
        |  new durable fact? -> remember() -> store`,
    whyItExists: md(
      "Context windows are finite, and every token costs money and time on every step. Yet useful assistants must stay coherent through long tasks and remember users across sessions. Memory techniques keep the important parts of a long history and past knowledge without stuffing everything into every request.",
    ),
    whenToUse: md(
      "Use compaction or result-clearing for long-running agents (coding sessions, research) whose history grows too large. Use long-term memory for assistants that serve the same user repeatedly and benefit from past preferences and decisions. Use a notes/scratchpad tool for multi-hour tasks that need a persistent plan.",
    ),
    whenNotToUse: md(
      "Short, single-session tasks need no memory system; the message history is enough. Don't add vector memory when a few database fields would do. Avoid persistent memory where privacy rules forbid storing user data, or where stale memories could cause harm (medical, legal) without careful review.",
    ),
    commonMistakes: [
      "Assuming the model remembers previous API calls - it does not; you must resend or re-inject.",
      "Cutting history in the middle of a tool_use/tool_result pair, causing API errors.",
      "Using a sliding window that drops the original task, so the agent forgets what it was doing.",
      "Summaries that lose the decisive details because the summary prompt did not say what to keep.",
      "Storing every message as a memory, so retrieval returns noise.",
      "Never expiring or updating memories, so outdated facts override current ones.",
      "Mixing memories across users or tenants in one unfiltered vector index.",
      "Saving secrets or sensitive personal data into long-term memory.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In the compaction demo, change the budget to 200 and to 30. What changes, and why?" },
      { difficulty: "Easy", prompt: "Add a memory 'User prefers TypeScript for web scripts' on day 12 to the retrieval demo and query 'which language for scripts'. Explain the ranking." },
      { difficulty: "Medium", prompt: "Write a summary prompt for a coding agent's compaction step. List the exact sections it must output and test it on a transcript of one of your own agent runs." },
      { difficulty: "Medium", prompt: "Add `remember` and `recall` to mini_agent.py from Build an Agent from Scratch, and verify a fact saved in one run is recalled in the next." },
      { difficulty: "Hard", prompt: "Replace the JSON memory with Chroma and sentence-transformers: store each fact with user_id and timestamp metadata, retrieve with a where-filter on user_id, and break ties by recency." },
    ],
    interviewQuestions: [
      { question: "What is working memory for an LLM agent?", answer: "The contents of the current context window: system prompt, message history, tool calls and results. It is the only thing the model can see on a call, and it is limited and paid for on every request." },
      { question: "How does compaction work and what are its risks?", answer: "When history grows too large, older turns are summarized (usually by the model) and replaced with the summary while recent turns stay verbatim. Risks: losing critical details, breaking tool_use/tool_result pairs at the cut point, and summarizing errors as facts. Mitigate with an explicit summary template and safe cut points." },
      { question: "Explain retrieval-based memory.", answer: "Memories are embedded and stored with metadata in a vector store. On each new request, the query is embedded, the most similar memories for that user are retrieved, filtered for recency, and inserted into the prompt. It scales memory far beyond the context window." },
      { question: "Semantic vs episodic vs procedural memory?", answer: "Semantic: facts and preferences. Episodic: records of past events and interactions. Procedural: how to do things - instructions, rules and learned workflows, often kept in system prompts or rule files." },
      { question: "How do you handle conflicting or stale memories?", answer: "Store timestamps and sources, prefer newer facts, allow updates and deletes (including by the user), periodically consolidate duplicates, and label injected memories as possibly outdated so the model checks them when it matters." },
      { question: "Why not just use a model with a huge context window?", answer: "Cost and latency scale with tokens on every call, and models use details in very long contexts less reliably. Long-term memory also must survive across sessions, which a context window cannot do on its own." },
    ],
    prerequisites: ["the-agent-loop", "tokens-and-context-windows", "embeddings"],
    relatedTopics: ["agentic-rag", "conversational-rag", "vector-databases", "cost-and-latency", "build-an-agent-from-scratch"],
    keywords: ["agent memory", "working memory", "long-term memory", "context window", "compaction", "summarization", "sliding window", "episodic memory", "semantic memory", "memory tool", "context rot", "scratchpad"],
  },

  {
    id: "model-context-protocol",
    title: "Model Context Protocol (MCP)",
    level: "intermediate",
    description: "An open standard for plugging tools, data and prompts into any AI application through MCP servers.",
    explanation: md(
      "The **Model Context Protocol (MCP)** is an open protocol for connecting AI applications to external tools and data. Instead of every app writing custom code for every service (GitHub, a database, your file system, Slack...), each service is wrapped once as an **MCP server**, and any MCP-compatible app can use it. It's often compared to USB-C: one standard plug instead of a drawer of adapters.",
      "Without MCP, connecting M apps to N services needs up to M x N custom integrations. With MCP you need M clients and N servers.",
      "MCP has three roles:",
      "- **Host**: the AI app the user works in: a desktop chat app, an IDE, a coding agent, or your own agent. The host owns the model and decides what it may do.\n- **Client**: a connector inside the host that keeps a connection to **one** server. A host with three servers runs three clients.\n- **Server**: a program that exposes capabilities, such as a 'notes', 'postgres' or 'github' server. It can run locally as a subprocess or remotely over the network.",
      "Servers offer three main kinds of capabilities (**primitives**):",
      "- **Tools**: functions the model can call, with a name, description and JSON Schema, just like in Tool Use. *Model-controlled*: the model decides when to call them.\n- **Resources**: read-only data identified by a URI (a file, a database schema, a document) that the host can attach to the context. *Application-controlled*.\n- **Prompts**: reusable templates with arguments (for example 'summarize-pr' with a PR number) that the user picks, often as slash commands. *User-controlled*.",
      "Clients can also offer capabilities to servers, such as **sampling** (a server asks the host's model to generate text, with the host in control) and **roots** (the host tells the server which folders it may use).",
      "**Transports** define how messages travel. Messages are **JSON-RPC 2.0**: each request has a `method`, `params` and an `id`, and each response carries the matching `id`. The two standard transports:",
      "- **stdio**: the host launches the server as a local subprocess and they talk over standard input and output. Simple and private; ideal for local tools.\n- **Streamable HTTP**: the server runs as a web service; the client sends HTTP POST requests and the server can stream responses. Used for remote, shared or hosted servers, usually with authentication (OAuth).",
      "A session starts with an **initialize** handshake where both sides declare their protocol version and capabilities. Then the client can call `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list` and `prompts/get`.",
      "**Security matters.** An MCP server runs code with whatever permissions you give it, and its tool descriptions and outputs go straight into the model's context. So:",
      "- Only install servers you trust, and review the tools they expose.\n- Prefer read-only or narrowly scoped servers.\n- Keep approval prompts on for actions with side effects.\n- Remember that data a server returns (web pages, issues, emails) can contain prompt-injection attempts.",
    ),
    analogy:
      "MCP is like a standard electrical socket. Appliance makers (server authors) build one plug; house builders (host apps) install standard sockets; anything plugs into anything. The host is the house, each client a socket, each server an appliance. You still shouldn't plug in a stranger's device without checking it first.",
    examples: [
      {
        title: "A complete MCP server in Python with FastMCP",
        language: "python",
        code: `# notes_server.py     pip install mcp
import sys
from pathlib import Path
from mcp.server.fastmcp import FastMCP

NOTES = Path.home() / "mcp-notes.txt"
mcp = FastMCP("notes")

@mcp.tool()
def add_note(text: str) -> str:
    """Save a short note for the user. Use when they ask you to remember or jot something down."""
    with NOTES.open("a", encoding="utf-8") as f:
        f.write(text.strip() + "\\n")
    print(f"saved note ({len(text)} chars)", file=sys.stderr)   # log to stderr, never stdout
    return "saved"

@mcp.tool()
def search_notes(query: str) -> str:
    """Return saved notes that contain the query (case-insensitive), newest last."""
    if not NOTES.exists():
        return "no notes yet"
    hits = [line for line in NOTES.read_text(encoding="utf-8").splitlines()
            if query.lower() in line.lower()]
    return "\\n".join(hits) or "no matching notes"

@mcp.resource("notes://all")
def all_notes() -> str:
    """Every saved note, as plain text."""
    return NOTES.read_text(encoding="utf-8") if NOTES.exists() else ""

@mcp.prompt()
def weekly_review() -> str:
    """Review this week's notes."""
    return "Read my notes (resource notes://all) and group them into: done, in progress, ideas."

if __name__ == "__main__":
    mcp.run()          # stdio transport by default
    # mcp.run(transport="streamable-http")  # to serve over HTTP instead`,
        explanation: "FastMCP builds each tool's JSON Schema from type hints and its description from the docstring, like the SDK tool runner. With stdio, stdout carries protocol messages, so any print() to stdout corrupts the stream. Log to stderr.",
      },
      {
        title: "Registering the server in a desktop host's config",
        language: "json",
        code: `{
  "mcpServers": {
    "notes": {
      "command": "python",
      "args": ["/absolute/path/to/notes_server.py"]
    }
  }
}`,
        explanation: "Hosts that launch local stdio servers take a command and arguments. This is the shape of Claude Desktop's claude_desktop_config.json; other hosts use similar entries. Use absolute paths, since the host may start the server from a different working directory.",
      },
      {
        title: "Your own agent as an MCP host: list tools and call them",
        language: "python",
        code: `# pip install mcp anthropic
import asyncio
import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

client = anthropic.Anthropic()
server = StdioServerParameters(command="python", args=["notes_server.py"])

async def main():
    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()                       # handshake
            listed = await session.list_tools()              # tools/list
            tools = [{"name": t.name, "description": t.description or "",
                      "input_schema": t.inputSchema} for t in listed.tools]

            messages = [{"role": "user", "content": "Note that the demo is on Friday, then show my notes."}]
            for _ in range(8):                                # max-steps guard
                resp = client.messages.create(model="claude-opus-5-5", max_tokens=16000,
                                              tools=tools, messages=messages)
                messages.append({"role": "assistant", "content": resp.content})
                if resp.stop_reason != "tool_use":
                    break
                results = []
                for block in resp.content:
                    if block.type == "tool_use":
                        out = await session.call_tool(block.name, block.input)   # tools/call
                        text = "\\n".join(c.text for c in out.content if c.type == "text")
                        results.append({"type": "tool_result", "tool_use_id": block.id,
                                        "content": text, "is_error": bool(out.isError)})
                messages.append({"role": "user", "content": results})
            print("".join(b.text for b in resp.content if b.type == "text"))

asyncio.run(main())`,
        explanation: "MCP tool definitions map one-to-one onto API tool definitions (name, description, inputSchema). The agent loop is the one you know; only run_tool is replaced by session.call_tool.",
      },
      {
        title: "What travels over the wire: JSON-RPC messages (runnable simulation)",
        code: `// A toy in-memory MCP-like server, to show the message shapes.
const server = {
  tools: [{ name: "add_note", description: "Save a note.",
            inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } }],
  notes: [],
  handle(msg) {
    if (msg.method === "initialize")
      return { jsonrpc: "2.0", id: msg.id, result: { serverInfo: { name: "notes" }, capabilities: { tools: {} } } };
    if (msg.method === "tools/list")
      return { jsonrpc: "2.0", id: msg.id, result: { tools: this.tools } };
    if (msg.method === "tools/call" && msg.params.name === "add_note") {
      this.notes.push(msg.params.arguments.text);
      return { jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: "saved" }], isError: false } };
    }
    return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "Method not found" } };
  },
};

let nextId = 1;
function send(method, params) {
  const req = { jsonrpc: "2.0", id: nextId++, method, params };
  console.log("client ->", JSON.stringify(req));
  const res = server.handle(req);
  console.log("server <-", JSON.stringify(res));
  return res;
}

send("initialize", { clientInfo: { name: "my-agent" } });
send("tools/list", {});
send("tools/call", { name: "add_note", arguments: { text: "demo on Friday" } });
send("tools/delete_everything", {});
console.log("server state:", server.notes);`,
        explanation: "Simplified (the real initialize also exchanges protocol versions, and transports add framing), but the essence is right: JSON-RPC requests with method, params and id; responses with the same id and either result or error. -32601 is JSON-RPC's standard 'method not found' code.",
      },
    ],
    howItWorks: md(
      "On startup, the host launches or connects to each configured server and runs the initialize handshake. It lists each server's tools (and resources and prompts) and merges the tool definitions into what it sends the model. When the model emits a tool_use for an MCP tool, the host routes it to the right client, which sends `tools/call` to its server and returns the result as a tool_result. To the model, MCP tools look like any other tools.",
      "Servers can notify clients when their lists change (for example, new tools appear), and long operations can report progress. Remote servers over Streamable HTTP usually use OAuth so each user grants access with their own identity.",
      "Every connected server's tool definitions go into the context, so dozens of servers cost tokens on every call and make tool selection harder. Connect only what the task needs.",
    ),
    diagram: `  +------------------ HOST (AI app) -------------------+
  |   model  <-->  agent loop                          |
  |                  |        |          |             |
  |              [client]  [client]   [client]         |
  +-----------------|---------|----------|-------------+
                  stdio     stdio   Streamable HTTP
                    |         |          |
               [notes     [files     [remote API
                server]   server]    server]
     each server offers: tools | resources | prompts
     messages: JSON-RPC 2.0  (initialize, tools/list,
               tools/call, resources/read, prompts/get)`,
    whyItExists: md(
      "Every AI app needed the same integrations, rewritten for each app with slightly different tool formats. MCP separates *who builds the integration* from *who uses it*. Write a server once and it works in many hosts; build a host once and it can use a whole ecosystem of servers.",
    ),
    whenToUse: md(
      "Use MCP when your tools should work from several AI apps (desktop chat, IDE, your own agent), when you want to reuse community or vendor servers instead of writing integrations, or when you want a clean process boundary between the agent and the systems it touches.",
    ),
    whenNotToUse: md(
      "For one agent with three small in-process tools, plain tool definitions in your code are simpler and faster; MCP adds a process, a protocol and a dependency. Don't connect untrusted or unreviewed servers to an agent with access to sensitive data or powerful actions.",
    ),
    commonMistakes: [
      "Printing debug output to stdout in a stdio server, corrupting the JSON-RPC stream.",
      "Using relative paths in host configs, so the server fails to start from the host's working directory.",
      "Installing third-party servers without reading what tools they expose and what permissions they need.",
      "Connecting many servers at once, flooding the context with tool definitions and confusing tool choice.",
      "Writing vague tool docstrings - with FastMCP the docstring is the description the model reads.",
      "Treating server output as trusted; text from issues, pages or emails can carry prompt injection.",
      "Confusing tools with resources: tools are model-invoked actions, resources are data the application attaches.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain host, client and server using an IDE with two MCP servers as the example. How many clients are there?" },
      { difficulty: "Easy", prompt: "Extend the runnable JSON-RPC simulation with a `resources/read` method for `notes://all` that returns all notes." },
      { difficulty: "Medium", prompt: "Run the FastMCP notes server and connect it to a desktop host or to the Python client example. Save and search notes through the model." },
      { difficulty: "Medium", prompt: "Add a `delete_note(index: int)` tool to the server. In your client, require human approval before forwarding it." },
      { difficulty: "Hard", prompt: "Wrap the read-only tools of mini_agent.py (list_files, read_file, search_notes) as an MCP server with a configurable workspace root, then use it from the client example. Keep the path guard." },
    ],
    interviewQuestions: [
      { question: "What problem does MCP solve?", answer: "It standardizes how AI applications discover and use external tools, data and prompts, turning an M x N integration problem into M + N: each service is wrapped once as a server, each app implements the client side once." },
      { question: "Explain host, client and server.", answer: "The host is the AI application that owns the model and user interaction. Inside it, each client holds a connection to exactly one server. Servers expose tools, resources and prompts, running locally over stdio or remotely over HTTP." },
      { question: "Tools vs resources vs prompts?", answer: "Tools are model-controlled functions with side effects or computation. Resources are application-controlled read-only data addressed by URI. Prompts are user-controlled templates, often surfaced as slash commands." },
      { question: "What transports does MCP use?", answer: "Messages are JSON-RPC 2.0. stdio runs the server as a local subprocess communicating over stdin/stdout; Streamable HTTP runs it as a web service for remote use, usually with OAuth for authorization." },
      { question: "What are the security risks of MCP servers?", answer: "Servers execute code with your permissions, their descriptions and outputs enter the model context (enabling prompt injection or misleading tool descriptions), and broad servers expand what a hijacked agent could do. Mitigate with trusted sources, least privilege, approvals for side effects and isolation." },
      { question: "How does an agent use MCP tools in its loop?", answer: "It lists tools from each session, converts them to API tool definitions, and when the model returns a tool_use for one, calls session.call_tool with the name and input, then returns the content as a tool_result (marking is_error when the server reports an error)." },
    ],
    prerequisites: ["tool-use"],
    relatedTopics: ["tool-use", "build-an-agent-from-scratch", "ai-security", "multi-agent-systems"],
    keywords: ["mcp", "model context protocol", "mcp server", "mcp client", "host", "fastmcp", "json-rpc", "stdio", "streamable http", "resources", "prompts", "tools", "sampling", "integrations"],
  },

  {
    id: "agentic-rag",
    title: "Agentic RAG",
    level: "intermediate",
    description: "Retrieval as a tool: the model decides when to search, what to search for, and when it has enough to answer.",
    explanation: md(
      "Classic **RAG** (retrieval-augmented generation) is a fixed pipeline: take the question, retrieve the top-k chunks, put them in the prompt, generate an answer. It always retrieves exactly once, using the user's words as the query. That works for direct questions, but fails when the first search misses, when the answer needs facts from several places, or when no retrieval is needed.",
      "**Agentic RAG** makes retrieval a **tool** inside an agent loop. The model decides:",
      "- **Whether** to retrieve ('What is 2 + 2?' needs no search; 'What is our refund policy?' does).\n- **What** to search for: it can rewrite a vague question into precise queries, or split a comparison into one query per item.\n- **Where** to search, if you offer several tools: a docs index, a ticket database, a SQL tool, the web.\n- **Whether the results are enough**: if hits are irrelevant or point to another document, it searches again with a new query (**iterative retrieval**), then answers.",
      "**Multi-hop questions** are where this shines. 'Who approves refunds for the product our biggest customer uses?' means: find the biggest customer, then their product, then that product's refund approver. One similarity search for the whole question rarely finds all three; an agent can follow the chain.",
      "Most of the work is designing the retrieval tool:",
      "- Describe the corpus in the tool description ('Searches the internal HR and IT policy handbook. Not for customer data.').\n- Return results with **source ids** (file, section, URL) so the model can cite them, with snippets short enough to keep context small.\n- Offer useful parameters (`k`, a metadata filter like `source` or `date_after`), but keep the schema small.\n- Return an explicit 'no results' message so the model rephrases instead of inventing.",
      "The system prompt sets the rules: search before answering questions about internal facts, cite sources by id, try a new query when results look irrelevant, stop after a few searches, and say 'I could not find this' instead of guessing. With a max-steps guard, this keeps cost bounded.",
      "The trade-off: agentic RAG is slower, costs more per question (several model calls instead of one), and is less predictable. Many production systems use a hybrid: a fast fixed pipeline for most questions and an agentic path for complex ones, picked by a router (see Workflow Patterns).",
    ),
    analogy:
      "Classic RAG is a librarian who, whatever you ask, hands you the five books whose titles best match your sentence. Agentic RAG is a research assistant who reads your question, decides whether books are needed, looks something up, spots a footnote pointing to another book, fetches that too, and returns with an answer and page numbers.",
    examples: [
      {
        title: "Iterative retrieval with a fake model (runnable)",
        code: `const docs = [
  { id: "refunds.md", text: "Refunds are allowed within 30 days of purchase. Return shipping costs are covered by the shipping policy." },
  { id: "shipping.md", text: "Shipping policy: we pay return shipping for damaged items; otherwise the customer pays 5 EUR." },
  { id: "careers.md", text: "We are hiring backend engineers in Lisbon." },
];

// Retrieval tool: simple keyword overlap scoring (real systems use embeddings/BM25).
function searchDocs(query, k) {
  const words = query.toLowerCase().split(" ").filter((w) => w.length > 3);
  return docs
    .map((d) => ({ id: d.id, text: d.text, score: words.filter((w) => d.text.toLowerCase().includes(w)).length }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Fake model: decides whether/what to search based on what it has seen.
function model(question, observations) {
  if (!question.toLowerCase().includes("refund") && !question.toLowerCase().includes("return")) {
    return { answer: "No retrieval needed: 12 * 12 = 144." };
  }
  if (observations.length === 0) return { search: "refund policy purchase" };
  const seen = observations.map((o) => o.id);
  if (seen.includes("refunds.md") && !seen.includes("shipping.md")) {
    return { search: "shipping policy damaged items" };   // follow the pointer in refunds.md
  }
  return { answer: "You can get a refund within 30 days [refunds.md]. Return shipping is free for damaged items, otherwise it costs 5 EUR [shipping.md]." };
}

function agenticRag(question, maxSearches) {
  const observations = [];
  for (let i = 0; i <= maxSearches; i++) {
    const step = model(question, observations);
    if (step.answer) return step.answer;
    if (i === maxSearches) break;
    const hits = searchDocs(step.search, 1).filter((h) => !observations.some((o) => o.id === h.id));
    console.log("  search #" + (i + 1) + ": '" + step.search + "' -> " + (hits.map((h) => h.id).join(", ") || "nothing new"));
    observations.push(...hits);
  }
  return "I could not find enough information to answer.";
}

console.log("Q1:", agenticRag("Can I return a broken kettle and who pays shipping?", 3));
console.log("Q2:", agenticRag("What is 12 times 12?", 3));`,
        explanation: "For Q1, the first search finds refunds.md, which points to the shipping policy, so the model searches again before answering with citations. For Q2, it decides no retrieval is needed. A fixed pipeline would have searched once for both.",
      },
      {
        title: "A search_docs tool backed by Chroma + sentence-transformers",
        language: "python",
        code: `# pip install anthropic chromadb sentence-transformers
import chromadb
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")        # 384-dimensional vectors
db = chromadb.PersistentClient(path="./db")
col = db.get_or_create_collection("docs")                 # filled earlier by your ingest script

SEARCH_TOOL = {
    "name": "search_docs",
    "description": (
        "Semantic search over the company handbook (HR, IT, travel and expense policies). "
        "Returns up to k passages, each starting with its source id in [brackets]. "
        "Use short, specific queries; search again with different wording if results look "
        "irrelevant. Cite source ids in your answer. Not for customer or order data."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "A focused search query"},
            "k": {"type": "integer", "minimum": 1, "maximum": 8, "description": "Number of passages, default 4"},
        },
        "required": ["query"],
    },
}

def search_docs(query: str, k: int = 4) -> str:
    q = embedder.encode([query], normalize_embeddings=True)[0].tolist()
    res = col.query(query_embeddings=[q], n_results=min(int(k), 8))
    passages = []
    for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
        passages.append(f"[{meta['source']}] (distance {dist:.3f}) {doc[:800]}")
    return "\\n\\n".join(passages) or "No results. Try different keywords."

SYSTEM = """You answer questions about the company handbook.
- For any question about policies, call search_docs before answering; do not rely on memory.
- If results are irrelevant, rephrase and search again (at most 4 searches).
- Answer only from retrieved passages and cite them like [travel.md].
- If the passages do not contain the answer, say you could not find it."""

# Plug SEARCH_TOOL + search_docs into the agent loop from Build an Agent from Scratch:
# tools=[SEARCH_TOOL], system=SYSTEM, and route "search_docs" in run_tool.`,
        explanation: "The tool description tells the model what the corpus holds and how to use it. Results put source ids first so citations are easy. Lower distance means closer. Everything else is the same agent loop.",
      },
      {
        title: "Classic vs agentic RAG, step by step",
        language: "text",
        code: `Question: "Compare the travel per-diem for Berlin and Tokyo."

Classic RAG (1 retrieval, 1 LLM call)
  retrieve("Compare the travel per-diem for Berlin and Tokyo") -> top 4 chunks
  -> maybe both cities, maybe only one -> answer (may guess the missing one)

Agentic RAG (several tool calls, several LLM calls)
  model: search_docs("per diem Berlin")   -> [travel.md#europe]
  model: search_docs("per diem Tokyo")    -> [travel.md#asia]
  model: answer with both figures, citing travel.md#europe and travel.md#asia`,
        explanation: "Splitting a comparison into one query per item is a typical agentic move that a single similarity search can't make.",
      },
    ],
    howItWorks: md(
      "Agentic RAG = the agent loop + a retrieval tool + rules in the system prompt. Each search result enters the context as a tool_result, so later steps can read earlier findings, spot gaps and refine queries. The final answer is grounded in the collected passages.",
      "You can offer retrieval methods as separate tools (semantic search, keyword search, SQL over structured data, web search) or as one tool doing hybrid search internally. A few well-described tools usually beat many overlapping ones.",
      "Control cost: cap searches in the prompt and in code, keep passages short, and drop passages already seen. Evaluate with RAG metrics (right sources retrieved? faithful answer?) plus agent metrics (step count, unnecessary searches).",
    ),
    diagram: `   question
      |
      v
  +--> model: need info? --no--> answer directly
  |        | yes
  |        v
  |   search_docs(query') ---> [vector / keyword index]
  |        |
  |   passages + source ids (tool_result)
  |        |
  |   enough? --no--> rewrite query ----+
  |        | yes                        |
  |        v                            |
  |   answer with [citations]           |
  +-------------------------------------+
         (max searches guard)`,
    whyItExists: md(
      "Fixed RAG pipelines retrieve once using the user's raw wording. That breaks on vague questions, multi-part comparisons, multi-hop chains, and questions that need no retrieval. Letting the model control retrieval means it can rephrase, iterate and choose sources, the way a person researches.",
    ),
    whenToUse: md(
      "Use agentic RAG for complex or multi-hop questions, research-style tasks, corpora spread across several sources, and assistants where many questions need no retrieval. It also suits chat assistants where the model must decide whether a follow-up needs a new search.",
    ),
    whenNotToUse: md(
      "For simple FAQ-style lookups with strict latency or cost limits, a fixed RAG pipeline (maybe with query rewriting and reranking) is faster, cheaper and easier to evaluate. Start there, measure failures, and add the agentic path only for questions that need it.",
    ),
    commonMistakes: [
      "Vague tool descriptions that do not say what the corpus contains, so the model searches for things that are not there.",
      "Returning passages without source ids, making citations impossible.",
      "No limit on the number of searches, letting the agent loop on an unanswerable question.",
      "Returning long passages so a few searches overflow the context.",
      "Not telling the model it may answer without searching, causing pointless retrieval on every turn.",
      "Not telling the model to say 'not found', so it fills gaps with guesses.",
      "Evaluating only the final answer and ignoring whether the right documents were retrieved.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In the runnable demo, set maxSearches to 1 and explain the new output for Q1." },
      { difficulty: "Medium", prompt: "Add a fourth document to the demo that the shipping policy points to (for example a 'damage claims' page) and make the fake model follow a three-hop chain." },
      { difficulty: "Medium", prompt: "Write tool descriptions for two retrieval tools over different corpora (product docs vs internal runbooks) that make it obvious which one to use." },
      { difficulty: "Hard", prompt: "Build the Python search_docs agent over 20 of your own documents. Create 10 questions (some multi-hop, some needing no retrieval) and log how many searches each takes and whether the cited sources are correct." },
      { difficulty: "Hard", prompt: "Implement a router: questions classified as simple go through a fixed one-shot RAG pipeline, complex ones through the agentic loop. Compare cost and accuracy against agentic-only." },
    ],
    interviewQuestions: [
      { question: "What is agentic RAG and how does it differ from classic RAG?", answer: "Classic RAG always retrieves once with the user's query and then generates. Agentic RAG exposes retrieval as a tool in an agent loop, so the model decides whether to retrieve, writes its own queries, can search repeatedly or across sources, and stops when it has enough evidence." },
      { question: "What is a multi-hop question?", answer: "A question whose answer requires chaining facts from different documents, where each step depends on the previous one (find X, then use X to find Y). Single-shot similarity search rarely retrieves all pieces; iterative retrieval can." },
      { question: "How do you keep agentic RAG costs under control?", answer: "Limit searches in both the prompt and code, keep passages short, deduplicate results, use a router so simple questions take a cheap fixed path, and monitor steps per question." },
      { question: "What should a retrieval tool return?", answer: "A small number of concise passages, each with a stable source identifier (and optionally a score), plus an explicit message when nothing is found, so the model can cite sources and decide whether to search again." },
      { question: "How would you evaluate an agentic RAG system?", answer: "Retrieval metrics (did it find the relevant sources), answer faithfulness and relevance, citation correctness, plus trajectory metrics: number of searches, unnecessary or repeated searches, and cost and latency per question." },
    ],
    prerequisites: ["what-is-rag", "retrieval-strategies", "the-agent-loop"],
    relatedTopics: ["building-a-rag-pipeline", "advanced-rag-techniques", "tool-use", "evaluating-rag", "conversational-rag"],
    keywords: ["agentic rag", "retrieval tool", "iterative retrieval", "multi-hop", "query rewriting", "search tool", "self-directed retrieval", "citations", "router"],
  },

  {
    id: "workflow-patterns",
    title: "Workflow Patterns",
    level: "intermediate",
    description: "Five proven ways to compose LLM calls in code: prompt chaining, routing, parallelization, orchestrator-workers and evaluator-optimizer.",
    explanation: md(
      "Most successful LLM features aren't free-roaming agents. They're **workflows**: LLM calls composed by ordinary code in a known structure. Workflows are cheaper, faster, and easier to test and debug than agents, and they cover most real use cases. Five patterns come up again and again; learn them and you'll recognise which one a problem needs.",
      "All five use the same unit, sometimes called the **augmented LLM**: a model call that may also have retrieval, tools and memory. The patterns differ only in how your code connects those calls.",
      "**1. Prompt chaining.** Split a task into fixed steps, each working on the previous output: outline, check the outline, write; or extract, translate, format. Between steps, add a **gate**: a plain code check (length, valid JSON, required sections) that stops or retries before errors spread. Each step is simpler, so each is more accurate. Trade-off: more latency.",
      "**2. Routing.** Classify the input, then send it to a specialised handler: refunds to a billing prompt, bugs to a technical prompt with docs search, small talk to a cheap fast model. Each path gets its own prompt, tools and model size, instead of one prompt doing everything. The classifier can be an LLM call or a traditional classifier.",
      "**3. Parallelization.** Run independent LLM calls at once and combine them in code. Two flavours:",
      "- **Sectioning**: split a task into independent parts run in parallel. For example, one call answers the user while another screens the request against policy (a guardrail), or each section of a long document is reviewed separately.\n- **Voting**: run the same task several times (or with different prompts) and aggregate: majority vote, or 'flag if any reviewer flags'. This trades cost for confidence and lets you tune false positives vs false negatives.",
      "**4. Orchestrator-workers.** A central LLM (the orchestrator) reads the task, decides *dynamically* which subtasks are needed, hands each to a worker LLM call, and combines the results. Unlike sectioning, the subtasks aren't known in advance; which files a feature request touches depends on the request. It sits between workflow and agent: the plan is dynamic, but the structure (plan, fan out, combine) is fixed.",
      "**5. Evaluator-optimizer.** One call generates, another evaluates against clear criteria and gives specific feedback, and the generator revises. It loops until the evaluator passes it or a round limit is hit. It works when you can state what 'good' means and feedback measurably helps: translations, code that must pass tests, writing that must meet a checklist.",
      "Patterns combine: a router whose technical branch uses a chain ending in an evaluator-optimizer loop. Start with the simplest pattern that works, measure, and add structure only where measurements show it helps. In production, 'parallel' calls really run concurrently (`Promise.all` in JavaScript, `asyncio.gather` or a thread pool in Python). The runnable sketches below call a fake `llm()` sequentially to stay simple and deterministic.",
    ),
    analogy:
      "Think of a restaurant kitchen. Chaining is the line (prep, cook, plate) with the head chef checking each plate (the gate). Routing is the host sending diners to the bar or the dining room. Parallelization is several cooks on different dishes, or three tasters voting on a new sauce. Orchestrator-workers is the head chef reading a big catering order and assigning who cooks what. Evaluator-optimizer is a chef and a critic going back and forth until the dish is right.",
    examples: [
      {
        title: "Prompt chaining with a gate, and routing (runnable)",
        code: `// Fake LLM with canned behaviour per instruction prefix.
function llm(prompt) {
  if (prompt.startsWith("OUTLINE:")) return prompt.includes("caching")
    ? "What caching is; Cache invalidation; When not to cache"
    : "Intro";                                         // a weak outline for other topics
  if (prompt.startsWith("WRITE:")) return "Article with sections -> " + prompt.slice("WRITE: ".length);
  if (prompt.startsWith("ROUTE:")) {
    const t = prompt.toLowerCase();
    if (t.includes("refund") || t.includes("charged")) return "billing";
    if (t.includes("error") || t.includes("crash")) return "technical";
    return "general";
  }
  return "";
}

// ---- 1. PROMPT CHAINING: outline -> gate (plain code) -> write ----
function writeArticle(topic) {
  const outline = llm("OUTLINE: " + topic);
  const sections = outline.split(";").length;
  if (sections < 3) return "GATE FAILED for '" + topic + "': only " + sections + " section(s); not writing";
  return llm("WRITE: " + outline);
}
console.log(writeArticle("HTTP caching"));
console.log(writeArticle("DNS"));

// ---- 2. ROUTING: classify, then hand to a specialised handler ----
const handlers = {
  billing: (t) => "billing prompt + refund tools, small fast model",
  technical: (t) => "tech prompt + docs search, larger model",
  general: (t) => "FAQ prompt, small fast model",
};
for (const ticket of ["I was charged twice", "App shows error 500 on login", "Do you ship to Canada?"]) {
  const route = llm("ROUTE: " + ticket);
  console.log(route.padEnd(9) + " <- " + ticket + "  => " + handlers[route](ticket));
}`,
        explanation: "The chain's gate is ordinary code, so a bad intermediate result stops the pipeline instead of producing a bad article. The router lets each handler stay small and focused.",
      },
      {
        title: "Parallelization: sectioning and voting (runnable)",
        code: `// Fake LLM: behaviour depends on the instruction.
function llm(prompt) {
  if (prompt.startsWith("ANSWER:")) return "Here is how to reset your password: ...";
  if (prompt.startsWith("SCREEN:")) return prompt.includes("password of another user") ? "UNSAFE" : "SAFE";
  if (prompt.startsWith("REVIEW-SQL:")) return prompt.includes("' + userId") ? "VULNERABLE" : "OK";
  if (prompt.startsWith("REVIEW-XSS:")) return prompt.includes("innerHTML") ? "VULNERABLE" : "OK";
  if (prompt.startsWith("REVIEW-GENERAL:")) return prompt.includes("+ userId") ? "VULNERABLE" : "OK";
  return "";
}
// In production these run concurrently: await Promise.all([...]) or asyncio.gather(...).
const parallel = (prompts) => prompts.map(llm);

// ---- SECTIONING: answer and guardrail screening at the same time ----
for (const q of ["How do I reset my password?", "How do I get the password of another user?"]) {
  const [answer, verdict] = parallel(["ANSWER: " + q, "SCREEN: " + q]);
  console.log(q, "->", verdict === "SAFE" ? answer : "Sorry, I can't help with that.");
}

// ---- VOTING: three differently-focused reviewers, aggregate in code ----
const snippet = "db.query('SELECT * FROM users WHERE id=' + userId)";
const votes = parallel(["REVIEW-SQL: ", "REVIEW-XSS: ", "REVIEW-GENERAL: "].map((p) => p + snippet));
const flagged = votes.filter((v) => v === "VULNERABLE").length;
console.log("votes:", votes.join(", "));
console.log("majority rule  :", flagged >= 2 ? "FLAG" : "pass");
console.log("any-flag rule  :", flagged >= 1 ? "FLAG" : "pass", "(more sensitive, more false alarms)");`,
        explanation: "Sectioning splits different jobs across parallel calls. Voting runs the same question past several reviewers and lets your code pick the aggregation rule: majority for precision, any-flag for recall.",
      },
      {
        title: "Orchestrator-workers: a dynamic plan, fixed structure (runnable)",
        code: `const codebase = {
  "settings.ts": "user settings model",
  "SettingsPage.tsx": "settings screen UI",
  "theme.css": "colour variables",
  "api/users.ts": "user REST endpoints",
};

// ORCHESTRATOR (fake LLM): decides which subtasks this request needs.
function orchestrator(request) {
  const r = request.toLowerCase();
  const plan = [];
  if (r.includes("setting")) plan.push({ file: "settings.ts", job: "add the new field with a default" },
                                       { file: "SettingsPage.tsx", job: "add a control for it" });
  if (r.includes("dark") || r.includes("theme")) plan.push({ file: "theme.css", job: "add dark colour variables" });
  if (r.includes("api") || r.includes("sync")) plan.push({ file: "api/users.ts", job: "expose the field in the API" });
  return plan;
}
// WORKER (fake LLM): sees only its own file and job - a small, focused context.
function worker(sub) {
  return sub.file + ": " + sub.job + " [context: " + codebase[sub.file] + "]";
}
// SYNTHESIZER (fake LLM): combines worker outputs into one result.
function synthesize(request, outputs) {
  return "Change plan for '" + request + "' (" + outputs.length + " workers):\\n  - " + outputs.join("\\n  - ");
}

for (const request of ["Add a dark mode setting", "Sync the language setting via the API"]) {
  const plan = orchestrator(request);
  const outputs = plan.map(worker);          // parallel in production
  console.log(synthesize(request, outputs));
}`,
        explanation: "The two requests produce different numbers and kinds of subtasks. That's what sets orchestrator-workers apart from fixed sectioning. In a real system, the orchestrator returns its plan as structured output (a JSON list of subtasks).",
      },
      {
        title: "Evaluator-optimizer: generate, critique, revise (runnable)",
        code: `// GENERATOR (fake LLM): improves the draft using all feedback so far.
function generator(task, feedback) {
  let draft = "slugify(s) lowercases s and replaces spaces with dashes.";
  if (feedback.includes("example")) draft += " Example: slugify('Hello World') returns 'hello-world'.";
  if (feedback.includes("edge cases")) draft += " Edge cases: trims spaces; drops characters other than a-z, 0-9 and dashes.";
  return draft;
}
// EVALUATOR (fake LLM): checks explicit criteria, returns the first problem found.
function evaluator(draft) {
  if (!draft.includes("Example")) return { pass: false, feedback: "add an example" };
  if (!draft.includes("Edge cases")) return { pass: false, feedback: "mention edge cases" };
  return { pass: true, feedback: "" };
}

const task = "Document the slugify function";
let allFeedback = [];
const MAX_ROUNDS = 4;
for (let round = 1; round <= MAX_ROUNDS; round++) {
  const draft = generator(task, allFeedback.join("; "));
  const verdict = evaluator(draft);
  console.log("round " + round + ": " + (verdict.pass ? "PASS" : "revise -> " + verdict.feedback));
  if (verdict.pass) { console.log("final:", draft); break; }
  allFeedback.push(verdict.feedback);
  if (round === MAX_ROUNDS) console.log("gave up after", MAX_ROUNDS, "rounds; returning best draft");
}`,
        explanation: "The loop has a clear exit (the evaluator passes) and a hard cap (MAX_ROUNDS). The evaluator's criteria must be explicit; 'make it better' never converges.",
      },
    ],
    howItWorks: md(
      "Each pattern is a few lines of control flow around `llm()` calls:",
      "- **Chaining**: sequential calls with checks.\n- **Routing**: a classification, then a dispatch table.\n- **Parallelization**: concurrent calls plus an aggregation function.\n- **Orchestrator-workers**: a planning call that returns a list, then a fan-out and a synthesis call.\n- **Evaluator-optimizer**: a bounded generate-and-evaluate loop.",
      "Since the structure lives in your code, you can test and measure each step alone: does the router classify correctly, does the gate catch bad outlines, how often does the evaluator pass on round one? That visibility is the main advantage over a free-form agent.",
      "For reliable intermediate results, have steps return structured output (a schema for the classification, a JSON plan for the orchestrator, a pass/fail plus feedback object for the evaluator), and validate before the next step.",
    ),
    diagram: `CHAINING      in -> [LLM] -> gate -> [LLM] -> out
ROUTING       in -> [classify] -> A | B | C -> out
SECTIONING    in -> [LLM a] \\
                 -> [LLM b]  > combine -> out
VOTING        in -> [LLM]x3 -> majority -> out
ORCH-WORKERS  in -> [plan] -> [w1][w2]..[wn] -> [merge]
EVAL-OPT      in -> [gen] -> [eval] -pass-> out
                      ^--feedback--+ (max rounds)`,
    whyItExists: md(
      "One prompt asked to do everything is harder for the model and impossible to debug. A free agent is flexible but costly and unpredictable. Workflow patterns sit in between: they break problems into steps the model handles well, while keeping control flow explicit, testable and cheap.",
    ),
    whenToUse: md(
      "- **Chaining**: tasks with clear fixed stages.\n- **Routing**: distinct input categories that need different handling or model sizes.\n- **Sectioning**: independent subtasks, or a guardrail alongside the main answer.\n- **Voting**: high-stakes judgments where you want confidence.\n- **Orchestrator-workers**: complex tasks whose subtasks depend on the input.\n- **Evaluator-optimizer**: outputs with clear quality criteria that improve with feedback.",
    ),
    whenNotToUse: md(
      "Don't add a pattern when a single prompt already works; each extra call adds latency and cost. Skip voting when calls are expensive and the task is low-stakes. Skip evaluator-optimizer when you can't state concrete criteria. If the number and kind of steps are truly unpredictable and need environment feedback, move to an agent.",
    ),
    commonMistakes: [
      "Chaining steps without validation gates, so an early error flows silently to the end.",
      "Routing with a vague classifier prompt and no 'other' category, so odd inputs get forced into the wrong path.",
      "Running independent calls sequentially and paying the latency of each one in turn.",
      "Voting with identical prompts and identical settings, which often produces near-identical answers and little extra signal.",
      "Evaluator-optimizer loops without a maximum number of rounds, or with vague criteria that never converge.",
      "Letting the orchestrator return free text instead of a structured plan that code can validate.",
      "Building an agent when one of these fixed patterns would be cheaper and more reliable.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Classify each as chaining, routing, sectioning, voting, orchestrator-workers or evaluator-optimizer: a translator with a reviewer loop; a support bot that sends billing questions to one prompt and tech questions to another; generating marketing copy then translating it." },
      { difficulty: "Easy", prompt: "In the routing demo, add a 'sales' route for messages containing 'price' or 'quote' and test it." },
      { difficulty: "Medium", prompt: "Rewrite the parallelization demo with async functions and Promise.all, where each fake llm() call waits with setTimeout, and measure total time vs running them one after another." },
      { difficulty: "Medium", prompt: "Implement a real prompt chain in Python with the Anthropic SDK: extract action items from meeting notes as structured output, gate on at least one item, then draft a follow-up email." },
      { difficulty: "Hard", prompt: "Build a real evaluator-optimizer for SQL generation: the evaluator runs the query against a SQLite test database and returns errors or wrong row counts as feedback. Cap at 4 rounds and report how often each round succeeds." },
      { difficulty: "Hard", prompt: "Combine patterns: route incoming questions; send simple ones to one-shot RAG and complex ones to orchestrator-workers that research sub-questions in parallel. Measure latency and cost per path." },
    ],
    interviewQuestions: [
      { question: "Name and describe the five common LLM workflow patterns.", answer: "Prompt chaining (fixed sequential steps with gates), routing (classify then dispatch to specialised handlers), parallelization (sectioning independent subtasks or voting on the same task), orchestrator-workers (an LLM dynamically plans subtasks, workers execute, results are synthesised), and evaluator-optimizer (generate, evaluate against criteria, revise in a bounded loop)." },
      { question: "How is orchestrator-workers different from sectioning?", answer: "In sectioning the subtasks are predefined by the developer. In orchestrator-workers an LLM decides at run time which subtasks are needed based on the input, so the number and nature of workers varies." },
      { question: "When does evaluator-optimizer work well?", answer: "When there are clear, checkable criteria and feedback demonstrably improves results - for example code that must pass tests, translations with specific quality rubrics, or text that must meet a checklist. It needs a maximum round count." },
      { question: "Why prefer a workflow over an agent?", answer: "Workflows are predictable, cheaper, lower latency, and each step can be tested and monitored. Agents are only worth their cost when the steps cannot be determined in advance." },
      { question: "What is a gate in prompt chaining?", answer: "A programmatic check between steps - schema validation, length, required fields, a classifier - that stops, retries or branches before a bad intermediate result propagates to later steps." },
      { question: "How do you aggregate votes?", answer: "Choose the rule to match the cost of errors: majority vote for balanced precision, any-flag for high recall on safety issues, all-agree for high precision, or a threshold. Diversify prompts or perspectives so voters are not making identical errors." },
    ],
    prerequisites: ["calling-an-llm-api", "what-is-an-agent"],
    relatedTopics: ["what-is-an-agent", "multi-agent-systems", "structured-output", "agentic-rag", "cost-and-latency"],
    keywords: ["workflow patterns", "prompt chaining", "routing", "parallelization", "sectioning", "voting", "orchestrator workers", "evaluator optimizer", "augmented llm", "gate", "llm pipeline"],
  },

  {
    id: "multi-agent-systems",
    title: "Multi-Agent Systems",
    level: "advanced",
    description: "Several LLM agents with separate contexts and roles working together - when that helps, how to structure it, and what it costs.",
    explanation: md(
      "A **multi-agent system** splits work across several agents, each with its own system prompt, tools and, most importantly, **context window**. Usually a lead agent (the **orchestrator** or **supervisor**) breaks the task down and delegates pieces to **subagents**, which work independently and report back condensed results.",
      "Why would several agents beat one? Three real reasons:",
      "- **Context isolation**: a subagent can read 50 pages to answer one sub-question and return a 150-word summary. The lead's context stays small and focused, not full of raw material it won't need again.\n- **Parallelism**: independent sub-questions (research five competitors, check four regions) run at the same time, cutting wall-clock time for breadth-first tasks.\n- **Specialisation and least privilege**: each agent gets only the prompt and tools for its job. A research subagent gets read-only search; only a separate, approval-gated agent can send emails.",
      "The costs are real, and often bigger than expected:",
      "- **Tokens multiply**: each agent has its own system prompt, tool definitions and loop, and subagents often explore more than needed. Multi-agent runs commonly use several times the tokens of a single agent on the same task.\n- **Coordination is hard**: the lead must write clear, self-contained tasks (objective, scope, output format, what not to do). Vague delegation causes duplicated work, gaps, or subagents solving the wrong problem.\n- **Information loss**: summaries drop details, and subagents can't see each other's findings unless you design shared state.\n- **Harder debugging and evaluation**: failures spread across several transcripts; you need tracing that links parent and child runs.\n- **Conflicts**: parallel agents that *write* (same files, same record) can collide.",
      "Common structures:",
      "- **Orchestrator with subagents (supervisor)**: the lead plans, delegates via a 'delegate' tool, and combines results. The most common and easiest to reason about. Subagents are really *tools that happen to be agents*.\n- **Handoffs**: a triage agent passes the conversation to a specialist (billing, technical) that then owns it. Good for customer-facing flows with clear domains.\n- **Pipeline**: agents in a fixed order (researcher, writer, editor). Really a workflow whose steps are agents.\n- **Critic / debate**: one agent proposes, another challenges, and a judge or rule decides. Useful for review, but costly.",
      "Practical rules:",
      "- Start with a **single agent**; split only when you hit a concrete limit (context overflow, latency on parallelisable work, tool permissions).\n- Give subagents **tight, explicit tasks** and a required output format.\n- Return **condensed** results, not transcripts.\n- Cap steps per agent and the number of subagents.\n- Keep writes in one place: subagents read and propose; one agent or a human applies changes.\n- Trace everything with a shared run id.",
      "Multi-agent setups shine on **breadth-first** tasks (research across many independent sources, broad surveys, large-scale review). They struggle on tightly coupled tasks where every part depends on every other, like most coding changes, where one agent with full context usually does better.",
    ),
    analogy:
      "Think of a newsroom. The editor (orchestrator) assigns three reporters (subagents) to different angles. Each spends a day on interviews and notes (their private context) and files a 300-word piece. The editor reads only the pieces, not the raw notes, and writes the front page. It's faster than one reporter doing everything, but you pay three salaries. And if the assignments are vague, two reporters cover the same story while nobody covers the important one.",
    examples: [
      {
        title: "Context isolation and its token price (runnable, toy numbers)",
        code: `const words = (s) => s.split(" ").length;
const filler = (n) => Array(n).fill("detail").join(" ");
const OVERHEAD = 500;   // system prompt + tool definitions per agent, in "tokens"

const corpus = {
  pricing: ["Pricing: Pro plan is 20 per user per month. " + filler(300),
            "Billing FAQ: annual billing gives two months free. " + filler(250)],
  security: ["Security: data is encrypted at rest and in transit. " + filler(400),
             "Compliance: audited yearly by an independent firm. " + filler(200)],
  support: ["Support: 24/7 chat for the Pro plan. " + filler(300)],
};

// SUBAGENT: fresh context, reads raw docs, returns a short summary.
function subagent(topic) {
  const context = OVERHEAD + corpus[topic].reduce((n, d) => n + words(d), 0);
  const summary = corpus[topic].map((d) => d.split(". ")[0]).join(". ") + ".";
  return { topic, summary, context };
}

// ORCHESTRATOR: delegates (in parallel in production), sees only summaries.
const results = Object.keys(corpus).map(subagent);
const leadContext = OVERHEAD + words("Compare our plan for a buyer") + results.reduce((n, r) => n + words(r.summary), 0);
results.forEach((r) => console.log("subagent " + r.topic.padEnd(8) + " context=" + r.context + "  -> " + r.summary));
console.log("lead agent context =", leadContext);

// SINGLE AGENT: one context holds everything.
const single = OVERHEAD + Object.values(corpus).flat().reduce((n, d) => n + words(d), 0);
const multiTotal = leadContext + results.reduce((n, r) => n + r.context, 0);
const peak = Math.max(leadContext, ...results.map((r) => r.context));
console.log("single agent : peak context", single, "| total tokens", single);
console.log("multi-agent  : peak context", peak, "| total tokens", multiTotal);
console.log("=> smaller, cleaner contexts, but", (multiTotal / single).toFixed(2) + "x the tokens");`,
        explanation: "Each subagent's context holds only its slice, and the lead sees about 60 words of summaries instead of 1,500 words of raw text. But overhead is paid per agent, so total tokens rise. Real agents loop several times per task, so the real multiplier is usually larger than this toy shows.",
      },
      {
        title: "Handoffs with least-privilege tool sets (runnable)",
        code: `const agents = {
  triage:    { tools: [],                                  handles: "classifies and hands off" },
  billing:   { tools: ["lookup_invoice", "issue_refund"],  handles: "payments and refunds" },
  technical: { tools: ["search_docs", "check_status"],     handles: "bugs and outages" },
};

function triage(message) {                      // fake LLM classification
  const m = message.toLowerCase();
  if (m.includes("refund") || m.includes("invoice")) return "billing";
  if (m.includes("error") || m.includes("down")) return "technical";
  return "triage";
}

function callTool(agentName, tool) {            // enforced in CODE, not just in the prompt
  if (!agents[agentName].tools.includes(tool)) return "DENIED: " + agentName + " may not use " + tool;
  return "ok: " + agentName + " ran " + tool;
}

for (const msg of ["I need a refund for invoice 881", "The dashboard is down with error 503"]) {
  const owner = triage(msg);
  console.log("'" + msg + "' -> handed off to " + owner + " (" + agents[owner].handles + ")");
}
console.log(callTool("billing", "issue_refund"));
console.log(callTool("technical", "issue_refund"));   // a confused or hijacked agent is stopped`,
        explanation: "Each specialist gets only its domain's tools, and the check lives in code. If text in a bug report tricks the technical agent into trying a refund, the call is refused no matter what the model wants.",
      },
      {
        title: "Orchestrator with parallel research subagents (Python)",
        language: "python",
        code: `import anthropic
from concurrent.futures import ThreadPoolExecutor
from rag_tools import SEARCH_TOOL, search_docs     # the search tool from the Agentic RAG lesson

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"

def run_agent(system, task, tools, run_tool, max_steps=8):
    """The same manual agent loop as before, packaged as a function."""
    messages = [{"role": "user", "content": task}]
    for _ in range(max_steps):
        resp = client.messages.create(model=MODEL, max_tokens=16000, system=system,
                                      tools=tools, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason != "tool_use":
            return "".join(b.text for b in resp.content if b.type == "text")
        results = []
        for b in resp.content:
            if b.type == "tool_use":
                try:
                    results.append({"type": "tool_result", "tool_use_id": b.id,
                                    "content": run_tool(b.name, b.input)})
                except Exception as e:
                    results.append({"type": "tool_result", "tool_use_id": b.id,
                                    "content": f"Error: {e}", "is_error": True})
        messages.append({"role": "user", "content": results})
    return "[stopped at step limit]"

# ---- Subagent: read-only researcher with its own fresh context ----
RESEARCHER = ("You are a research subagent. Answer the assigned question using search_docs. "
              "Return at most 150 words of findings, each with its [source id]. No preamble.")

def research(question: str) -> str:
    return run_agent(RESEARCHER, question, [SEARCH_TOOL], lambda name, args: search_docs(**args))

# ---- Orchestrator: plans, delegates in parallel, synthesises ----
DELEGATE_TOOL = {
    "name": "delegate_research",
    "description": "Give ONE self-contained research question to a subagent that searches the "
                   "handbook and returns a short summary with source ids. The subagent cannot see "
                   "this conversation, so include all needed context in the question. For independent "
                   "questions, call this tool several times in the same turn; they run in parallel.",
    "input_schema": {"type": "object",
                     "properties": {"question": {"type": "string"}},
                     "required": ["question"]},
}
LEAD = ("You are the lead researcher. Break the user's request into 2-4 independent questions, "
        "delegate them, then write the final answer citing the subagents' source ids. "
        "Do not delegate more than 4 questions in total.")

pool = ThreadPoolExecutor(max_workers=4)

def orchestrate(task: str, max_steps: int = 6) -> str:
    messages = [{"role": "user", "content": task}]
    for _ in range(max_steps):
        resp = client.messages.create(model=MODEL, max_tokens=16000, system=LEAD,
                                      tools=[DELEGATE_TOOL], messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason != "tool_use":
            return "".join(b.text for b in resp.content if b.type == "text")
        calls = [b for b in resp.content if b.type == "tool_use"]
        answers = list(pool.map(lambda b: research(b.input["question"]), calls))   # parallel
        messages.append({"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": b.id, "content": a} for b, a in zip(calls, answers)
        ]})
    return "[orchestrator stopped at step limit]"

print(orchestrate("Compare the travel and expense rules for contractors vs employees."))`,
        explanation: "Subagents are just agent loops exposed to the lead as a tool. Each starts with an empty context, does its own searching, and returns only a summary. pool.map keeps order, so each answer pairs with the right tool_use id. Every subagent's tokens add to the bill, so log usage per agent.",
      },
    ],
    howItWorks: md(
      "Mechanically, a multi-agent system is nested agent loops. The lead's loop treats 'run a subagent' as a tool call. That tool starts a new loop with a fresh `messages` list, a different system prompt and a restricted tool set, runs it to completion, and returns its final text as the tool_result. Parallel tool calls from the lead become concurrent subagent runs.",
      "Information flows only through what you pass: the task going down, the summary coming up, and any shared store (a file, a database, a notes tool) you deliberately provide. That's both the benefit (isolation) and the risk (lost context). The delegation message (objective, constraints, expected output format, effort limit) is the most important part of the design.",
      "In operation you need per-agent step and token limits, a global budget, a trace id tying child runs to the parent, and evaluation at both levels (did each subagent answer its question, did the final answer solve the task).",
    ),
    diagram: `                 user task
                     |
              +-------------+
              | LEAD agent  |  small context:
              | plan/merge  |  task + summaries
              +------+------+
     delegate (parallel tool calls)
        /            |            \\
  +---------+  +---------+  +---------+
  | sub A   |  | sub B   |  | sub C   |  each: own
  | search  |  | search  |  | search  |  context,
  | loop    |  | loop    |  | loop    |  own tools,
  +----+----+  +----+----+  +----+----+  step cap
       \\ summary    |  summary   / summary
        +-----------+-----------+
                    v
            final answer + sources`,
    whyItExists: md(
      "Single agents hit limits on large, broad tasks: context fills with raw material, sequential exploration is slow, and one agent holding every tool breaks least privilege. Splitting work across agents with isolated contexts and narrow permissions fixes those limits, at the price of more tokens and coordination.",
    ),
    whenToUse: md(
      "Use multiple agents for breadth-first work that splits into independent parts (multi-source research, surveys, reviewing many documents), when one agent's context overflows with material it needs only briefly, when parallelism clearly cuts latency, or when separate domains need different tools and permissions (handoffs between support specialists).",
    ),
    whenNotToUse: md(
      "Avoid multi-agent designs for tightly coupled tasks where every step needs shared, detailed context (most code changes, a single coherent document), for simple tasks one agent or workflow already handles, or when token cost matters more than speed. Many 'multi-agent' demos work better as one agent with good tools, or as a workflow.",
    ),
    commonMistakes: [
      "Going multi-agent first, before a single agent has been shown to hit a real limit.",
      "Vague delegation ('research pricing') that causes duplicated work or off-target subagents.",
      "Returning full subagent transcripts to the lead, destroying the context-isolation benefit.",
      "No per-agent step caps or global budget, so a fan-out multiplies runaway costs.",
      "Several agents writing to the same files or records in parallel without coordination.",
      "Relying on prompts alone to keep agents within their roles instead of enforcing tool permissions in code.",
      "No tracing that links child runs to the parent, making failures impossible to locate.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three tasks from your work and decide for each whether one agent, a workflow, or a multi-agent design fits best. Justify using context size, parallelism and coupling." },
      { difficulty: "Easy", prompt: "In the context-isolation demo, double the size of every document and report how peak context and total tokens change for both designs." },
      { difficulty: "Medium", prompt: "Write a delegation template for subagents with fields for objective, scope, sources to use, output format and a step budget. Rewrite a vague task with it." },
      { difficulty: "Medium", prompt: "Add a third agent 'sales' with a 'create_quote' tool to the handoff demo and a test that the billing agent cannot call it." },
      { difficulty: "Hard", prompt: "Run the Python orchestrator and a single-agent version (search_docs directly on the lead) on the same 5 questions. Record tokens, wall-clock time and answer quality. Write up when multi-agent was worth it." },
    ],
    interviewQuestions: [
      { question: "What are the main benefits of a multi-agent system?", answer: "Context isolation (subagents absorb raw material and return condensed results), parallelism on independent subtasks, and specialisation with least-privilege tool sets per agent." },
      { question: "What are the main costs and risks?", answer: "Much higher token usage, coordination overhead and the need for precise delegation, information loss through summaries, harder debugging and evaluation across multiple transcripts, and conflicts when parallel agents write to shared state." },
      { question: "How do you implement a subagent?", answer: "As a tool for the lead agent whose implementation runs a separate agent loop with a fresh message history, its own system prompt and restricted tools, and a step limit, returning only its final condensed answer as the tool_result." },
      { question: "Orchestrator-subagents vs handoffs?", answer: "With an orchestrator, a lead agent stays in control, delegates subtasks, and synthesises results. With handoffs, control of the conversation transfers to a specialist agent that then owns it, typically after a triage step." },
      { question: "When is a single agent better than multiple agents?", answer: "When the task is tightly coupled and needs shared detailed context (for example most coding changes), when it is small, or when cost matters more than latency. Splitting such tasks loses context and adds coordination errors." },
      { question: "How do you keep a multi-agent system safe and affordable?", answer: "Enforce tool permissions per agent in code, gate side effects behind approval, cap steps per agent and subagent count, set a global token budget, keep writes centralised, and trace every run with a shared id so costs and failures can be attributed." },
    ],
    prerequisites: ["the-agent-loop", "workflow-patterns"],
    relatedTopics: ["workflow-patterns", "agentic-rag", "evaluating-agents", "ai-security", "observability-and-debugging", "cost-and-latency"],
    keywords: ["multi-agent", "multi agent systems", "orchestrator", "supervisor", "subagent", "handoff", "context isolation", "parallel agents", "delegation", "least privilege", "agent coordination"],
  },
];
