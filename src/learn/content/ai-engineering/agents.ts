import type { Topic } from "../../types/content";
import { md } from "./md";

export const aiAgentTopics: Topic[] = [
  {
    id: "what-is-an-agent",
    title: "What is an AI Agent?",
    level: "beginner",
    description: "An LLM that decides its own next steps in a loop, using tools, until a goal is done - and when a simpler design is better.",
    explanation: md(
      "An **AI agent** is a program where a large language model (LLM) is given a goal, a set of **tools** (functions it may ask your code to run, such as 'read a file' or 'search the docs'), and a loop. On every turn the model looks at everything that has happened so far and decides what to do next: call a tool, call several tools, or stop and give an answer. Your code runs the tools the model asked for, sends the results back, and the model decides again.",
      "The key word is **decides**. In an agent, the *model* chooses the sequence of steps at run time. You do not know in advance whether it will take two steps or twelve, or which tools it will pick. That flexibility is the whole point - and also the whole risk.",
      "It helps to place agents on a ladder of three designs that people often confuse:",
      "- **Chatbot (single call)**: text in, text out. One request to the model, one reply. No tools, no loop. Example: 'rewrite this email to sound friendlier'.\n- **Workflow**: an LLM is used inside a sequence of steps that *your code* defines. The path is fixed or chosen by simple rules: classify the ticket, then route it, then draft a reply, then check the draft. The model fills in the blanks; the program holds the steering wheel.\n- **Agent**: the model holds the steering wheel. It picks which tool to use, reads the result, and keeps going until it judges the task done (or until your safety limits stop it).",
      "A useful definition from practitioners: workflows are systems where LLMs and tools are orchestrated through **predefined code paths**; agents are systems where the LLM **dynamically directs its own process and tool usage**. Both are useful. Neither is automatically better.",
      "Every agent is built from the same four parts:",
      "- **Model**: the LLM that reasons and chooses actions.\n- **Tools**: functions with a name, a description, and an input schema (a JSON Schema describing the arguments). The model can only *request* a tool; your code actually runs it.\n- **Loop**: call the model, run any requested tools, append the results to the conversation, call the model again - until it stops asking for tools.\n- **Guardrails**: a maximum number of steps, timeouts, permission checks, human approval for risky actions, and logging so you can see what happened.",
      "**When NOT to build an agent** is the most important lesson on this page. Start with the simplest thing that works: a single well-written prompt. If that is not enough, add retrieval (fetching relevant documents) or a fixed workflow. Only reach for an agent when the steps genuinely cannot be known in advance - because agents cost more (many model calls per task), are slower, are harder to test (each run can take a different path), and can make compounding mistakes (a wrong step early leads every later step astray).",
      "Good agent tasks share a few traits: the task is open-ended, the number of steps varies, the model needs feedback from the environment (test results, search hits, file contents) to make progress, and mistakes are cheap to detect and recover from. Coding assistants that edit files and run tests, research assistants that search and read iteratively, and support assistants that look up orders and take bounded actions are classic examples.",
    ),
    analogy:
      "A chatbot is a calculator: press keys, get one answer. A workflow is a recipe: step 1 chop, step 2 fry, step 3 serve - the cook follows the card. An agent is a chef you hand a goal ('make dinner for four, one guest is vegetarian') and a stocked kitchen: the chef opens the fridge, tastes, adjusts, and decides each next step. You get flexibility, but you also need house rules - a budget, no using the expensive knives without asking, and a deadline.",
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
        explanation: "Notice who decides the order of steps. In the workflow, the program hard-codes classify-then-reply. In the agent, the scripted model looked at the order first, saw a double charge, chose to refund, then chose to stop. A real LLM makes those choices from the conversation instead of a script.",
        walkthrough: [
          { code: "console.log(\"chatbot  :\", llm(\"What are your hours?\"));", explanation: "A chatbot is a single model call. No tools, no loop, no memory beyond what you send." },
          { code: "const team = llm(\"Classify: \" + ticket);", explanation: "In a workflow your program decides that classification happens first and drafting happens second." },
          { code: "function agentModel(history) { ... }", explanation: "In an agent, the model looks at everything observed so far and returns either a tool request or a final answer." },
          { code: "for (let step = 1; step <= 5; step++)", explanation: "The loop keeps going until the model gives a final answer - but never more than 5 steps, so a confused model cannot run forever." },
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
        explanation: "This is the baseline every agent project should beat. An agent is this same call placed inside a loop, with tools attached.",
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
      "Under the hood an agent is an ordinary program. The model never touches your files or databases directly. It produces a structured request such as `{name: \"read_file\", input: {path: \"todo.txt\"}}`. Your code checks that request, runs the real function, and appends the output to the conversation as a **tool result**. Then it calls the model again with the whole conversation, because LLM APIs are **stateless** - the model remembers nothing between calls unless you send it.",
      "Each pass through the loop is called a **step** or **turn**. The loop ends when the model replies without asking for a tool (it considers the task done), when a safety limit is reached (maximum steps, time, or cost), or when something needs a human decision.",
      "Because every step re-sends the growing conversation, cost and latency grow with the number of steps. A 10-step agent run can easily cost 10-30 times a single call. That is why the advice is always: prove you need the flexibility before paying for it.",
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
      "Many real tasks cannot be scripted in advance. Fixing a bug means reading code, forming a guess, running tests, and reacting to what fails. Researching a question means searching, reading, and searching again based on what you learned. A fixed pipeline cannot anticipate every branch; an LLM that can choose actions and observe results can.",
      "Agents exist to turn a model that only *talks* into a system that can *act* - safely, within limits you define.",
    ),
    whenToUse: md(
      "Use an agent when the task is open-ended, the number and order of steps depend on intermediate results, the environment gives clear feedback (a test passes, a search returns hits), and you can bound the damage of a wrong action. Coding assistants, research assistants, data-exploration helpers and support bots with a few safe actions are typical fits.",
    ),
    whenNotToUse: md(
      "Do not build an agent when a single prompt, retrieval, or a fixed workflow would do. Do not build one when every step is known in advance (use a workflow - it is cheaper, faster and testable), when latency must be very low, when the cost per request must be predictable, or when actions are irreversible and you cannot add human approval. 'Agent' is not a goal; a working, reliable feature is.",
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
      "**Tool use** (also called **function calling**) lets a model ask your application to run a function and give it the result. The model cannot browse, read your database or do reliable arithmetic on its own, but it can say: 'please call `get_weather` with `{\"city\": \"Paris\"}`'. Your code runs it and replies with the answer. This single mechanism is what turns a text generator into something that can look things up and take actions.",
      "A **tool definition** has three parts:",
      "- **name**: a short identifier like `get_weather` (letters, digits, underscores, hyphens).\n- **description**: plain-language text telling the model *what the tool does, when to use it, and what it returns*. This is the most important part - the model chooses tools mostly by reading descriptions.\n- **input_schema**: a **JSON Schema** - a standard JSON format for describing the shape of data - that lists the arguments, their types, which are required, and allowed values (`enum`).",
      "The conversation then contains two new kinds of **content blocks** (a message's content can be a list of typed blocks instead of a plain string):",
      "- **tool_use** (in the assistant's message): `{type: \"tool_use\", id: \"toolu_...\", name: \"get_weather\", input: {city: \"Paris\"}}`. The `id` is unique per call.\n- **tool_result** (in the next user message): `{type: \"tool_result\", tool_use_id: \"toolu_...\", content: \"18°C and cloudy\"}`. The `tool_use_id` must match the call it answers. Add `is_error: true` when the tool failed, with an error message as the content, so the model knows to try something else.",
      "When the model wants a tool, the response's **stop_reason** is `tool_use`. You must append the assistant message *exactly as received* (including the tool_use blocks) to your history, run the tools, then send one user message containing the tool_result blocks. Then call the model again.",
      "**Parallel tool calls**: a single assistant turn can contain several tool_use blocks (for example, weather in Paris *and* Oslo). Run them all (in parallel if they are independent) and return **all results in one user message**, one tool_result per tool_use id. Splitting them across several messages is a common bug.",
      "**tool_choice** controls whether the model may use tools. The default, `auto`, lets the model decide whether to call a tool or answer directly. On current Claude models, rely on `auto` plus clear instructions in the system prompt and tool descriptions ('Always use the calculator for arithmetic') rather than trying to force a specific tool.",
      "Writing good tools is a design skill, sometimes called the **agent-computer interface**:",
      "- Write descriptions like documentation for a new colleague: what it does, when to use it, when *not* to, what the output looks like, limits (max rows, units).\n- Keep the set small and non-overlapping. Two tools that both 'search' confuse the model.\n- Make arguments hard to misuse: enums instead of free text, clear units ('amount_cents'), absolute or workspace-relative paths stated explicitly.\n- Return concise, meaningful output. A 2 MB JSON dump wastes context; return the fields that matter, and say when results were truncated.\n- Return helpful error messages ('No file named todo.txt; available: notes.txt, plan.md') so the model can recover.",
      "Tool use is also a convenient way to get **structured data**: the model's `input` object always follows the shape you described. For pure data extraction, dedicated structured-output features (see Structured Output) are usually simpler.",
    ),
    analogy:
      "Think of a manager on the phone with an assistant at the office. The manager cannot reach the filing cabinet, so they say: 'Please pull the file for order 42.' The assistant fetches it and reads it back. The manager decides what to ask next. The manager is the model, the assistant is your code, and the list of things the assistant is allowed to do - with instructions for each - is your tool list.",
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
        explanation: "Every tool_use gets exactly one tool_result with the matching id, errors are reported (not thrown) with is_error so the model can recover, and all results travel together in one user message.",
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
        explanation: "Two calls: the first returns tool_use blocks, the second receives the results. Turning these two calls into a loop gives you an agent (see The Agent Loop).",
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
        explanation: "Roles still alternate user/assistant. Tool results are sent with role 'user' because they come from your side of the conversation. The ids shown are illustrative.",
      },
    ],
    howItWorks: md(
      "When you pass `tools`, the API turns your definitions into special instructions that the model was trained to follow. The model reads the conversation and the tool descriptions, and if it decides a tool would help, it generates a tool_use block instead of (or after) plain text and stops with `stop_reason: \"tool_use\"`.",
      "The model generates the `input` object to match your JSON Schema, but treat it as **untrusted input**: validate types and ranges, check permissions, and never pass it straight to a shell or SQL query. A model can be tricked (by text in a web page or document it read) into requesting harmful actions - this is *prompt injection*, covered in AI Security.",
      "Tool definitions are sent with every request and count as input tokens, so a list of 50 verbose tools costs on every call. Keep the list focused on the task.",
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
      "Models are frozen at training time and live inside a text box. They do not know today's weather, your customer's order status, or the contents of your repository, and they make arithmetic slips. Tool use gives them a disciplined, structured way to ask for fresh data and to trigger actions, while your code keeps control over what actually runs.",
    ),
    whenToUse: md(
      "Use tools whenever the model needs information it cannot know (live data, private data, search), needs exact computation (math, date arithmetic, code execution), or needs to take an action (create a ticket, write a file). Also use a tool definition when you want guaranteed-shape arguments from the model.",
    ),
    whenNotToUse: md(
      "Do not wrap things in tools that you could just put in the prompt: if the model always needs the same small document, include it directly. Do not expose dangerous capabilities (arbitrary shell, raw SQL, payments) as tools without strict validation and approval. Do not create dozens of overlapping tools; merge or remove them.",
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
      "The **agent loop** is the small piece of code that turns tool use into an agent. It is often described as four phases repeated until done:",
      "- **Perceive**: the model receives the goal plus everything that has happened so far (the full message history).\n- **Think**: it reasons about what to do next. Current Claude models do this with built-in adaptive *thinking*; older systems prompted the model to write its reasoning out.\n- **Act**: it requests one or more tool calls (or decides it is finished).\n- **Observe**: your code runs the tools and appends their results; the next iteration starts with this new information.",
      "This idea was popularised by **ReAct** (Reason + Act), a prompting technique where the model alternated lines of 'Thought:', 'Action:' and 'Observation:' in plain text and the program parsed the Action lines. Modern APIs replace the text parsing with native tool_use blocks, but the rhythm - reason, act, observe, repeat - is the same.",
      "The loop in code is short: call the model; append its reply to the history; if it asked for tools, run them, append the results as one user message, and loop; otherwise, stop. The interesting part is **when to stop**, and the API tells you through the response's `stop_reason`:",
      "- `end_turn`: the model finished its answer. Normal exit.\n- `tool_use`: the model wants tools run. Keep looping.\n- `max_tokens`: the reply was cut off because it hit your `max_tokens` limit. The answer is incomplete - raise the limit or ask the model to continue; do not treat it as a final answer.\n- `stop_sequence`: generation hit one of your custom stop strings.\n- `refusal`: the model declined for safety reasons. Stop and surface this; do not retry the same request in a loop.\n- `pause_turn`: used with server-side tools that run on the provider's side; the model paused a long turn. Send the conversation back (with the paused assistant content appended) to let it continue.",
      "On top of the model's own stopping, **you** must add stop conditions, because a model can loop - repeating the same search, retrying a broken tool, or wandering:",
      "- **Max steps** (iterations): the single most important guard. 10-30 is typical for interactive agents.\n- **Budget**: stop when total tokens or cost passes a limit (sum `usage.input_tokens` and `usage.output_tokens` each step).\n- **Wall-clock timeout**: stop after N seconds.\n- **Repetition detection**: stop (or warn the model) when the same tool is called with the same input several times.\n- **Human checkpoints**: pause for approval before risky actions, or when the agent is stuck.",
      "When a guard triggers, end gracefully: return what was learned so far and say why it stopped, rather than crashing. Log every step - the model's text, each tool name and input, each result (truncated), stop_reason and token usage - so you can replay and debug runs later.",
    ),
    analogy:
      "A detective solving a case: look at the evidence (perceive), form a theory (think), go interview a witness or check a record (act), note what was learned (observe), and repeat. A good detective also has a boss who says 'you have three days and a fixed budget - report back either way'. That boss is your max-steps and budget guard.",
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
        explanation: "The loop is the same as today's: model output -> run action -> append observation -> repeat. Native tool_use blocks simply replace the fragile string parsing with structured JSON.",
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
        explanation: "Each exit path is explicit: normal finish, truncated, refused, paused, unknown, budget, and max steps. The log line per step is your future debugging lifeline.",
      },
    ],
    howItWorks: md(
      "Every iteration re-sends the complete history, so step N's request contains the original task, every earlier assistant message (with its tool_use blocks), and every tool result. This is how the model 'remembers' what it has already tried. It is also why long runs get slower and more expensive, and why large tool outputs should be trimmed.",
      "The history must stay well-formed: roles alternate, every tool_use is followed in the very next user message by a tool_result with the same id, and tool results come first in that user message. Breaking these rules produces API errors - a frequent bug when people prune or edit history.",
      "Reliability compounds. If each step is right 95% of the time, a 10-step run with no recovery succeeds only about 60% of the time (0.95 to the power 10). Agents survive this by observing results and correcting course - which is why clear error messages from tools and good feedback signals (tests, validators) matter so much.",
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
      "A single model call can only use what is already in the prompt. Real tasks need several rounds of gathering information and acting on it. The loop lets the model use each observation to decide its next move, which is what makes multi-step problem solving possible. Explicit stop conditions exist because models do not always know when to give up.",
    ),
    whenToUse: md(
      "Use a loop whenever the model may need more than one round of tools to finish - research, debugging, data exploration, multi-step support actions. Write it yourself at least once to understand it; later, an SDK helper such as a tool runner can manage it for you.",
    ),
    whenNotToUse: md(
      "If you know the model will always need exactly one tool call (or a fixed sequence), skip the loop and write a workflow - two explicit calls are easier to test. If latency matters more than flexibility, cap the loop at 1-3 steps or avoid it.",
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
      "In this lesson you build a complete, working agent twice: first as an **offline JavaScript version** you can run right here in the browser (with a scripted fake model, so you can watch every step), then as a **real Python command-line agent** using the Anthropic SDK. Finally you see the same agent rebuilt with the SDK's **tool runner**, which writes the loop for you. No framework is needed - an agent is about 150 lines of ordinary code.",
      "**What we are building.** `mini_agent.py` answers questions about the files in a `workspace/` folder. It has five tools: `list_files`, `read_file` (restricted to the workspace), `calculator` (safe arithmetic), `search_notes` (keyword search across workspace text files) and `save_note` (writes to `notes.txt`, so it needs human approval). Example task: 'Add up the amounts in budget.txt and save the total as a note.'",
      "**Before you start: chatbot vs workflow vs agent.** If every request needed exactly 'read budget.txt, then sum it', a two-step workflow would be cheaper and more predictable. We build an agent because the questions are open-ended: the model must decide which files to look at, whether it needs arithmetic, and when it knows enough. Always start simple and only add the loop when the task needs it.",
      "**Step 1 - Set up.** `pip install anthropic`, set the `ANTHROPIC_API_KEY` environment variable, create a `workspace/` folder with a few text files. Keep the model id and limits as constants at the top of the file (`MODEL`, `MAX_STEPS`).",
      "**Step 2 - Write the system prompt.** The system prompt tells the model its role, its environment and its working rules: 'Use tools instead of guessing. Always use the calculator for arithmetic. If a tool returns an error, read it and adjust. Say which files you used.' Short, concrete rules beat long essays.",
      "**Step 3 - Define the tools.** Each tool gets a name, a description that says what it does, when to use it and what it returns, and a JSON Schema for its input. Descriptions are where most of the agent's quality comes from.",
      "**Step 4 - Implement the tools safely.** This is ordinary code, and it is your security boundary:",
      "- `read_file` resolves the requested path and refuses anything outside the workspace, so `../../.ssh/id_rsa` or an absolute path fails. It also caps how much text it returns.\n- `calculator` must **never** call `eval()` on model text - that would run arbitrary code. Instead it parses the expression into a syntax tree (Python's `ast` module) and evaluates only numbers and `+ - * / ** %`, with a cap on exponent size so `9**9**9` cannot freeze your machine.\n- `search_notes` does a case-insensitive keyword search and returns `file:line: text` hits, capped at 20.\n- `save_note` appends to a file - a side effect - so it is marked **risky**.",
      "**Step 5 - Write the dispatcher.** `run_tool(name, input)` maps tool names to functions. It raises an exception on bad input or unknown tools; the loop catches exceptions and turns them into `is_error` tool results so the model can recover.",
      "**Step 6 - Add the human-approval gate.** Before running a tool in `RISKY_TOOLS`, print what the agent wants to do and ask `Allow? [y/N]`. If the human says no, return an `is_error` result saying the user denied it, so the model continues without it instead of retrying.",
      "**Step 7 - Write the loop.** Call the model with system prompt, tools and history; log stop_reason and token usage; append the assistant content unchanged; on `end_turn` return the text; on `max_tokens` or `refusal` stop with a clear message; on `tool_use` run every tool_use block and append **all** results in **one** user message (this is how parallel tool calls are handled). Repeat up to `MAX_STEPS`, then stop with an explanation.",
      "**Step 8 - Log every step.** One line per model call (step, stop_reason, tokens) and one per tool call (name, input, first 200 characters of output or the error). When an agent misbehaves, this log is how you find out why.",
      "**Step 9 - Run it and read the trace.** Try tasks that need several tools, a task that triggers an error (ask for a file that does not exist), a task that tries to escape the workspace, and one that asks to save a note (answer 'n' and watch it adapt).",
      "**Step 10 - Simplify with the tool runner.** Once you understand the loop, the SDK's beta tool runner can run it for you: decorate plain Python functions with `@beta_tool` (their type hints and docstrings become the schema and description) and iterate over `client.beta.messages.tool_runner(...)`. You keep the same tools and the same safety code; you just stop hand-writing the loop.",
    ),
    analogy:
      "Building an agent is like hiring a new intern and setting up their desk. The system prompt is the onboarding note, the tools are the keys you hand them (the filing room key, a calculator, but not the company credit card), the approval gate is 'ask me before you send anything outside', the max-steps guard is 'if you are not done by 5pm, come and tell me where you got stuck', and the log is the notebook where they write down everything they did.",
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
        explanation: "Everything a real agent has is here: tool registry, a safe calculator, a workspace guard that rejects '../secrets.env', parallel tool calls answered in one message, an is_error result the model recovers from, a step log, and a max-steps guard (the second run shows it firing). Swap llm() for a real API call and you have the Python version below.",
        walkthrough: [
          { code: "function calculate(expr) { ... }", explanation: "A recursive-descent parser: sum handles + and -, product handles * and /, factor handles numbers, parentheses and unary minus. Only arithmetic can run - no eval()." },
          { code: "if (path.startsWith(\"/\") || path.includes(\"..\")) throw ...", explanation: "The workspace guard. The model may ask for any path; your code decides what is allowed." },
          { code: "function llm(messages) { ... }", explanation: "Stands in for the real model. It returns the same shape the API returns: stop_reason plus content blocks." },
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
        explanation: "About 170 lines, no framework. The security-critical parts are ordinary code you control: safe_path, the AST-based calculator, output caps, and the approval gate. Everything the model produces - tool names, paths, expressions - is treated as untrusted input.",
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
        explanation: "The decorator builds each tool's JSON Schema from type hints and its description from the docstring; the runner calls the model, runs requested tools, and feeds results back until the model stops. The safety code (workspace guard, safe calculator, approval) does not go away - it moves into the tool functions.",
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
        explanation: "Illustrative output - token counts and wording will differ on every run. Notice input tokens grow each step, because the whole history is re-sent.",
      },
    ],
    howItWorks: md(
      "The Python agent and the JavaScript demo have the same skeleton: **messages** (the growing history), **TOOLS** (what the model may request), **run_tool** (what actually happens), and the **loop** (call, append, run, append, repeat). The model never runs code; it only emits tool_use blocks, and the dispatcher decides what to do with them.",
      "Parallel tool calls need no extra code: if the model returns three tool_use blocks in one turn, the inner `for block in resp.content` loop runs all three and the results travel together in one user message. To speed this up you could run independent tools concurrently with `concurrent.futures.ThreadPoolExecutor`, as long as each result keeps its `tool_use_id`.",
      "The approval gate sits between the model's request and execution. Because a denial is reported as an `is_error` result, the conversation stays well-formed and the model can explain what it could not do. In a web app the same idea becomes a 'pending approval' state that a user resolves with a button.",
      "The tool runner automates the loop and schema generation, but you still own limits, safety, and logging. Write the manual loop first so you know exactly what the runner is doing for you.",
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
      "Frameworks hide the loop behind abstractions, and when something goes wrong you cannot see why. Building an agent from scratch shows that there is no magic: a model, a list of tools, a dispatcher and a loop. With that understanding you can debug any framework, decide whether you need one at all, and put security controls where they belong - in your code, not in the prompt.",
    ),
    whenToUse: md(
      "Build your own loop when you need full control over safety, logging and cost; when your tools are few and well-defined; when you are learning; or when a framework would add more complexity than it removes. Use the SDK tool runner once the manual loop is clear and you want less boilerplate.",
    ),
    whenNotToUse: md(
      "If the task is always the same two or three steps, write a workflow instead of a loop. If you need durable long-running agents (resume after crashes, distributed workers, scheduling), consider an established agent framework or platform rather than growing this script indefinitely. And never ship the approval-free version of a tool that sends, deletes or pays.",
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

  // CONTINUE
];
