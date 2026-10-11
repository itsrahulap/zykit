import type { Topic } from "../../types/content";
import { md } from "./md";

export const aiBeginnerTopics: Topic[] = [
  {
    id: "what-is-ai",
    title: "What is AI? (AI vs ML vs Deep Learning vs Generative AI)",
    level: "beginner",
    description: "The vocabulary of the field: AI, machine learning, deep learning, generative AI, models, parameters, training and inference.",
    explanation: md(
      "**Artificial intelligence (AI)** is the broad goal of making computers do things that normally need human intelligence: understanding language, recognising images, making decisions, writing text. It is an umbrella term, not one specific technique.",
      "For decades most AI was **rule-based**: a programmer wrote the rules by hand. 'If the email contains the word *lottery* and comes from an unknown sender, mark it as spam.' That works until the world changes faster than you can write rules. Spammers simply write *l0ttery*.",
      "**Machine learning (ML)** flips this around. Instead of writing the rules, you show the computer many examples (emails labelled spam or not spam) and let an algorithm *learn* the rules from the data. The thing that gets learned is called a **model**.",
      "A **model** is just a function with adjustable numbers inside it. Those adjustable numbers are called **parameters** (or *weights*). A model that predicts house prices might be `price = w1 * size + w2 * bedrooms + b`, where `w1`, `w2` and `b` are parameters. **Training** means automatically nudging the parameters, example after example, until the model's outputs are close to the right answers. Using a trained model to get answers for new inputs is called **inference**.",
      "**Deep learning** is a kind of machine learning that uses **neural networks** with many layers. A neural network is a big chain of simple maths operations (multiply by weights, add, apply a simple non-linear function), stacked in layers. 'Deep' just means many layers. Deep networks can have millions or billions of parameters, which lets them learn very rich patterns - from raw pixels to 'this is a cat', or from raw text to grammar, facts and style.",
      "**Generative AI** is deep learning used to *create* new content - text, images, audio, code - rather than only to label or score things. A spam filter is *discriminative* (it picks a label). A model that writes an email is *generative*.",
      "A **Large Language Model (LLM)** is a generative model for text, trained on enormous amounts of writing. Claude is an LLM. Everything in this subject - prompting, RAG, agents - is about building software around LLMs.",
      "The nesting to remember:",
      "- **AI** - any technique that makes machines act intelligently (including hand-written rules).\n- **Machine learning** - AI that learns patterns from data instead of hand-written rules.\n- **Deep learning** - machine learning with many-layered neural networks.\n- **Generative AI** - deep learning models that produce new content.\n- **LLMs** - generative models specialised in language (and often images and code too).",
      "Two other terms you will meet everywhere: **training data** (the examples a model learns from) and a **dataset split** into *training* data (used to adjust parameters) and *test* data (held back to check the model works on examples it has never seen). A model that memorises its training data but fails on new data is said to **overfit**.",
      "As an engineer building AI applications you will almost never train an LLM yourself - that costs enormous compute. You will *use* a pretrained model through an **API** (a way for your program to send a request to another program over the network and get a response). Your job is to feed the model the right input, check its output, and connect it to your data and tools. That is what *AI engineering* means in this subject.",
    ),
    analogy:
      "Rule-based AI is a cookbook: someone wrote down every step, and the cook follows it exactly. Machine learning is a trainee chef who tastes thousands of dishes, gets told 'good' or 'bad' each time, and slowly adjusts their instincts. Deep learning is that chef with an enormous memory for subtle patterns. Generative AI is the chef inventing a brand new dish in the style of everything they have tasted. An LLM is a chef who has 'tasted' a huge library of text and now writes new text in any style you ask for.",
    examples: [
      {
        title: "Rules vs learning: a tiny spam filter both ways",
        code: `// 1) Rule-based: a human wrote the rule
function ruleBased(email) {
  return email.includes("lottery") ? "spam" : "ham";
}

// 2) Learned: count which words appear in labelled examples
const training = [
  ["win a free lottery prize now", "spam"],
  ["free prize claim now", "spam"],
  ["cheap pills free shipping", "spam"],
  ["meeting moved to monday", "ham"],
  ["lunch on monday with the team", "ham"],
  ["project update and meeting notes", "ham"],
];

const counts = { spam: {}, ham: {} };
for (const [text, label] of training) {
  for (const word of text.split(" ")) {
    counts[label][word] = (counts[label][word] || 0) + 1;
  }
}

// The "model": score = spam word hits minus ham word hits
function learned(email) {
  let score = 0;
  for (const word of email.split(" ")) {
    score += (counts.spam[word] || 0) - (counts.ham[word] || 0);
  }
  return score > 0 ? "spam" : "ham";
}

const tests = ["claim your free prize", "team meeting on monday", "l0ttery winner free now"];
for (const t of tests) {
  console.log(JSON.stringify(t), "rule:", ruleBased(t), "| learned:", learned(t));
}`,
        explanation: "The rule only knows the word 'lottery' and misses every other spam. The learned version picked up 'free', 'prize' and 'now' from data nobody wrote rules for. Real ML uses far better algorithms, but the idea is identical: the behaviour comes from data, not hand-written rules.",
        walkthrough: [
          { code: "function ruleBased(email) { ... }", explanation: "Classic AI: a human-written rule. It cannot handle anything the author did not anticipate." },
          { code: "const training = [[text, label], ...]", explanation: "Labelled examples - the training data." },
          { code: "counts[label][word] = ...", explanation: "'Training': we compute numbers (word counts) from the data. These counts are this toy model's parameters." },
          { code: "function learned(email)", explanation: "'Inference': use the learned numbers to label an email the model has never seen." },
        ],
      },
      {
        title: "What 'training a parameter' really means",
        code: `// Data secretly follows y = 3x + 1. The model is y = w*x + b.
// w and b are the PARAMETERS. Training = nudging them to reduce error.
const data = [[0, 1], [1, 4], [2, 7], [3, 10], [4, 13]];
let w = 0, b = 0;
const learningRate = 0.02;

for (let step = 0; step <= 2000; step++) {
  let gradW = 0, gradB = 0, loss = 0;
  for (const [x, y] of data) {
    const prediction = w * x + b;
    const error = prediction - y;
    loss += error * error;
    gradW += 2 * error * x;   // how loss changes if w grows
    gradB += 2 * error;       // how loss changes if b grows
  }
  w -= learningRate * gradW / data.length;  // step downhill
  b -= learningRate * gradB / data.length;
  if (step % 500 === 0) {
    console.log("step", step, "w =", w.toFixed(3), "b =", b.toFixed(3), "loss =", (loss / data.length).toFixed(4));
  }
}
console.log("prediction for x = 10:", (w * 10 + b).toFixed(2), "(true value 31)");`,
        explanation: "This is gradient descent, the algorithm used to train essentially every neural network, including LLMs. An LLM does exactly this, but with billions of parameters instead of two, and with 'predict the next token' as the task instead of a straight line.",
      },
      {
        title: "Using a pretrained generative model (Python, Anthropic SDK)",
        language: "python",
        code: `# pip install anthropic   and   export ANTHROPIC_API_KEY=...
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    messages=[{"role": "user", "content": "In two sentences, what is the difference between AI and machine learning?"}],
)

for block in resp.content:
    if block.type == "text":
        print(block.text)`,
        explanation: "You did not train anything: someone else trained the model, and you run inference on it through an API. This is the normal starting point for AI engineering.",
      },
    ],
    howItWorks: md(
      "Every machine learning system has the same three parts: **data** (examples), a **model** (a function with parameters), and a **training procedure** (an algorithm that adjusts the parameters to reduce a measure of error called the **loss**).",
      "Training loop, in words: take an example, run the model to get a prediction, measure how wrong it was (loss), work out which direction to move each parameter to make it less wrong (the *gradient*), move each parameter a small step in that direction. Repeat millions of times. This is **gradient descent**.",
      "Deep learning uses the same loop, but the model is a neural network with many layers. Each layer transforms its input a little; together the layers can represent complicated patterns. Nobody writes those patterns by hand - they emerge from training on data.",
      "After training, the parameters are frozen and saved. **Inference** loads them and runs the function on new inputs. When you call an LLM API, the provider runs inference for you on their hardware and sends back the result.",
    ),
    diagram: `+--------------------------------------------+
| AI: machines doing 'intelligent' tasks     |
|  (rules, search, planning, ML ...)         |
|  +--------------------------------------+  |
|  | Machine learning: learn from data    |  |
|  |  +--------------------------------+  |  |
|  |  | Deep learning: many-layer nets |  |  |
|  |  |  +--------------------------+  |  |  |
|  |  |  | Generative AI            |  |  |  |
|  |  |  |   +------+               |  |  |  |
|  |  |  |   | LLMs |               |  |  |  |
|  |  |  |   +------+               |  |  |  |
|  |  |  +--------------------------+  |  |  |
|  |  +--------------------------------+  |  |
|  +--------------------------------------+  |
+--------------------------------------------+

 data --> [training: adjust parameters] --> model
 new input --> [inference: run model] --> output`,
    whyItExists: md(
      "Many valuable tasks - understanding a customer's question, summarising a contract, spotting a tumour in a scan - have no clean set of rules a human could write down. Machine learning exists because data is easier to collect than rules are to write, and because learned models keep improving as data grows.",
      "Generative AI and LLMs exist because a single model trained on broad text turns out to be useful for thousands of tasks without task-specific training: you just describe the task in words.",
    ),
    whenToUse: md(
      "Reach for ML when the task is fuzzy (language, images, judgement calls), when rules would be endless, or when you have lots of examples of the right answer. Reach for a generative LLM when the input or output is natural language, code or loosely structured content: drafting, summarising, extracting, classifying, answering questions, operating tools.",
    ),
    whenNotToUse: md(
      "Do not use AI when a simple deterministic rule or formula does the job: tax calculations, sorting, validating an email format, looking up a record by id. Normal code is cheaper, faster, exact and testable. Do not use an LLM when every answer must be provably correct with no human or programmatic check - LLMs can be confidently wrong (see hallucinations-and-limitations).",
    ),
    commonMistakes: [
      "Using 'AI', 'ML' and 'LLM' as synonyms - LLMs are one small (if very visible) part of AI.",
      "Thinking the model 'looks things up' in its training data at answer time; it only has the parameters it learned, not a copy of the data.",
      "Believing you must train your own model to build an AI product; most applications use a pretrained model through an API.",
      "Assuming a model that does well on its training examples will do well on new ones (overfitting).",
      "Reaching for an LLM for problems that a few lines of ordinary code solve exactly.",
      "Treating model output as fact instead of as a prediction that can be wrong.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each task, say whether you would use plain code, classic ML, or an LLM, and why: (a) converting Celsius to Fahrenheit, (b) flagging fraudulent card transactions from history, (c) summarising support tickets, (d) checking a password is at least 12 characters." },
      { difficulty: "Easy", prompt: "Explain in your own words the difference between a parameter, training and inference, using the house-price example." },
      { difficulty: "Medium", prompt: "Extend the spam-filter demo: add 4 more training examples and 3 tricky test emails. Find an email the learned filter gets wrong and explain why from the counts." },
      { difficulty: "Medium", prompt: "Change the learning rate in the gradient-descent demo to 0.2 and to 0.001. Describe what happens to the parameters and the loss, and explain why." },
      { difficulty: "Hard", prompt: "Build a version of the gradient-descent demo that learns two inputs: y = 2*a - 3*b + 5. Generate 20 data points, train w1, w2 and b, and print them every 500 steps." },
    ],
    interviewQuestions: [
      { question: "What is the difference between AI, machine learning and deep learning?", answer: "AI is the broad field of making machines act intelligently, including hand-written rules. Machine learning is the subset where behaviour is learned from data. Deep learning is the subset of ML using neural networks with many layers, which is what powers modern image, speech and language models." },
      { question: "What is a model parameter?", answer: "A number inside the model that is adjusted during training, such as a weight in a neural network. The set of all parameters is what the model 'knows'. Large language models have billions of them." },
      { question: "What is the difference between training and inference?", answer: "Training adjusts the parameters using data and a loss function, which is expensive and done rarely. Inference runs the trained model with fixed parameters on new input to get an output, which happens on every request." },
      { question: "What is generative AI?", answer: "Models that produce new content (text, images, audio, code) rather than only classifying or scoring inputs. LLMs are generative models for text." },
      { question: "What is overfitting?", answer: "When a model learns its training examples too specifically, including noise, so it scores well on training data but poorly on new data. You detect it by evaluating on held-out test data." },
      { question: "As an application engineer, why don't you usually train your own LLM?", answer: "Pretraining an LLM needs vast data and compute. Pretrained models are already broadly capable, so it is far cheaper to use one through an API and adapt it with prompting, retrieval (RAG) and tools; fine-tuning is reserved for specific needs." },
    ],
    prerequisites: [],
    relatedTopics: ["how-llms-work", "calling-an-llm-api", "hallucinations-and-limitations", "fine-tuning-vs-rag"],
    keywords: ["artificial intelligence", "machine learning", "deep learning", "neural network", "generative ai", "llm", "model", "parameters", "weights", "training", "inference", "gradient descent", "overfitting", "loss"],
  },

  {
    id: "how-llms-work",
    title: "How Large Language Models Work",
    level: "beginner",
    description: "Next-token prediction, training data, the transformer and attention, pretraining vs instruction tuning vs RLHF, and why models can be wrong.",
    explanation: md(
      "A **Large Language Model** does one thing: given some text, it predicts **what comes next**. Everything else - answering questions, writing code, following instructions - is built on top of that single ability.",
      "Text is first split into **tokens**, small chunks such as whole words, parts of words or punctuation (`un`, `believ`, `able`). Each token has an id number. The model sees a sequence of token ids and outputs a **probability distribution** over its whole vocabulary for the next token. A probability distribution is just a list of possible outcomes with a likelihood for each, where the likelihoods add up to 1 (100%). For the input 'The cat sat on the', the model might output: `mat` 0.41, `floor` 0.18, `sofa` 0.09, ... thousands more with tiny probabilities.",
      "To **generate** text, the system picks one token from that distribution, appends it to the input, and asks the model again. Token by token, one at a time. This is called **autoregressive** generation. When you watch a chatbot 'type', you are literally watching this loop.",
      "**Where does the knowledge come from?** In **pretraining**, the model reads a huge amount of text (web pages, books, code, articles). For every position in that text it tries to predict the next token, compares its guess with the real next token, and adjusts its parameters slightly using gradient descent (see what-is-ai). After trillions of such guesses, the parameters encode grammar, facts, reasoning patterns and styles - because predicting text well *requires* those things. To predict the end of 'The capital of France is', it helps to have learned that the answer is Paris.",
      "**The transformer.** Modern LLMs use a neural network architecture called the **transformer**. Its key idea is **attention**: when processing each token, the model looks back at all the earlier tokens and decides how much each one matters for understanding this one. In 'The animal didn't cross the street because *it* was too tired', attention lets the model connect *it* to *animal*. Each token is represented as a list of numbers (a *vector*); attention computes how well each pair of tokens 'matches' and blends information from the best matches. A transformer stacks dozens of these attention layers, each refining the representation.",
      "**From text predictor to assistant.** A model that has only been pretrained (a **base model**) continues text; ask it 'What is the capital of France?' and it might continue with more quiz questions, because that is what such text looks like on the web. Two more training stages turn it into a helpful assistant:",
      "- **Instruction tuning** (supervised fine-tuning): further training on many examples of instructions paired with good responses, written or curated by people. The model learns the *format* of being an assistant: read the request, answer it.\n- **Reinforcement learning from human feedback (RLHF)** and related methods: the model produces several answers, people (or a model trained on people's preferences) rank which is better, and the model is trained to produce more of the preferred kind - more helpful, more honest, safer. Some labs also use AI feedback guided by a written set of principles.",
      "**Why models can be wrong.** An LLM is optimised to produce *plausible* continuations, not *verified true* ones. It has no built-in database of facts and no automatic way to check its output. If the training data was thin, outdated or contradictory on a topic, the most plausible-sounding continuation may be false - this is a **hallucination**. Its knowledge also stops at a **training cutoff** date, so it does not know about later events unless you give it that information in the prompt.",
      "**What the model does NOT do:** it does not search the internet by itself (unless given a tool), it does not remember your previous conversations (unless you send them again), and it does not learn from your chats in real time - its parameters are fixed during inference.",
    ),
    analogy:
      "Imagine the world's most voracious reader playing a game: you read them the start of a sentence and they must guess the next word. After reading a library bigger than any human could, they get astonishingly good - good enough that 'guessing the next word' of a question produces a correct, well-written answer. Instruction tuning is a finishing school that teaches them to respond to requests instead of rambling on. But they are still guessing: if they never read about something, they may confidently guess wrong rather than say 'I don't know'.",
    examples: [
      {
        title: "A toy next-word predictor from bigram counts",
        code: `// A "bigram model": predict the next word from the current word only,
// using counts from a tiny training corpus. LLMs use the WHOLE preceding
// context and billions of parameters, but the job is the same.
const corpus = [
  "the cat sat on the mat",
  "the cat ate the fish",
  "the dog sat on the rug",
  "the dog chased the cat",
];

// Training: count which word follows which
const next = {};
for (const sentence of corpus) {
  const words = sentence.split(" ");
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    next[a] = next[a] || {};
    next[a][b] = (next[a][b] || 0) + 1;
  }
}

// Inference: turn counts into a probability distribution
function predict(word) {
  const options = next[word] || {};
  const total = Object.values(options).reduce((s, c) => s + c, 0);
  return Object.entries(options)
    .map(([w, c]) => [w, c / total])
    .sort((x, y) => y[1] - x[1]);
}

for (const w of ["the", "cat", "sat"]) {
  const dist = predict(w).map(([t, p]) => t + "=" + p.toFixed(2)).join(", ");
  console.log("after '" + w + "':", dist);
}

// Autoregressive generation: always take the most likely word (greedy)
let word = "the";
const out = [word];
for (let i = 0; i < 5; i++) {
  const dist = predict(word);
  if (dist.length === 0) break;
  word = dist[0][0];
  out.push(word);
}
console.log("generated:", out.join(" "));`,
        explanation: "Notice the generated text loops ('the cat sat on the cat ...') because a bigram model only sees one word of context. Transformers fix this with attention over the entire context, which is why they produce coherent paragraphs.",
        walkthrough: [
          { code: "next[a][b] = (next[a][b] || 0) + 1", explanation: "Training: count how often word b follows word a. These counts are the model's 'parameters'." },
          { code: "map(([w, c]) => [w, c / total])", explanation: "Convert counts to probabilities that add up to 1: a probability distribution over next words." },
          { code: "word = dist[0][0]; out.push(word);", explanation: "Generation: pick a token, append it, predict again. This loop is exactly how LLMs produce text." },
        ],
      },
      {
        title: "Attention intuition: which earlier word does 'it' look at?",
        code: `// Each token gets a small vector (real models: thousands of numbers).
// Attention = compare the current token's QUERY with every token's KEY,
// turn the scores into weights with softmax, and blend.
const tokens = ["the", "animal", "crossed", "the", "street", "because", "it"];
const keys = {
  the:     [0.0, 0.1, 0.0],
  animal:  [0.9, 0.8, 0.1],
  crossed: [0.1, 0.0, 0.9],
  street:  [0.2, 0.9, 0.0],
  because: [0.0, 0.0, 0.3],
  it:      [0.6, 0.4, 0.1],
};
const query = [3.0, 1.5, 0.0]; // what "it" is looking for: a living thing / a noun

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const scale = Math.sqrt(query.length);
const scores = tokens.map(t => dot(query, keys[t]) / scale);

// softmax: exponentiate and normalise so weights sum to 1
const exps = scores.map(s => Math.exp(s));
const sum = exps.reduce((a, b) => a + b, 0);
const weights = exps.map(e => e / sum);

tokens.forEach((t, i) => {
  const bar = "#".repeat(Math.round(weights[i] * 60));
  console.log(t.padEnd(8), weights[i].toFixed(3), bar);
});`,
        explanation: "The vectors here are hand-picked to show the idea. In a real transformer, the query and key vectors are computed from the tokens by learned parameters, and many attention 'heads' run in parallel, each learning to track a different kind of relationship (who did what, which noun a pronoun refers to, matching brackets in code...).",
      },
      {
        title: "Watching autoregressive generation happen (Python, streaming)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

# Streaming shows text as it is generated, chunk by chunk.
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=64000,
    messages=[{"role": "user", "content": "Write one sentence about why the sky is blue."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

final = stream.get_final_message()
print()
print("output tokens generated:", final.usage.output_tokens)`,
        explanation: "Each printed chunk corresponds to one or a few newly generated tokens. The output token count tells you how many times the model ran its next-token step.",
      },
    ],
    howItWorks: md(
      "**Step 1 - Tokenise.** The input text becomes a list of token ids, e.g. `[464, 3797, 3332, 319, 262]`.",
      "**Step 2 - Embed.** Each token id is looked up in a learned table that maps it to a vector (a list of numbers). Information about each token's *position* is added, because otherwise the model could not tell 'dog bites man' from 'man bites dog'.",
      "**Step 3 - Transformer layers.** The vectors pass through many layers. Each layer has an **attention** step (every token gathers information from relevant earlier tokens) and a **feed-forward** step (each token's vector is transformed independently, which is where much of the learned knowledge is thought to be stored). In a language model, attention is *causal*: a token can only look at tokens before it, never after, because at generation time the future does not exist yet.",
      "**Step 4 - Predict.** The final vector of the last position is converted into one score per vocabulary token (called *logits*), and a function called **softmax** turns those scores into probabilities.",
      "**Step 5 - Sample.** One token is chosen from the distribution (how exactly is covered in sampling-and-model-settings), appended to the input, and steps 1-5 repeat until the model produces a special end-of-turn token or hits the maximum length you allowed.",
      "**Training stages, summarised:** pretraining (predict the next token on a vast text corpus - learns language and knowledge), instruction tuning (learn to follow instructions from example conversations), and preference training such as RLHF (learn which of several answers people prefer). The later stages are much smaller than pretraining but change the model's *behaviour* a lot.",
      "**Why it can be wrong:** the model outputs the most *plausible* text given its training, and plausibility is not truth. Gaps or errors in training data, the training cutoff, ambiguous prompts and the randomness of sampling all lead to fluent but incorrect answers. Good AI engineering supplies the right facts in the prompt (RAG), lets the model use tools, and checks outputs.",
    ),
    diagram: `"The cat sat on the"
        |  tokenise
        v
 [464][3797][3332][319][262]
        |  embed (+ position)
        v
 +-----------------------------+
 | transformer layer 1         |
 |  attention: look back       |
 |  feed-forward: transform    |
 +-----------------------------+
        |   ... many layers ...
        v
 scores for every token --> softmax
        v
 mat .41 | floor .18 | sofa .09 ...
        |  sample one
        v
 "mat"  --> append, repeat`,
    whyItExists: md(
      "Next-token prediction is a *self-supervised* task: the 'right answer' for every position is just the next token in existing text, so no human labelling is needed and you can train on almost unlimited data. Learning to predict text well forces the model to learn language, facts and reasoning patterns along the way.",
      "The transformer exists because earlier sequence models processed text one word at a time and struggled to connect words far apart. Attention connects any two positions directly and can be computed in parallel on GPUs, which made training on huge datasets practical.",
      "Instruction tuning and RLHF exist because a raw text predictor is not a helpful assistant; these stages align the model's behaviour with what users actually want.",
    ),
    whenToUse: md(
      "Understanding this mechanism helps you every day as an AI engineer: it explains why the prompt matters so much (it is the context for prediction), why output is billed per token, why long outputs take longer (one token at a time), why the model may be outdated (training cutoff), and why you must supply facts and verify outputs.",
    ),
    whenNotToUse: md(
      "You do not need to understand the maths of transformers to build good applications; do not get stuck on matrix calculus before shipping your first prompt. Also avoid anthropomorphising: 'the model thinks/knows/wants' is convenient shorthand, but design your systems around what it actually is - a powerful next-token predictor shaped by training.",
    ),
    commonMistakes: [
      "Believing the model retrieves sentences from a stored copy of its training data; it generates from learned parameters.",
      "Expecting the model to know recent events after its training cutoff without being told.",
      "Assuming the model learns from your conversation permanently; parameters do not change during inference.",
      "Thinking the model plans the whole answer before writing it - it produces one token at a time, so asking it to reason before answering can help.",
      "Treating fluent, confident text as evidence of correctness.",
      "Confusing a base model (continues text) with an instruction-tuned chat model (follows requests).",
      "Assuming the model sees characters; it sees tokens, which is why letter-counting and spelling tasks can trip it up.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In the bigram demo, add two sentences to the corpus and print the new distribution after 'the'. Which probabilities changed and why?" },
      { difficulty: "Easy", prompt: "Explain to a friend, in four sentences, the difference between pretraining, instruction tuning and RLHF." },
      { difficulty: "Medium", prompt: "Extend the bigram model into a trigram model: predict the next word from the previous TWO words. Does greedy generation still loop?" },
      { difficulty: "Medium", prompt: "In the attention demo, change the query vector so that 'it' attends most to 'street'. What does that correspond to in the sentence?" },
      { difficulty: "Hard", prompt: "Build a character-level bigram model: train it on a paragraph of text, then generate 80 characters by sampling (not greedy) using a seeded random number generator. Compare the output with the greedy version." },
    ],
    interviewQuestions: [
      { question: "What is an LLM actually trained to do?", answer: "Predict the next token given the previous tokens. During pretraining it sees vast amounts of text and adjusts its parameters to make the real next token more likely. Generation repeats that prediction one token at a time." },
      { question: "What is attention, intuitively?", answer: "A mechanism that lets each token weigh how relevant every earlier token is and mix in information from the relevant ones. It is computed by comparing query and key vectors, normalising the scores with softmax, and averaging value vectors with those weights." },
      { question: "What is the difference between a base model and a chat/instruct model?", answer: "A base model has only been pretrained and continues text. A chat model has additionally been instruction-tuned and preference-trained (e.g. RLHF) to follow instructions, answer helpfully and refuse harmful requests." },
      { question: "What does RLHF do?", answer: "Reinforcement learning from human feedback: people compare model outputs, a reward signal is built from those preferences, and the model is optimised to produce outputs people prefer. It shapes helpfulness, tone, honesty and safety rather than teaching new knowledge." },
      { question: "Why do LLMs hallucinate?", answer: "They are trained to produce plausible continuations, not verified facts. With gaps or errors in training data, a training cutoff, ambiguous prompts or randomness in sampling, the most plausible text can be wrong, and the model has no built-in fact check." },
      { question: "Why is generation slower than reading the prompt?", answer: "The prompt's tokens can be processed in parallel, but output is autoregressive: each new token depends on the previous one, so tokens are produced one after another." },
      { question: "Does an LLM remember previous conversations?", answer: "Not by itself. Its parameters are fixed at inference time and the API is stateless. Any memory comes from the application sending previous messages or retrieved information again in the prompt." },
    ],
    prerequisites: ["what-is-ai"],
    relatedTopics: ["tokens-and-context-windows", "sampling-and-model-settings", "hallucinations-and-limitations", "embeddings", "prompting-basics"],
    keywords: ["llm", "next token prediction", "transformer", "attention", "self-attention", "pretraining", "instruction tuning", "rlhf", "base model", "autoregressive", "softmax", "logits", "training cutoff", "probability distribution"],
  },

  {
    id: "tokens-and-context-windows",
    title: "Tokens and Context Windows",
    level: "beginner",
    description: "What tokens are, how tokenizers split text, why everything is counted in tokens, and how the context window limits what a model can see.",
    explanation: md(
      "Models do not read letters or words; they read **tokens**. A token is a chunk of text from a fixed **vocabulary** that the model's **tokenizer** knows. Common words are often a single token (`the`, `cat`), rarer words are split into pieces (`tokenization` might become `token` + `ization`), and spaces and punctuation are part of tokens too. Each token maps to an integer **token id**.",
      "Why not just use characters or whole words? Characters make sequences very long (more work per sentence). Whole words make the vocabulary enormous and cannot handle new words, typos or code. **Subword** tokenizers are the compromise: frequent chunks get their own token, and anything else can still be spelled out from smaller pieces. The most common family is **Byte Pair Encoding (BPE)**: start from single bytes/characters and repeatedly merge the most frequent adjacent pair into a new token.",
      "A rough rule of thumb for English prose is that a token is about three-quarters of a word, or around four characters. Treat this only as a quick estimate: code, numbers, non-English languages and unusual formatting usually use more tokens per character, and different model families use different tokenizers. When the number matters, count with the provider's tokenizer or token-counting endpoint.",
      "Tokens matter for three practical reasons:",
      "- **Cost**: LLM APIs bill by input tokens (what you send) and output tokens (what the model writes), usually at different rates.\n- **Speed**: output is produced one token at a time, so longer answers take proportionally longer.\n- **Limits**: every model has a maximum context window and you set a maximum output length.",
      "The **context window** is the maximum number of tokens the model can consider in one request - your system prompt, the whole conversation history, any documents you paste in, tool definitions, *and* the tokens it generates in its reply all share it. Anything outside the window simply does not exist for the model. Context windows of modern models are large (whole books can fit), but they are finite, and filling them has costs: more money, more latency, and often worse attention to details buried in the middle of a huge prompt.",
      "Because the API is **stateless** (it does not remember previous requests), a chat application resends the entire conversation each turn. Long conversations therefore grow until they approach the window and must be trimmed or summarised. This is the root of many design decisions in RAG and agents: you cannot paste everything, so you must *choose* what goes into the context.",
      "Tokenization also explains some odd model behaviours: counting the letters in a word, reversing strings, or exact character-level arithmetic can be harder than expected, because the model sees `straw` + `berry` as chunks, not as individual letters.",
    ),
    analogy:
      "Tokens are like Scrabble tiles that can hold several letters at once: common chunks get their own tile ('ing', 'the'), rare words must be built from several smaller tiles. The context window is the size of the table: the model can only look at the tiles on the table right now. Your instructions, the chat so far, any documents and the reply being written all have to fit on that table together.",
    examples: [
      {
        title: "A toy tokenizer: greedy longest-match against a vocabulary",
        code: `// Real tokenizers have tens of thousands of entries learned from data.
const vocab = ["un", "believ", "able", "token", "ization", "the", " ", "s",
  "a", "b", "c", "d", "e", "i", "l", "n", "o", "r", "t", "u", "v", "z", "k", "!"];
const idOf = Object.fromEntries(vocab.map((t, i) => [t, i]));

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    // try the longest vocabulary entry that matches at position i
    let match = null;
    for (const t of vocab) {
      if (text.startsWith(t, i) && (!match || t.length > match.length)) match = t;
    }
    if (!match) throw new Error("no token for '" + text[i] + "'");
    tokens.push(match);
    i += match.length;
  }
  return tokens;
}

for (const text of ["unbelievable", "tokenization", "the tokens", "unbelievable!"]) {
  const toks = tokenize(text);
  console.log(JSON.stringify(text), "->", toks.map(t => JSON.stringify(t)).join(" "),
    "| ids:", toks.map(t => idOf[t]).join(","), "| count:", toks.length);
}`,
        explanation: "'unbelievable' costs 3 tokens because the vocabulary has those chunks. 'the tokens' needs a space token and then falls back to 's'. Words the vocabulary covers well are cheap; unusual strings cost more tokens.",
        walkthrough: [
          { code: "const vocab = [...]", explanation: "The tokenizer's fixed vocabulary. Position in the list = token id." },
          { code: "text.startsWith(t, i) && t.length > match.length", explanation: "At each position, pick the longest vocabulary piece that matches." },
          { code: "toks.map(t => idOf[t])", explanation: "The model never sees the text itself - only these integer ids." },
        ],
      },
      {
        title: "How a BPE vocabulary is learned: merge the most frequent pair",
        code: `// Start with characters; repeatedly merge the most frequent adjacent pair.
const words = ["low", "low", "low", "lower", "lowest", "newest", "newest", "widest"];
let seqs = words.map(w => w.split(""));

function countPairs(seqs) {
  const counts = new Map();
  for (const s of seqs) {
    for (let i = 0; i < s.length - 1; i++) {
      const pair = s[i] + "|" + s[i + 1];
      counts.set(pair, (counts.get(pair) || 0) + 1);
    }
  }
  return counts;
}

for (let step = 1; step <= 6; step++) {
  const counts = countPairs(seqs);
  let best = null, bestCount = 0;
  for (const [pair, c] of counts) if (c > bestCount) { best = pair; bestCount = c; }
  const [a, b] = best.split("|");
  seqs = seqs.map(s => {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { out.push(a + b); i++; }
      else out.push(s[i]);
    }
    return out;
  });
  console.log("merge " + step + ": '" + a + "' + '" + b + "' -> '" + a + b + "' (seen " + bestCount + "x)");
}
const unique = [...new Set(words)];
for (const w of unique) {
  console.log(w.padEnd(7), "->", seqs[words.indexOf(w)].join(" | "));
}`,
        explanation: "After a few merges, frequent chunks like 'low' and 'est' become single tokens. Real tokenizers run tens of thousands of merges over huge corpora, usually on raw bytes so any text (emoji, any language, binary-ish strings) can be encoded.",
      },
      {
        title: "Budgeting a context window",
        code: `// Rough estimate only: ~4 characters per token for English prose.
const estimateTokens = text => Math.ceil(text.length / 4);

const WINDOW = 200000;        // example number for this exercise, not a real model's limit
const MAX_OUTPUT = 16000;     // reserve room for the reply

const systemPrompt = "You are a helpful support assistant for Acme Cloud.";
const history = Array.from({ length: 40 }, (_, i) => "turn " + i + ": " + "x".repeat(2000));
const document = "y".repeat(700000);

const parts = {
  system: estimateTokens(systemPrompt),
  history: history.reduce((s, h) => s + estimateTokens(h), 0),
  document: estimateTokens(document),
};
const input = parts.system + parts.history + parts.document;
console.log("estimated input tokens:", input, parts);
console.log("input + reserved output:", input + MAX_OUTPUT, "of", WINDOW);

if (input + MAX_OUTPUT > WINDOW) {
  // Strategy: keep the system prompt, keep the newest turns, drop the oldest
  let budget = WINDOW - MAX_OUTPUT - parts.system - parts.document;
  const kept = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estimateTokens(history[i]);
    if (t > budget) break;
    kept.unshift(history[i]);
    budget -= t;
  }
  console.log("too big: keeping the newest", kept.length, "of", history.length, "turns");
}`,
        explanation: "Every application that keeps a conversation going needs a policy like this: reserve output space, keep instructions, and trim or summarise old history. Better still, do not paste whole documents - retrieve only the relevant parts (what-is-rag).",
      },
      {
        title: "Counting tokens exactly with the API (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

messages = [{"role": "user", "content": "Summarise the plot of Hamlet in three sentences."}]

# Count before sending (useful for budgeting and trimming)
count = client.messages.count_tokens(
    model="claude-opus-5-5",
    system="You are a concise literature tutor.",
    messages=messages,
)
print("input tokens (counted):", count.input_tokens)

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system="You are a concise literature tutor.",
    messages=messages,
)
print("input tokens (billed):", resp.usage.input_tokens)
print("output tokens:", resp.usage.output_tokens)
print("stop reason:", resp.stop_reason)   # "max_tokens" means the reply was cut off`,
        explanation: "Never guess token counts in production code that enforces limits; use the provider's counter. Every response also reports actual usage, which you should log for cost tracking.",
      },
    ],
    howItWorks: md(
      "**Tokenizer training** happens once, before the model is trained: an algorithm such as BPE scans a large corpus and builds a vocabulary of frequent chunks. That vocabulary is then fixed for the model's lifetime - which is why different model families count tokens differently.",
      "**At request time**, your text is converted to token ids, the model processes them, and the generated ids are converted back to text (*detokenised*). The API reports how many input and output tokens were used.",
      "**The context window** is a hard limit of the model architecture and serving setup: the total of input tokens plus generated output tokens must fit. `max_tokens` in your request caps the output part. If the model reaches it, generation stops mid-thought and the response's stop reason says so (`max_tokens`).",
      "**Cost of long context**: attention compares tokens with each other, so processing very long inputs takes more compute and time. Providers price by token, and some offer *prompt caching* so a large, unchanging prefix (like a long document or system prompt) is cheaper and faster on repeat requests (see cost-and-latency).",
      "**Quality in long context**: models can usually find information anywhere in their window, but performance on detailed reasoning tends to be best when the context is focused and relevant. Placing long documents first and the question at the end, and clearly labelling sections, helps.",
    ),
    diagram: `             CONTEXT WINDOW (fixed size)
+-------------------------------------------------+
| system | tools | history ...| docs | question |  |
|<------------- input tokens ------------->|<out>|
+-------------------------------------------------+
                                            ^
                         reply grows here, token by
                         token, up to max_tokens

 "tokenization!" -> [token][ization][!] -> [8, 912, 0]`,
    whyItExists: md(
      "Neural networks work on numbers, so text must be turned into numbers. Tokens are the unit that balances vocabulary size against sequence length. The context window exists because memory and compute grow with sequence length; providers set a maximum that their hardware and model can handle well.",
    ),
    whenToUse: md(
      "Think in tokens whenever you estimate cost, set `max_tokens`, decide how much history to keep, choose chunk sizes for RAG, or debug a cut-off answer. Count tokens precisely (with the API) when you enforce hard limits; use the rough 4-characters estimate only for back-of-the-envelope planning.",
    ),
    whenNotToUse: md(
      "Do not try to fill the context window just because it is large. Stuffing in every document is slower, more expensive and often less accurate than retrieving the few relevant passages. Do not hard-code token estimates from one model's tokenizer when switching models; re-measure.",
    ),
    commonMistakes: [
      "Assuming one word equals one token; code, numbers and non-English text often use many more.",
      "Forgetting that the reply's tokens also count toward the context window, then getting truncated answers.",
      "Setting `max_tokens` too low and not checking `stop_reason == \"max_tokens\"`.",
      "Letting chat history grow forever until requests fail or become slow and expensive.",
      "Pasting whole knowledge bases into the prompt instead of retrieving relevant parts.",
      "Using a character-based estimate for billing or hard limits instead of the provider's token counter.",
      "Expecting reliable character-level operations (counting letters, exact reversals) without giving the model a tool or code to do it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Using the toy tokenizer, add two vocabulary entries that reduce the token count of 'the tokens' and show the before/after counts." },
      { difficulty: "Easy", prompt: "Explain why the context window must hold both the conversation history and the model's reply." },
      { difficulty: "Medium", prompt: "Run the BPE demo with 12 merges instead of 6. Which tokens appear, and how many tokens does each word use at the end?" },
      { difficulty: "Medium", prompt: "Write a function `trimHistory(messages, budget)` that keeps the first (system-like) message and as many of the most recent messages as fit in the token budget, using the rough estimator." },
      { difficulty: "Hard", prompt: "Build a mini BPE tokenizer with two functions: `train(corpus, numMerges)` returns an ordered list of merges, and `encode(text, merges)` applies them in order to a new string. Test that encoding a training word yields the same tokens as training produced." },
    ],
    interviewQuestions: [
      { question: "What is a token?", answer: "A unit of text from the model's fixed vocabulary - a word, sub-word, punctuation mark or byte sequence - represented as an integer id. Models read and write tokens, and APIs bill by them." },
      { question: "Why do LLMs use sub-word tokenization?", answer: "It balances vocabulary size and sequence length: frequent chunks are single tokens, while rare words, typos, code and any language can still be represented by combining smaller pieces, so nothing is out of vocabulary." },
      { question: "What is a context window?", answer: "The maximum number of tokens a model can handle in one request, covering system prompt, history, documents, tool definitions and the generated output together." },
      { question: "A reply is cut off mid-sentence. What do you check?", answer: "The `stop_reason`: if it is `max_tokens`, the output limit was hit. Raise `max_tokens`, ask for a shorter answer, or continue in a follow-up request. Also check the total context is not near the window limit." },
      { question: "How do you handle a conversation that is getting too long?", answer: "Keep the system prompt, keep recent turns, and drop or summarise older turns; store important facts separately and retrieve them when needed. Count tokens with the provider's counter to enforce the budget." },
      { question: "Why might an LLM fail to count the letters in a word?", answer: "It sees tokens, not characters. A word may be one or two tokens, so the individual letters are not directly visible; character-level tasks are better done with code or a tool." },
    ],
    prerequisites: ["how-llms-work"],
    relatedTopics: ["calling-an-llm-api", "sampling-and-model-settings", "chunking", "cost-and-latency", "agent-memory"],
    keywords: ["token", "tokenizer", "tokenization", "bpe", "byte pair encoding", "vocabulary", "context window", "max_tokens", "count_tokens", "input tokens", "output tokens", "truncation", "stop_reason"],
  },

  {
    id: "prompting-basics",
    title: "Prompt Engineering Basics",
    level: "beginner",
    description: "How to write prompts that work: system vs user messages, clear instructions, context, examples (few-shot), XML-tag structure and asking for step-by-step reasoning.",
    explanation: md(
      "A **prompt** is everything you send the model: instructions, context, examples, and the actual question. Since an LLM predicts the most plausible continuation of its input (see how-llms-work), the prompt *is* the program. **Prompt engineering** is the practice of writing that input so the model reliably does what you want.",
      "Chat APIs split the prompt into roles:",
      "- **System prompt**: standing instructions that apply to the whole conversation - the model's role, rules, tone, output format, what to do when unsure. Set by you, the developer, not by the end user.\n- **User messages**: the requests (from your end user or from your code).\n- **Assistant messages**: the model's previous replies, which you send back to give it the conversation history.",
      "The single most useful rule: **be clear and specific, as if briefing a smart new colleague who knows nothing about your project.** A vague prompt ('summarise this') gets a generic result. A specific prompt says who the output is for, what to include, how long, what format, and what to do in edge cases.",
      "Techniques that consistently help:",
      "- **Give context and the reason**: 'Summarise this incident report for the on-call engineer who needs to decide whether to page the database team' beats 'summarise'. Knowing *why* lets the model make good judgement calls.\n- **Say what to do, not only what not to do**: 'Write in plain prose paragraphs' works better than 'don't use bullet points'.\n- **Show examples (few-shot prompting)**: 2-5 examples of input and ideal output teach format and style far more precisely than description alone. Make them varied so the model does not copy one example too literally.\n- **Structure with XML tags**: wrap different parts in labelled tags such as `<document>`, `<instructions>`, `<example>`. This prevents the model from confusing your instructions with the data it should process, and lets you refer to parts by name ('using the report in the <report> tags').\n- **Put long documents first, the question last**: with lots of material, place the documents at the top and your instructions and question at the end.\n- **Ask for reasoning before the answer** when the task needs thinking: 'First work through the problem step by step, then give the final answer.' This is often called *chain-of-thought*. Many current models also have built-in thinking that you control with an effort setting (see sampling-and-model-settings).\n- **Define the output format precisely**: give a template or a schema; for machine-readable output use structured outputs (see structured-output).\n- **Allow uncertainty**: tell the model it may say it does not know, or that information is missing, instead of guessing.",
      "Prompting is **iterative engineering**, not magic words. Write a prompt, run it on a set of realistic test inputs (including awkward ones), look at the failures, adjust, and run again. Keep prompts in version control and keep the test inputs, because a change that fixes one case can break another.",
      "A common trap is the 'prompt that only works on the demo'. Real users paste messy text, ask off-topic questions, and write in other languages. Test with those.",
    ),
    analogy:
      "Prompting is like delegating to a brilliant contractor who has never visited your company. If you say 'fix the website', you get something - but probably not what you wanted. If you say 'the checkout button on mobile overlaps the price; customers are abandoning carts; keep the brand colours; here are two pages that look right', you get exactly what you need. The system prompt is the contractor's standing brief; examples are 'here is what good looks like'; XML tags are labelled folders so nothing gets mixed up.",
    examples: [
      {
        title: "Assembling a well-structured prompt (offline)",
        code: `// Build a prompt from parts. The output is what you would send to the model.
function buildPrompt({ document, question, examples }) {
  const shots = examples
    .map(e => "<example>" + " input: " + e.input + " | output: " + e.output + " </example>")
    .join(" ");
  return [
    "<document>",
    document,
    "</document>",
    "",
    "<examples>",
    shots,
    "</examples>",
    "",
    "<instructions>",
    "Answer the question using only the document above.",
    "If the document does not contain the answer, reply exactly: NOT IN DOCUMENT.",
    "Answer in one sentence, in the style of the examples.",
    "</instructions>",
    "",
    "Question: " + question,
  ].join(" ~ "); // using " ~ " as a visible line separator for this demo
}

const prompt = buildPrompt({
  document: "Acme Cloud refunds are available within 30 days of purchase. Annual plans are refunded pro rata.",
  question: "Can I get a refund after 2 weeks?",
  examples: [
    { input: "Is there a free tier?", output: "NOT IN DOCUMENT." },
    { input: "How long is the refund window?", output: "Refunds are available within 30 days of purchase." },
  ],
});

for (const line of prompt.split(" ~ ")) console.log(line);
console.log("---");
console.log("approx tokens:", Math.ceil(prompt.length / 4));`,
        explanation: "Notice the structure: data in tags at the top, examples showing both a normal answer and the 'not found' answer, explicit instructions including the fallback, and the question last. This shape is reused in almost every RAG prompt later in the subject.",
        walkthrough: [
          { code: "<document> ... </document>", explanation: "The data is clearly separated from instructions, so text inside the document cannot be mistaken for an instruction." },
          { code: "examples.map(...)", explanation: "Few-shot examples: one normal answer and one 'not found' answer teach both behaviours." },
          { code: "If the document does not contain the answer, reply exactly: NOT IN DOCUMENT.", explanation: "Explicit permission and format for uncertainty reduces made-up answers." },
          { code: "Question: ...", explanation: "The actual question goes last, after all the long material." },
        ],
      },
      {
        title: "System prompt, XML tags and few-shot examples (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

SYSTEM = """You classify customer support tickets for an online bookshop.
The labels go straight into our routing system, so reply with exactly one
label from this list and nothing else: shipping, billing, account, other.
If a ticket mentions several issues, choose the one the customer is most upset about."""

# Few-shot examples are sent as earlier conversation turns.
examples = [
    {"role": "user", "content": "<ticket>My parcel says delivered but it is not here.</ticket>"},
    {"role": "assistant", "content": "shipping"},
    {"role": "user", "content": "<ticket>I was charged twice for the same order!!</ticket>"},
    {"role": "assistant", "content": "billing"},
]

ticket = "I can't log in since I changed my email, and also the book arrived late."

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system=SYSTEM,
    messages=examples + [{"role": "user", "content": f"<ticket>{ticket}</ticket>"}],
)
label = next(b.text for b in resp.content if b.type == "text").strip()
print(label)   # most likely "account"`,
        explanation: "The system prompt explains the task AND why the format matters (it feeds a routing system), gives the allowed labels, and resolves the ambiguous case. The examples demonstrate the exact output shape. In production, also validate the label in code (see structured-output).",
      },
      {
        title: "Asking for reasoning before the answer (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

prompt = """<data>
Plan A: $12 per month, 3 users included, $5 per extra user.
Plan B: $30 per month, 10 users included, $2 per extra user.
</data>

Our team has 8 users today and expects 14 users next year.
Which plan is cheaper today, and which is cheaper next year?

Work through the calculation step by step inside <reasoning> tags,
then give the final recommendation in <answer> tags."""

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    messages=[{"role": "user", "content": prompt}],
)
text = next(b.text for b in resp.content if b.type == "text")

# Show only the answer part to the end user
start, end = text.find("<answer>"), text.find("</answer>")
print(text[start + len("<answer>"):end].strip() if start != -1 else text)`,
        explanation: "Writing out the steps gives the model 'room to think' in tokens before committing to an answer, which helps on multi-step problems. Separating reasoning and answer with tags lets your code show only the final part.",
      },
    ],
    howItWorks: md(
      "The model conditions every generated token on the entire prompt. Clear instructions and examples shift the probabilities toward the outputs you want; ambiguity spreads probability over many reasonable-but-different outputs, which you experience as inconsistency.",
      "**System prompts** are given special weight by chat-trained models because instruction tuning taught them that the system role holds the developer's rules. **Examples** work because the model is extremely good at continuing patterns (few-shot learning emerged from pretraining on text full of patterns). **XML tags** work because models were trained on lots of structured text and learn to treat tagged sections as distinct units.",
      "**Step-by-step reasoning** helps because each generated token is computed with a fixed amount of work. Producing intermediate steps lets the model spread a hard problem across many tokens and then condition the final answer on its own worked steps.",
      "A practical workflow: (1) write the task as if briefing a colleague; (2) collect 10-30 realistic test inputs including edge cases; (3) run and read the outputs; (4) fix the prompt where it failed, preferring explanations over shouting ('IMPORTANT!!!' tends to cause over-application); (5) re-run everything to catch regressions.",
    ),
    diagram: `+-------------------- prompt --------------------+
| SYSTEM: role, rules, format, why, fallbacks    |
+------------------------------------------------+
| USER:  <document> long material  </document>   |
|        <examples> input -> output </examples>  |
|        <instructions> what to do </instructions>|
|        Question goes LAST                      |
+------------------------------------------------+
                      |
                      v
              model predicts reply
                      |
          check output -> adjust prompt -> rerun`,
    whyItExists: md(
      "The same model can produce a mediocre or an excellent result depending only on its input. Prompt engineering exists because it is the cheapest, fastest lever you have: no training, no infrastructure, changes deploy instantly. Most tasks that people assume need fine-tuning are solved by a well-written prompt plus the right context.",
    ),
    whenToUse: md(
      "Always - every LLM feature starts with a prompt. Invest more effort when outputs feed other systems (strict format), when users are external (robustness to odd inputs), and when mistakes are expensive. Use few-shot examples whenever the exact output style matters; use XML tags whenever the prompt mixes instructions with data; ask for reasoning on multi-step or mathematical tasks.",
    ),
    whenNotToUse: md(
      "Do not rely on prompting alone to enforce hard guarantees (valid JSON, allowed values, security rules) - validate in code and use structured outputs and permissions. Do not try to fix missing knowledge with clever wording; supply the knowledge with retrieval (what-is-rag). Do not chase 'magic phrases' from the internet instead of testing on your own data.",
    ),
    commonMistakes: [
      "Writing vague instructions ('make it better') and blaming the model for generic results.",
      "Mixing instructions and user-supplied data without separating them, so text inside the data gets treated as instructions.",
      "Using a single example, which the model copies too literally; use several varied examples.",
      "Shouting with CAPITALS and 'NEVER' everywhere, which can make the model over-cautious or rigid; explain the reason instead.",
      "Testing a prompt on one or two happy-path inputs only.",
      "Putting the question before a long document instead of after it.",
      "Not telling the model what to do when information is missing, so it guesses.",
      "Changing prompts in production without re-running a test set.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Rewrite the prompt 'Summarise this email' into a specific prompt that names the audience, length, format and what to do if the email contains no action items." },
      { difficulty: "Easy", prompt: "Take the offline prompt builder and add a <context> section describing the reader (a customer on a mobile phone). Print the result." },
      { difficulty: "Medium", prompt: "Write a system prompt and three few-shot examples for extracting the sender's name, company and request from an email, in a fixed three-line format. List five tricky test emails to try it on." },
      { difficulty: "Medium", prompt: "Build a JS function `extractTag(text, tag)` that returns the content between <tag> and </tag>, or null if missing. Test it on text with zero, one and two answer blocks." },
      { difficulty: "Hard", prompt: "Build a tiny prompt test harness in Python: a list of (input, expected_label) pairs, a function that calls the API with your classification prompt, and a report of accuracy plus every failing case. Improve the prompt until accuracy stops improving." },
    ],
    interviewQuestions: [
      { question: "What is the difference between the system prompt and a user message?", answer: "The system prompt holds the developer's standing instructions for the whole conversation (role, rules, format, policies). User messages are individual requests. Models are trained to treat the system prompt as higher-priority context." },
      { question: "What is few-shot prompting and when do you use it?", answer: "Including several input/output examples in the prompt so the model infers the pattern. Use it when format, style or labelling conventions matter. Use varied examples, including edge cases, to avoid the model copying one example too closely." },
      { question: "Why structure prompts with XML tags?", answer: "Tags clearly separate instructions, documents, examples and inputs, which reduces confusion and makes it harder for data to be mistaken for instructions. They also make it easy to reference sections and to parse tagged output." },
      { question: "Why can asking the model to reason step by step improve answers?", answer: "Each token gets a bounded amount of computation. Writing intermediate steps lets the model spread the work across many tokens and base the final answer on its own explicit reasoning, which helps on multi-step problems." },
      { question: "How do you know a prompt change is an improvement?", answer: "Run it against a fixed set of representative test inputs with known good outputs, compare metrics (accuracy, format validity) before and after, and inspect failures. One good-looking example proves little." },
      { question: "How do you reduce made-up answers through prompting?", answer: "Provide the relevant source material, instruct the model to answer only from it, explicitly allow 'I don't know' with an exact fallback phrase, and ask for supporting quotes. Then verify in code where possible." },
    ],
    prerequisites: ["how-llms-work"],
    relatedTopics: ["calling-an-llm-api", "structured-output", "hallucinations-and-limitations", "grounded-generation-and-citations", "ai-security"],
    keywords: ["prompt engineering", "system prompt", "few-shot", "zero-shot", "xml tags", "chain of thought", "step by step", "instructions", "examples", "prompt template", "iteration"],
  },

  {
    id: "calling-an-llm-api",
    title: "Calling an LLM API",
    level: "beginner",
    description: "How applications talk to a model: API keys, the messages format, roles, statelessness, streaming, usage and stop reasons, errors and retries.",
    explanation: md(
      "An **API** (application programming interface) is a defined way for one program to ask another program to do something. LLM providers run the models on their servers; your code sends an HTTP request containing the prompt and receives a response containing the generated text. An **SDK** (software development kit) is a library, such as the `anthropic` Python package, that wraps those HTTP calls in convenient functions.",
      "**API keys.** Every request is authenticated with a secret key tied to your account and billing. Keep it out of source code: store it in an environment variable (`ANTHROPIC_API_KEY`) or a secrets manager. Never ship it inside a browser or mobile app - anyone can extract it. Browser apps call *your* backend, which holds the key and calls the model.",
      "**The Messages format.** A request contains:",
      "- `model` - which model to use.\n- `max_tokens` - the maximum number of tokens the model may generate in this reply.\n- `system` (optional) - the system prompt.\n- `messages` - the conversation so far: a list of `{\"role\": ..., \"content\": ...}` objects. Roles are `user` and `assistant`; the first message is from the user and roles alternate.",
      "**The API is stateless.** The server does not remember your previous request. To have a multi-turn conversation, *your application* stores the history and sends all of it again each turn: user, assistant, user, assistant, ..., new user message. This is why long chats get more expensive per turn and why memory is an application concern (agent-memory).",
      "**The response** contains `content` - a list of *content blocks* (for plain chat, text blocks with `.type == \"text\"` and `.text`); `stop_reason` - why generation stopped (`end_turn` = finished naturally, `max_tokens` = hit your limit, `stop_sequence` = hit a stop string you set, `tool_use` = wants to call a tool, `refusal` = declined for safety reasons, `pause_turn` = a long server-side operation paused and you should continue it); and `usage` - `input_tokens` and `output_tokens` for cost tracking.",
      "**Streaming.** By default you wait for the whole answer. With streaming, the server sends tokens as they are generated, so users see text appear immediately. Use it for any user-facing chat, and for long outputs where waiting for the full response could hit request timeouts.",
      "**Errors and retries.** Network calls fail. Expect: invalid requests (400 - fix your code, do not retry), authentication problems (401/403 - check the key), rate limits (429 - you sent too much too fast; slow down), server errors and overload (500s, including 529 'overloaded' on Anthropic's API - retry later). The standard fix for temporary errors is **retry with exponential backoff and jitter**: wait 1s, 2s, 4s, 8s ... plus a little randomness so many clients do not retry in lockstep. The official SDKs already retry some temporary errors automatically (configurable with `max_retries`), and raise typed exceptions you can catch.",
      "**Timeouts.** Generation can take a while for long outputs. Set sensible timeouts, prefer streaming for long responses, and show progress to users.",
    ),
    analogy:
      "Calling an LLM API is like ordering from a restaurant kitchen through a hatch, where the kitchen has no memory. Each time, you hand over a complete order slip: who you are (API key), which chef (model), the house rules (system prompt), the whole conversation so far (messages), and how much food at most (max_tokens). The kitchen sends back the dish, a note saying why they stopped cooking (stop_reason), and the bill (usage). If the hatch is busy, you wait a bit longer each time before trying again.",
    examples: [
      {
        title: "Statelessness: the app must resend history (offline fake model)",
        code: `// A fake "model" that can only answer from what is in THIS request.
function fakeLLM(messages) {
  const all = messages.map(m => m.content).join(" ");
  const last = messages[messages.length - 1].content;
  if (last.includes("my name")) {
    const m = all.match(/I am (\\w+)/);
    return m ? "Your name is " + m[1] + "." : "I don't know your name - you haven't told me in this conversation.";
  }
  return "Nice to meet you!";
}

// Wrong: send only the newest message each time
console.log("Stateless call 1:", fakeLLM([{ role: "user", content: "Hi, I am Priya" }]));
console.log("Stateless call 2:", fakeLLM([{ role: "user", content: "What is my name?" }]));

// Right: keep the history in your app and send all of it
const history = [];
function chat(userText) {
  history.push({ role: "user", content: userText });
  const reply = fakeLLM(history);
  history.push({ role: "assistant", content: reply });
  return reply;
}
console.log("With history 1:", chat("Hi, I am Priya"));
console.log("With history 2:", chat("What is my name?"));
console.log("messages sent on turn 2:", history.length - 1);`,
        explanation: "Real LLM APIs behave like this fake: each request is independent. 'Memory' in a chatbot is just the app resending earlier messages.",
        walkthrough: [
          { code: "fakeLLM([{ role: \"user\", content: \"What is my name?\" }])", explanation: "Only the newest message is sent, so the model has no way to know the name." },
          { code: "history.push({ role: \"user\", ... })", explanation: "The app keeps the conversation." },
          { code: "fakeLLM(history)", explanation: "Every turn sends the full history: user, assistant, user..." },
        ],
      },
      {
        title: "Retry with exponential backoff and jitter (simulated)",
        code: `// Seeded random numbers so the demo is repeatable
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

// A fake API that is overloaded for the first 3 calls
let calls = 0;
function fakeApi() {
  calls++;
  if (calls <= 3) { const e = new Error("overloaded"); e.status = 529; throw e; }
  return { text: "Hello!", usage: { input_tokens: 12, output_tokens: 3 } };
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504, 529]);

function callWithRetry(fn, maxRetries = 5, baseMs = 1000, capMs = 30000) {
  let simulatedWait = 0;
  for (let attempt = 0; ; attempt++) {
    try {
      const result = fn();
      console.log("success after", attempt, "retries; total simulated wait", simulatedWait, "ms");
      return result;
    } catch (err) {
      if (!RETRYABLE.has(err.status) || attempt >= maxRetries) throw err;
      const exp = Math.min(capMs, baseMs * 2 ** attempt);
      const wait = Math.round(exp / 2 + rand() * (exp / 2)); // jitter
      simulatedWait += wait;
      console.log("attempt", attempt + 1, "failed with", err.status, "- waiting", wait, "ms");
    }
  }
}

console.log(callWithRetry(fakeApi));`,
        explanation: "In real code you would actually sleep for `wait` milliseconds. Note what is NOT retried: a 400 (bad request) will fail the same way every time, so retrying just wastes money and time.",
      },
      {
        title: "A complete multi-turn chat loop (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY
messages = []                            # the app owns the history

while True:
    user_text = input("you> ").strip()
    if user_text in ("", "quit"):
        break
    messages.append({"role": "user", "content": user_text})

    resp = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=16000,
        system="You are a friendly, concise assistant.",
        messages=messages,
    )
    reply = "".join(b.text for b in resp.content if b.type == "text")
    print("claude>", reply)

    # Store the assistant turn so the next request includes it
    messages.append({"role": "assistant", "content": resp.content})

    if resp.stop_reason == "max_tokens":
        print("(reply was cut off - consider raising max_tokens)")
    print(f"(tokens in/out: {resp.usage.input_tokens}/{resp.usage.output_tokens})")`,
        explanation: "Watch the input token count grow each turn: that is the whole history being resent. Appending `resp.content` (not just the text) keeps every content block intact, which matters once tools are involved.",
      },
      {
        title: "Streaming and error handling (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic(max_retries=4)   # SDK retries some transient errors itself

try:
    with client.messages.stream(
        model="claude-opus-5-5",
        max_tokens=64000,
        messages=[{"role": "user", "content": "Explain HTTP caching to a junior developer."}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
    final = stream.get_final_message()
    print("\\n\\nstop_reason:", final.stop_reason, "usage:", final.usage)

except anthropic.RateLimitError:
    print("Rate limited (429) even after retries - slow down or queue requests.")
except anthropic.APIStatusError as e:
    print("API returned an error status:", e.status_code, e.message)
except anthropic.APIConnectionError:
    print("Could not reach the API - check the network.")`,
        explanation: "Typed exceptions let you treat errors differently: queue and retry rate limits, alert on authentication errors, fix the code on bad requests. Streaming keeps long responses responsive.",
      },
    ],
    howItWorks: md(
      "Under the SDK, a call is an HTTPS POST to the provider's messages endpoint with a JSON body (model, max_tokens, system, messages) and headers carrying your API key and an API version. The provider tokenises the input, runs the model, and returns JSON with the content blocks, stop reason and usage.",
      "With streaming, the response is sent as **server-sent events**: a series of small events (message start, content block start, text deltas, message stop) over one long-lived HTTP connection. The SDK's `text_stream` yields just the text deltas; `get_final_message()` assembles the complete message.",
      "Rate limits are applied per organisation, typically on requests per minute and tokens per minute. Exceeding them returns 429 with headers indicating when to retry. Backoff with jitter spreads retries out so a temporary overload clears instead of being hammered by synchronised retries.",
      "Production checklist: key in environment/secret store; backend-only calls; timeouts set; retries for transient errors only; log model, token usage, latency and stop reason for every call; handle `max_tokens` and `refusal` stop reasons explicitly.",
    ),
    diagram: `  your app (backend)                   provider
 +--------------------+  HTTPS POST  +-------------+
 | key from env       |------------->| auth, rate  |
 | history[] (state!) |  model,      | limits      |
 | + new user message |  max_tokens, |   |         |
 |                    |  system,     |   v         |
 |                    |  messages    | run model   |
 |                    |<-------------|             |
 | append reply to    |  content,    +-------------+
 | history            |  stop_reason,
 +--------------------+  usage
   on 429/5xx: wait 1s, 2s, 4s (+jitter), retry`,
    whyItExists: md(
      "Running a large model needs specialised hardware; APIs let any application use state-of-the-art models with a few lines of code and pay per token. A stateless design keeps the service simple and scalable: any server can handle any request because everything needed is in the request itself.",
    ),
    whenToUse: md(
      "Use the hosted API for virtually all application development: prototypes, production chat, batch processing, agents. Use streaming for interactive UIs and long outputs. Use the SDK rather than hand-written HTTP calls - it handles retries, typing and streaming correctly.",
    ),
    whenNotToUse: md(
      "Do not call the API directly from front-end code with your key. Do not block a web request on a very long non-streaming generation; stream it or move it to a background job. Do not call an LLM for work plain code does deterministically - it costs money and adds latency and failure modes.",
    ),
    commonMistakes: [
      "Committing the API key to git or embedding it in a client-side app.",
      "Expecting the model to remember earlier requests without resending the history.",
      "Sending two user messages in a row or starting with an assistant message, breaking the alternating-roles rule.",
      "Assuming `resp.content[0]` is always text; iterate the blocks and check `.type`.",
      "Ignoring `stop_reason`, so truncated (`max_tokens`) or refused replies are shown as if complete.",
      "Retrying every error, including 400 bad requests, or retrying instantly in a tight loop with no backoff.",
      "Not logging token usage, then being surprised by the bill.",
      "Not using streaming for long outputs and hitting timeouts.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Make your first API call with the Python SDK and print the text, the stop reason and both token counts." },
      { difficulty: "Easy", prompt: "In the statelessness demo, add a third turn 'Where do I live?' after telling the bot your city on turn 2. Extend the fake model to answer it." },
      { difficulty: "Medium", prompt: "Modify the retry demo so 400 errors are thrown immediately and 429 errors respect a `retryAfterMs` property on the error if present." },
      { difficulty: "Medium", prompt: "Build the Python chat loop with streaming output, and print the cumulative tokens used for the whole session when the user quits." },
      { difficulty: "Hard", prompt: "Build a small backend endpoint (Flask or FastAPI) that accepts a conversation from a browser, calls the model with the server-side key, streams the reply back, and logs model, latency, tokens and stop reason per request." },
    ],
    interviewQuestions: [
      { question: "What does it mean that the Messages API is stateless?", answer: "The server keeps no conversation memory between requests. The client must send the full relevant history in `messages` each time, which is why the application manages memory, trimming and summarisation." },
      { question: "What is in a typical LLM API request and response?", answer: "Request: model, max_tokens, optional system prompt, and the messages list with alternating user/assistant roles. Response: a list of content blocks, a stop_reason, and usage with input and output token counts." },
      { question: "Name the main stop reasons and how you handle them.", answer: "`end_turn` - normal completion. `max_tokens` - truncated, raise the limit or continue. `stop_sequence` - a configured stop string was produced. `tool_use` - run the requested tool and send results back. `refusal` - the model declined; show a safe message. `pause_turn` - a long server-side turn paused; send the conversation back to continue." },
      { question: "How do you handle rate limits and transient errors?", answer: "Retry only transient errors (429, 5xx, overloaded) using exponential backoff with jitter and a maximum number of attempts, respect retry-after hints, and don't retry 4xx client errors like 400. Also smooth traffic with queues and stay within your token-per-minute budget." },
      { question: "Why stream responses?", answer: "Users see output immediately instead of waiting for the full generation, and long responses avoid HTTP timeouts. The total generation time is similar, but perceived latency drops dramatically." },
      { question: "Where should the API key live in a web app?", answer: "Only on the server, loaded from an environment variable or secret manager. The browser calls your backend, which authenticates the user, applies limits and then calls the model." },
    ],
    prerequisites: ["tokens-and-context-windows", "prompting-basics"],
    relatedTopics: ["sampling-and-model-settings", "structured-output", "tool-use", "agent-memory", "cost-and-latency", "observability-and-debugging"],
    keywords: ["api", "sdk", "anthropic", "messages api", "api key", "roles", "stateless", "streaming", "server-sent events", "stop_reason", "usage", "rate limit", "429", "retry", "exponential backoff", "jitter"],
  },

  {
    id: "sampling-and-model-settings",
    title: "Sampling, Temperature and Model Settings",
    level: "beginner",
    description: "How the next token is chosen (greedy, temperature, top-k, top-p), and the settings you actually control: max tokens, stop sequences, effort and thinking.",
    explanation: md(
      "At each step an LLM produces a probability distribution over possible next tokens (see how-llms-work). **Sampling** is the rule for picking one token from that distribution. The choice of rule controls whether output is predictable or varied.",
      "- **Greedy decoding**: always take the single most likely token. Predictable, but tends to be repetitive and bland.\n- **Random sampling**: pick a token at random, weighted by its probability. A token with probability 0.4 is picked 40% of the time. Varied, but occasionally picks something odd.\n- **Temperature** reshapes the distribution before sampling. The model's raw scores (logits) are divided by the temperature `T` before softmax. `T < 1` sharpens the distribution (likely tokens become even more likely - closer to greedy). `T > 1` flattens it (unlikely tokens get more chances - more surprising, more errors). `T` near 0 is effectively greedy.\n- **Top-k**: only consider the `k` most likely tokens, then sample among them.\n- **Top-p (nucleus sampling)**: only consider the smallest set of top tokens whose probabilities add up to at least `p` (e.g. 0.9), then sample among them. This adapts: when the model is confident the set is tiny; when it is unsure the set is larger.",
      "These knobs are general LLM concepts and many model APIs expose them as request parameters. However, **some of the newest models fix their sampling internally** and do not accept temperature or similar parameters - this includes the current Claude models used in this subject. Instead of tuning randomness, you steer them with the prompt and with an **effort** control.",
      "Settings you will use with current Claude models:",
      "- `max_tokens` - the cap on generated tokens (including any thinking). Too low and replies get cut off (`stop_reason == \"max_tokens\"`); there is no charge for unused allowance, you pay for tokens actually produced.\n- `stop_sequences` - a list of strings; generation stops as soon as one is produced (`stop_reason == \"stop_sequence\"`). Useful for cutting output at a known delimiter.\n- `system` - the system prompt, which is the main way to control style and behaviour.\n- **Effort** - `output_config={\"effort\": ...}` with values `low`, `medium`, `high`, `xhigh` or `max`. Current models *think* adaptively (they may reason internally before answering); effort tells the model how much reasoning and thoroughness to apply. Lower effort means faster, cheaper, shorter work; higher effort means more careful reasoning on hard problems.",
      "**Determinism.** Even at the lowest-randomness settings, LLM outputs are not guaranteed to be identical across calls (serving infrastructure, batching and model updates all play a part). Design systems that tolerate variation: validate outputs, use structured outputs for machine-readable data, and test with several runs.",
      "Practical intuition for models that do expose temperature: low values for extraction, classification and factual Q&A; moderate values for general chat; higher values for brainstorming and creative writing - and change one setting at a time while measuring on a test set.",
    ),
    analogy:
      "Picture the model holding a bag of marbles for the next word, with more marbles for likelier words. Greedy picks the colour with the most marbles every time. Temperature is like adding or removing marbles: low temperature gives the favourite colour almost all the marbles; high temperature evens the bag out. Top-k says 'throw out every colour except the k biggest piles'; top-p says 'keep only the biggest piles that together make up 90% of the bag'. Effort is different: it is like telling the player how long to think before drawing at all.",
    examples: [
      {
        title: "Temperature sampling over a fixed distribution (seeded)",
        code: `// Seeded PRNG so results are reproducible
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pretend logits (raw scores) for the word after "The weather today is"
const tokens = ["sunny", "cloudy", "rainy", "lovely", "purple"];
const logits = [3.0, 2.2, 1.8, 1.0, -1.0];

function softmax(scores, temperature) {
  const scaled = scores.map(s => s / temperature);
  const max = Math.max(...scaled);              // subtract max for numerical stability
  const exps = scaled.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function sample(probs, rand) {
  let r = rand(), cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

for (const T of [0.2, 1.0, 2.0]) {
  const probs = softmax(logits, T);
  const rand = mulberry32(7);
  const counts = new Array(tokens.length).fill(0);
  for (let i = 0; i < 1000; i++) counts[sample(probs, rand)]++;
  console.log("T=" + T);
  tokens.forEach((t, i) =>
    console.log("  " + t.padEnd(7), "p=" + probs[i].toFixed(3), "picked", counts[i], "/1000"));
}`,
        explanation: "At T=0.2 'sunny' wins almost every time (near-greedy). At T=2.0 even 'purple' gets picked sometimes - more variety, more nonsense. That is the whole trade-off temperature controls.",
        walkthrough: [
          { code: "scores.map(s => s / temperature)", explanation: "Temperature divides the raw scores: small T exaggerates differences, large T shrinks them." },
          { code: "Math.exp(s - max) ... / sum", explanation: "Softmax turns scores into probabilities that sum to 1." },
          { code: "if (r < cumulative) return i;", explanation: "Weighted random pick: walk the cumulative probabilities until passing the random number." },
        ],
      },
      {
        title: "Top-k and top-p filtering",
        code: `const dist = [
  ["sunny", 0.45], ["cloudy", 0.25], ["rainy", 0.15],
  ["lovely", 0.08], ["windy", 0.05], ["purple", 0.02],
];

function topK(d, k) {
  const kept = [...d].sort((a, b) => b[1] - a[1]).slice(0, k);
  const total = kept.reduce((s, x) => s + x[1], 0);
  return kept.map(([t, p]) => [t, +(p / total).toFixed(3)]); // renormalise
}

function topP(d, p) {
  const sorted = [...d].sort((a, b) => b[1] - a[1]);
  const kept = [];
  let cumulative = 0;
  for (const item of sorted) {
    kept.push(item);
    cumulative += item[1];
    if (cumulative >= p) break;
  }
  const total = kept.reduce((s, x) => s + x[1], 0);
  return kept.map(([t, q]) => [t, +(q / total).toFixed(3)]);
}

console.log("top-k=2  :", JSON.stringify(topK(dist, 2)));
console.log("top-p=0.8:", JSON.stringify(topP(dist, 0.8)));
console.log("top-p=0.95:", JSON.stringify(topP(dist, 0.95)));

// A confident distribution: top-p keeps just one token
const confident = [["Paris", 0.97], ["Lyon", 0.02], ["Rome", 0.01]];
console.log("confident, top-p=0.9:", JSON.stringify(topP(confident, 0.9)));`,
        explanation: "Top-k always keeps k tokens. Top-p adapts to the model's confidence: a confident distribution keeps one token, an uncertain one keeps several. Either way, the long tail of unlikely (often wrong) tokens is cut off.",
      },
      {
        title: "Settings you control on current Claude models (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

# 1) Quick, cheap task: low effort
quick = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    output_config={"effort": "low"},
    messages=[{"role": "user", "content": "Give me a title for a blog post about unit testing."}],
)

# 2) Hard reasoning task: high effort (more internal thinking)
careful = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "Find the bug in this binary search: ..."}],
)

# 3) Stop sequences: cut the output at a delimiter
listing = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    stop_sequences=["END_OF_LIST"],
    messages=[{"role": "user", "content": "List three fruits, one per line, then write END_OF_LIST."}],
)
print(listing.stop_reason)   # "stop_sequence" if the delimiter was produced

for r in (quick, careful, listing):
    print(r.stop_reason, r.usage.output_tokens)`,
        explanation: "On current Claude models you do not set temperature; you control cost and depth with effort, length with max_tokens, and cut-off points with stop_sequences. Compare output token counts between low and high effort.",
      },
    ],
    howItWorks: md(
      "The model's last layer outputs one **logit** (raw score) per vocabulary token. The decoding step then: (1) divides logits by the temperature, (2) applies softmax to get probabilities, (3) optionally removes tokens outside the top-k or top-p set and renormalises, (4) draws one token at random according to the remaining probabilities. Greedy decoding skips the randomness and takes the maximum.",
      "Why not always use greedy? Always picking the top token often produces repetitive, dull or looping text (you saw this in the bigram demo), and it can lock the model into a poor early choice. A little randomness tends to produce more natural text.",
      "Why do some newest models remove temperature? Their training and serving are tuned for a particular decoding setup, and their behaviour is better steered by instructions and an effort control than by low-level randomness knobs. The concepts still matter: they explain why the same prompt can give different answers, and you will see these parameters on many other models and local inference tools.",
      "**Thinking and effort.** Current models can generate internal reasoning before the visible answer. With adaptive thinking, the model decides how much to think; the effort setting biases it toward less (fast, cheap) or more (thorough). Thinking tokens count as output tokens toward `max_tokens` and cost, so give enough headroom when using high effort.",
    ),
    diagram: `logits:  sunny 3.0  cloudy 2.2  rainy 1.8  purple -1.0
             |  divide by temperature T
             v
softmax:  T=0.2 -> sunny .98 ...   (sharp, ~greedy)
          T=1.0 -> sunny .52 ...   (as trained)
          T=2.0 -> sunny .37 ...   (flat, wild)
             |  top-k / top-p: cut the long tail
             v
          random pick -> "sunny"
             |
          append, repeat until end / max_tokens / stop seq`,
    whyItExists: md(
      "A model only gives probabilities; something has to turn them into actual text. Sampling strategies exist to balance quality (pick likely tokens) against diversity (do not always pick the same one). Output settings like max_tokens and stop sequences exist to control cost and shape, and effort exists because different tasks deserve different amounts of reasoning.",
    ),
    whenToUse: md(
      "Use low effort for simple, high-volume tasks (classification, short rewrites, routing) and higher effort for complex reasoning, coding and agentic work. Use stop sequences to end output at a known delimiter. On models that expose temperature, lower it for extraction and factual tasks and raise it for brainstorming; measure the effect on a test set.",
    ),
    whenNotToUse: md(
      "Do not rely on low randomness as a correctness guarantee - a wrong answer can be the most likely one. Do not pass temperature, top_p or top_k to models that do not support them. Do not set max_tokens as a way to request brevity (it truncates mid-sentence); ask for a short answer in the prompt instead.",
    ),
    commonMistakes: [
      "Expecting identical outputs for identical prompts; build validation and tests that tolerate variation.",
      "Using max_tokens to make answers short, producing cut-off text instead of concise text.",
      "Setting max_tokens too low with high effort, so thinking uses the budget and the answer is truncated.",
      "Tuning temperature and top-p at the same time and not knowing which change helped.",
      "Sending sampling parameters a model no longer supports and getting request errors.",
      "Using maximum effort for every trivial request and paying for unnecessary reasoning.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the temperature demo with T = 0.5 and T = 5. Describe how the counts change and what kind of text each would produce." },
      { difficulty: "Easy", prompt: "Explain the difference between top-k and top-p using the 'confident' distribution in the demo." },
      { difficulty: "Medium", prompt: "Combine the demos: write `sampleToken(logits, {temperature, topK, topP}, rand)` that applies temperature, then top-k, then top-p, then samples. Test it with the seeded PRNG." },
      { difficulty: "Medium", prompt: "Call the API with the same prompt at effort low, medium and high on a tricky logic puzzle. Record correctness, output tokens and latency for each." },
      { difficulty: "Hard", prompt: "Build a toy text generator: train a word bigram model on a few paragraphs, then generate 30 words with your `sampleToken` function at several temperatures. Show how repetition and nonsense change with temperature." },
    ],
    interviewQuestions: [
      { question: "What does temperature do?", answer: "It divides the logits before softmax. Below 1 it sharpens the distribution toward the most likely tokens (more deterministic); above 1 it flattens it (more diverse and more error-prone). Near 0 it approaches greedy decoding." },
      { question: "Explain top-p (nucleus) sampling.", answer: "Sort tokens by probability and keep the smallest set whose cumulative probability reaches p, renormalise and sample from that set. It adapts to confidence: few candidates when the model is sure, more when unsure." },
      { question: "Does setting temperature to 0 make outputs fully deterministic and correct?", answer: "No. It makes decoding close to greedy, but outputs can still vary across runs due to infrastructure, and the most likely answer can be wrong. Correctness needs grounding and validation." },
      { question: "How do you control reasoning depth on current Claude models?", answer: "Thinking is adaptive and on by default; you steer it with the effort setting via `output_config={\"effort\": ...}` (low to max). Higher effort spends more tokens on reasoning; make sure max_tokens leaves enough room." },
      { question: "What is a stop sequence used for?", answer: "To end generation as soon as a specific string is produced, for example a delimiter after a list. The response's stop_reason becomes `stop_sequence`." },
      { question: "Why not always use greedy decoding?", answer: "Greedy output tends to be repetitive and can get stuck in loops or a bad early choice. Controlled randomness generally produces more natural and diverse text." },
    ],
    prerequisites: ["how-llms-work", "calling-an-llm-api"],
    relatedTopics: ["tokens-and-context-windows", "hallucinations-and-limitations", "structured-output", "cost-and-latency"],
    keywords: ["sampling", "temperature", "top-p", "nucleus sampling", "top-k", "greedy decoding", "logits", "softmax", "max_tokens", "stop_sequences", "effort", "adaptive thinking", "output_config", "determinism"],
  },

  {
    id: "hallucinations-and-limitations",
    title: "Hallucinations and Limitations",
    level: "beginner",
    description: "Why LLMs produce confident falsehoods, the other built-in limits (cutoff, no memory, arithmetic, bias, injection), and the engineering patterns that reduce the damage.",
    explanation: md(
      "A **hallucination** is output that is fluent and confident but false or unsupported: an invented citation, a non-existent API function, a wrong date, a made-up policy. It is not a bug in one place you can patch; it follows from what an LLM is - a predictor of *plausible* text (see how-llms-work). When the model lacks the information, the plausible continuation of 'The function that does X in library Y is' is still a function name, whether or not it exists.",
      "Hallucinations are most likely when:",
      "- The question is about **rare, niche or private** information (your company's refund policy, a small library, a person who is not famous).\n- The answer needs **recent** information past the model's **training cutoff**.\n- The prompt **presupposes something false** ('Why did the 1990 Moon landing fail?') and the model goes along with it.\n- The task needs **exact details**: quotes, numbers, citations, URLs, identifiers.\n- The model is asked to produce **a lot of specific content** without sources to anchor it.",
      "Other limitations every AI engineer must design around:",
      "- **Knowledge cutoff**: no knowledge of events after training unless you supply it.\n- **No memory between requests**: the API is stateless.\n- **Exact computation**: long arithmetic, counting characters and precise date maths can go wrong; give the model a calculator or code tool.\n- **Context limits**: it can only use what fits in the context window, and attention to details in very long inputs is not perfect.\n- **Non-determinism**: the same prompt can give different answers.\n- **Bias**: models absorb biases present in training data.\n- **Sycophancy**: a tendency to agree with the user, including with wrong claims in the question.\n- **Prompt injection**: text inside documents or web pages can contain instructions that try to hijack the model (see ai-security).\n- **No built-in self-verification**: the model does not automatically check facts against a source.",
      "You cannot make hallucinations impossible, but you can make them **rare, detectable and low-impact**:",
      "- **Ground the model**: put the relevant facts in the prompt (retrieval - see what-is-rag) and instruct it to answer only from them.\n- **Allow 'I don't know'**: give an explicit fallback phrase for missing information.\n- **Ask for evidence**: require quotes or citations from the provided sources, and verify them in code.\n- **Use tools** for facts and calculation: search, databases, calculators, code execution.\n- **Constrain outputs**: structured outputs, allowed values, validation.\n- **Check consistency**: ask several times or ask a second model call to verify claims against sources.\n- **Keep a human in the loop** where mistakes are costly (legal, medical, financial, irreversible actions).\n- **Evaluate**: measure hallucination rates on a test set before and after changes (evaluating-rag).",
    ),
    analogy:
      "An LLM is like a brilliant student taking an oral exam who has read a huge amount but is never allowed to say 'I don't know' unless you explicitly permit it. On topics they studied, they are excellent. On a topic they barely saw, they will still produce a smooth, confident answer, stitched together from things that sound right. Giving them the textbook page (grounding), allowing 'I'm not sure', and asking them to point to the line they are quoting turns a bluffer into a careful researcher.",
    examples: [
      {
        title: "A simple grounding check: are the answer's facts in the source?",
        code: `// Flag numbers and capitalised names in an answer that do not appear in the source.
// Real systems use better checks (quotes, citations, an LLM verifier), but the idea is the same.
const source = "Acme Cloud was founded in 2015 in Lisbon. It has 240 employees and offers refunds within 30 days.";

function claimsNotInSource(answer, source) {
  const numbers = answer.match(/\\d+(\\.\\d+)?/g) || [];
  const names = answer.match(/\\b[A-Z][a-z]+\\b/g) || [];
  const ignore = new Set(["The", "It", "Acme", "Cloud", "Refunds", "They"]);
  const suspicious = [];
  for (const n of numbers) if (!source.includes(n)) suspicious.push(n);
  for (const w of names) if (!ignore.has(w) && !source.includes(w)) suspicious.push(w);
  return suspicious;
}

const answers = [
  "Acme Cloud was founded in 2015 in Lisbon and offers refunds within 30 days.",
  "Acme Cloud was founded in 2012 in Porto by Maria Silva and has 240 employees.",
];
for (const a of answers) {
  const bad = claimsNotInSource(a, source);
  console.log(bad.length ? "UNSUPPORTED " + JSON.stringify(bad) : "OK          ", "|", a);
}`,
        explanation: "The second answer sounds just as confident as the first, but '2012', 'Porto', 'Maria' and 'Silva' appear nowhere in the source. Cheap programmatic checks like this catch a surprising number of hallucinations in grounded systems.",
        walkthrough: [
          { code: "answer.match(/\\d+(\\.\\d+)?/g)", explanation: "Pull out every number the answer claims." },
          { code: "answer.match(/\\b[A-Z][a-z]+\\b/g)", explanation: "Pull out capitalised words as rough 'names'." },
          { code: "if (!source.includes(n)) suspicious.push(n)", explanation: "Anything not present in the source is unsupported and should be flagged, removed or reviewed." },
        ],
      },
      {
        title: "Self-consistency: disagreement is a warning sign",
        code: `function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(3);

// A fake model: well-known fact -> consistent; obscure fact -> it guesses
function fakeModel(question) {
  if (question === "capital of France") return "Paris";
  const guesses = ["1987", "1991", "1989", "1993"];
  return guesses[Math.floor(rand() * guesses.length)];
}

function askNTimes(question, n) {
  const votes = {};
  for (let i = 0; i < n; i++) {
    const a = fakeModel(question);
    votes[a] = (votes[a] || 0) + 1;
  }
  const [best, count] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return { best, agreement: count / n, votes };
}

for (const q of ["capital of France", "founding year of a tiny local bakery"]) {
  const r = askNTimes(q, 7);
  const verdict = r.agreement >= 0.8 ? "confident" : "LOW AGREEMENT - verify or say unsure";
  console.log(q, "->", r.best, "| agreement", r.agreement.toFixed(2), "|", verdict, JSON.stringify(r.votes));
}`,
        explanation: "When the model actually 'knows' something, repeated answers agree. When it is guessing, answers scatter. Sampling several times and checking agreement costs more tokens but is a useful signal for high-stakes questions. It is not proof: a model can be consistently wrong.",
      },
      {
        title: "Grounded answer with an 'I don't know' path and citations (Python)",
        language: "python",
        code: `import anthropic

client = anthropic.Anthropic()

policy = """Refunds are available within 30 days of purchase.
Annual plans are refunded pro rata for unused full months.
Refunds are paid to the original payment method within 5 business days."""

resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system=("Answer questions using only the provided document. "
            "If the document does not contain the answer, say you don't know "
            "and suggest contacting support. Do not use outside knowledge."),
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {"type": "text", "media_type": "text/plain", "data": policy},
                "title": "Refund policy",
                "citations": {"enabled": True},
            },
            {"type": "text", "text": "Can I get a refund to a different card? And how fast?"},
        ],
    }],
)

for block in resp.content:
    if block.type == "text":
        print(block.text)
        for c in (block.citations or []):
            print("   [source:", c.document_title, "]", repr(c.cited_text))`,
        explanation: "The document is supplied, the model is told to answer only from it and how to behave when information is missing, and citations tie each claim to an exact passage you can show to users or verify. The 'different card' part is not covered by the policy, so a good answer says so.",
      },
    ],
    howItWorks: md(
      "During pretraining the model is rewarded for predicting likely text, never for saying 'I don't know'. Instruction tuning and preference training teach models to express uncertainty and decline more often, which reduces hallucinations considerably, but the underlying mechanism still produces the most plausible continuation given what is in the context and the parameters.",
      "Grounding works because it changes *what is plausible*: when the correct facts are in the context window, copying or summarising them becomes by far the most likely continuation. Citations work because each claim must point at a real span of text that your code can check exists. Tools work because the answer comes from a system that actually computes or looks up the fact.",
      "A layered defence looks like this: retrieve sources, prompt with explicit rules and a fallback, generate with citations or structured output, validate in code (formats, allowed values, quotes exist in the source), optionally run a verifier step, and route low-confidence or high-impact cases to a human. Measure each layer's effect with an evaluation set.",
    ),
    diagram: `  question
     |
     v
 retrieve sources ----> none found? --> "I don't know"
     |
     v
 prompt: answer ONLY from <sources>, cite them,
         say "I don't know" if missing
     |
     v
 model answer + citations
     |
     v
 validate: quotes exist? numbers in source?
     |               |
    pass            fail --> retry / flag / human
     |
     v
  show answer with sources`,
    whyItExists: md(
      "These limitations are a direct consequence of how LLMs are built: trained on a fixed snapshot of text to predict likely continuations, run statelessly, and operating on tokens rather than verified facts. Understanding them is what separates a demo from a dependable product - every serious AI system design (RAG, tools, validation, evaluation, human review) exists partly to manage them.",
    ),
    whenToUse: md(
      "Apply these mitigations everywhere output is shown to users or drives actions, and most strictly where errors are costly: customer-facing answers about policies or prices, legal and medical content, code that will run, and agent actions that change data. Add citations whenever users need to trust or verify answers.",
    ),
    whenNotToUse: md(
      "Heavy verification is overkill for low-stakes creative tasks (brainstorming names, drafting a birthday message) where 'plausible' is exactly what you want. And do not use an LLM at all as the source of truth for facts you can look up exactly - query the database instead and let the model phrase the result.",
    ),
    commonMistakes: [
      "Assuming a confident tone means a correct answer.",
      "Asking the model about private or recent information without supplying it in the prompt.",
      "Not giving the model permission or a format for saying 'I don't know'.",
      "Trusting model-generated citations, URLs or references without checking they exist.",
      "Letting the model do exact arithmetic or date calculations instead of using code.",
      "Asking leading questions with false premises and accepting the agreeable answer.",
      "Believing that lowering randomness eliminates hallucinations.",
      "Shipping without an evaluation set, so hallucination rate is unknown.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List five questions that would likely cause a hallucination for a general-purpose model, and explain for each which risk factor applies (niche, recent, false premise, exact detail...)." },
      { difficulty: "Easy", prompt: "Rewrite the prompt 'What is our refund policy?' into a grounded prompt with a document section, an answer-only-from-document rule and an exact fallback phrase." },
      { difficulty: "Medium", prompt: "Extend the grounding-check demo to also flag quoted phrases (text in double quotes) in the answer that do not appear verbatim in the source." },
      { difficulty: "Medium", prompt: "Write a function `verifyQuotes(answerQuotes, sourceText)` that normalises whitespace and case, and returns which quotes are found. Test with exact, slightly reformatted and invented quotes." },
      { difficulty: "Hard", prompt: "Build a small evaluation in Python: 15 questions about a short document (10 answerable, 5 not answerable). Run your grounded prompt, and measure (a) correct answers, (b) correct 'I don't know' responses, (c) hallucinated answers. Iterate on the prompt and report the change." },
    ],
    interviewQuestions: [
      { question: "What is a hallucination and why does it happen?", answer: "Fluent, confident output that is false or unsupported. It happens because LLMs generate the most plausible continuation from learned patterns, with no built-in fact check; gaps in training data, the training cutoff, false premises and requests for exact details make plausible-but-wrong text likely." },
      { question: "How do you reduce hallucinations in a production Q&A system?", answer: "Retrieve relevant sources and put them in the prompt, instruct the model to answer only from them with an explicit 'I don't know' path, require citations and verify them, constrain outputs with schemas, use tools for exact facts and maths, add human review for high-stakes cases, and track hallucination rate with evaluations." },
      { question: "Can you eliminate hallucinations completely?", answer: "No. You can make them rare, detectable and low-impact through grounding, validation and review, and measure them, but any generative model can still produce unsupported output." },
      { question: "Why is an LLM bad at some arithmetic and letter counting?", answer: "It predicts tokens rather than executing algorithms, and it sees sub-word tokens rather than characters. Long exact computations and character-level tasks should be delegated to code or tools." },
      { question: "What is sycophancy?", answer: "The tendency to agree with the user or the premise of a question, even when it is wrong, learned partly from training on human preferences. Mitigate with neutral phrasing, explicit instructions to correct false premises, and grounding." },
      { question: "How do citations help?", answer: "They link each claim to an exact source passage, so users can verify answers and your code can check that cited text really exists in the provided documents, catching unsupported claims." },
    ],
    prerequisites: ["how-llms-work", "prompting-basics"],
    relatedTopics: ["what-is-rag", "grounded-generation-and-citations", "structured-output", "evaluating-rag", "ai-security", "tool-use"],
    keywords: ["hallucination", "confabulation", "grounding", "knowledge cutoff", "training cutoff", "citations", "sycophancy", "bias", "prompt injection", "self-consistency", "verification", "limitations"],
  },

  {
    id: "structured-output",
    title: "Structured Output: JSON, Schemas and Validation",
    level: "beginner",
    description: "Getting machine-readable output from an LLM: JSON, JSON Schema, Pydantic models, the SDK's parse helper, validation and retry.",
    explanation: md(
      "Most LLM output in real applications is read by **code**, not people: a ticket category to route, fields extracted from an invoice, a list of tags to save in a database. Code needs **structured output** - data in a predictable shape - not a friendly paragraph.",
      "The usual format is **JSON** (JavaScript Object Notation): text that represents objects `{\"key\": value}`, arrays `[1, 2, 3]`, strings, numbers, booleans and null. Almost every language can parse it.",
      "A **schema** describes the shape the JSON must have: which fields exist, their types, which are required, allowed values. **JSON Schema** is the standard language for that, and tools like **Pydantic** (Python) or **Zod** (TypeScript) let you define the shape as a class or object and validate data against it.",
      "There are three levels of reliability, from weakest to strongest:",
      "- **Ask nicely**: 'Reply with JSON containing category and urgent.' Usually works, but you may get extra prose, markdown code fences, missing fields, or a different spelling of a value.\n- **Ask with a schema and examples, then validate and retry**: include the schema in the prompt, parse the result, validate it, and on failure send the error back and ask again. Works with any model.\n- **Use the API's structured-output feature**: you pass the schema with the request and the API constrains the model's output to match it, so the response parses and conforms to the schema's structure. With the Anthropic Python SDK, `client.messages.parse(..., output_format=YourPydanticModel)` does this and returns the parsed object in `resp.parsed_output`.",
      "Even with guaranteed structure, **validate the meaning** in code. A schema can guarantee `amount` is a number; it cannot guarantee the number is the right one from the invoice. Business rules (amount > 0, due date after issue date, the category exists in your system) are your code's job.",
      "**Design tips for schemas**: keep them as flat and small as the task allows; use enums (a fixed list of allowed values) for categories; give fields clear names and descriptions; allow `null` for information that may genuinely be missing, so the model does not have to invent a value; and if you want the model to think before filling fields, add a `reasoning` field *before* the answer fields.",
    ),
    analogy:
      "Asking for free-text answers is like asking a colleague to 'tell me about the invoice' over the phone - you get a story you have to interpret. Structured output is handing them a form with labelled boxes: vendor, date, amount, currency. A schema is the form's design; validation is the clerk who checks every box is filled in properly before the form goes into the filing system.",
    examples: [
      {
        title: "Parse, validate and report errors (offline)",
        code: `// A minimal schema validator, enough to show the idea
const schema = {
  category: { type: "string", enum: ["shipping", "billing", "account", "other"] },
  urgent: { type: "boolean" },
  summary: { type: "string", maxLength: 80 },
};

function validate(obj, schema) {
  const errors = [];
  for (const [field, rule] of Object.entries(schema)) {
    const v = obj[field];
    if (v === undefined) { errors.push(field + ": missing"); continue; }
    if (typeof v !== rule.type) errors.push(field + ": expected " + rule.type + ", got " + typeof v);
    if (rule.enum && !rule.enum.includes(v)) errors.push(field + ": must be one of " + rule.enum.join("|"));
    if (rule.maxLength && typeof v === "string" && v.length > rule.maxLength) errors.push(field + ": too long");
  }
  for (const key of Object.keys(obj)) if (!(key in schema)) errors.push(key + ": unexpected field");
  return errors;
}

// Strip a markdown code fence if the model wrapped its JSON in one
const FENCE = String.fromCharCode(96).repeat(3);
function extractJson(text) {
  let t = text.trim();
  if (t.startsWith(FENCE)) t = t.replace(/^\\S*\\s*/, "").replace(new RegExp(FENCE + "\\\\s*$"), "");
  return JSON.parse(t);
}

const modelOutputs = [
  '{"category": "billing", "urgent": true, "summary": "Charged twice"}',
  FENCE + 'json {"category": "billing", "urgent": "yes", "summary": "Charged twice"} ' + FENCE,
  '{"category": "payments", "urgent": false}',
  'Sure! Here is the JSON you asked for: {"category": "other"}',
];

for (const out of modelOutputs) {
  try {
    const obj = extractJson(out);
    const errors = validate(obj, schema);
    console.log(errors.length ? "INVALID: " + errors.join("; ") : "VALID: " + JSON.stringify(obj));
  } catch (e) {
    console.log("NOT JSON:", e.message.slice(0, 60));
  }
}`,
        explanation: "Four realistic outputs from 'just asking for JSON': one good, one wrapped in a code fence with a wrong type, one with an invalid enum value and a missing field, and one with chatty text around it. This is why you validate - or better, use the API's structured-output support.",
        walkthrough: [
          { code: "const schema = { category: { enum: [...] }, ... }", explanation: "The contract: field names, types and allowed values." },
          { code: "function extractJson(text)", explanation: "Defensive parsing: remove code fences, then JSON.parse (which throws on invalid JSON)." },
          { code: "validate(obj, schema)", explanation: "Check every rule and collect readable error messages - these can be sent back to the model in a retry." },
        ],
      },
      {
        title: "Validate-and-retry loop with a fake model",
        code: `// The fake model gets it wrong first, then fixes it when shown the error.
let attempt = 0;
function fakeModel(prompt) {
  attempt++;
  if (attempt === 1) return '{"category": "Billing", "urgent": "true"}';
  return '{"category": "billing", "urgent": true}';
}

function validate(obj) {
  const errors = [];
  if (!["shipping", "billing", "account", "other"].includes(obj.category)) errors.push("category must be one of shipping|billing|account|other");
  if (typeof obj.urgent !== "boolean") errors.push("urgent must be a boolean true/false, not a string");
  return errors;
}

function getStructured(task, maxAttempts = 3) {
  let prompt = task;
  for (let i = 1; i <= maxAttempts; i++) {
    const raw = fakeModel(prompt);
    let errors;
    try { errors = validate(JSON.parse(raw)); } catch (e) { errors = ["invalid JSON: " + e.message]; }
    console.log("attempt", i, raw, errors.length ? "-> " + errors.join("; ") : "-> ok");
    if (errors.length === 0) return JSON.parse(raw);
    prompt = task + " Your previous answer was invalid: " + errors.join("; ") + ". Return corrected JSON only.";
  }
  throw new Error("no valid output after " + maxAttempts + " attempts");
}

console.log("result:", JSON.stringify(getStructured("Classify: 'I was charged twice!'")));`,
        explanation: "Feeding the specific validation error back is much more effective than simply asking again. Always cap the attempts and have a fallback (default value, human review) when the cap is reached.",
      },
      {
        title: "Structured outputs with Pydantic and messages.parse (Python)",
        language: "python",
        code: `from typing import Literal, Optional
import anthropic
from pydantic import BaseModel, Field

class Invoice(BaseModel):
    vendor: str
    invoice_number: str
    total: float = Field(description="Total amount including tax")
    currency: Literal["USD", "EUR", "GBP", "OTHER"]
    due_date: Optional[str] = Field(None, description="ISO date YYYY-MM-DD, or null if not stated")

client = anthropic.Anthropic()

text = """INVOICE #A-1042 from Northwind Supplies
Total due: 1,250.00 EUR (incl. VAT). Payment within 14 days."""

resp = client.messages.parse(
    model="claude-opus-5-5",
    max_tokens=16000,
    messages=[{"role": "user", "content": f"Extract the invoice fields from:\\n<invoice>{text}</invoice>"}],
    output_format=Invoice,
)

inv = resp.parsed_output          # an Invoice instance
print(inv.vendor, inv.invoice_number, inv.total, inv.currency, inv.due_date)

# Structure is guaranteed; business rules are still your job:
if inv.total <= 0:
    raise ValueError("total must be positive")`,
        explanation: "The Pydantic model is converted to a JSON Schema and sent with the request; the output is constrained to it and parsed back into a typed Python object. Note `due_date` is optional: the invoice gives '14 days', not a date, so `None` is the honest answer rather than an invented date.",
      },
      {
        title: "Validate-and-retry with Pydantic (works with any model)",
        language: "python",
        code: `import anthropic
from pydantic import BaseModel, ValidationError

class Ticket(BaseModel):
    category: str
    urgent: bool

client = anthropic.Anthropic()
messages = [{"role": "user", "content":
    'Classify this ticket. Reply with only JSON like {"category": "...", "urgent": true}.\\n'
    "<ticket>Site is down for everyone!</ticket>"}]

ticket = None
for attempt in range(3):
    resp = client.messages.create(model="claude-opus-5-5", max_tokens=16000, messages=messages)
    raw = next(b.text for b in resp.content if b.type == "text")
    try:
        ticket = Ticket.model_validate_json(raw)
        break
    except ValidationError as e:
        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": f"That was invalid: {e}. Reply with corrected JSON only."})

print(ticket)`,
        explanation: "This is the portable pattern: parse, validate, and send the validation error back. Prefer `messages.parse` when available because it removes most failures up front.",
      },
    ],
    howItWorks: md(
      "**Prompt-only JSON** relies on the model following instructions; it is usually right but has no guarantee, so parsing can fail.",
      "**Constrained decoding** (what API structured-output features do under the hood) restricts which tokens the model may choose at each step so the text being generated always stays a valid prefix of something matching the schema. If the schema says the next thing must be `true` or `false`, tokens that would start anything else are excluded. The result always parses and matches the structure.",
      "The SDK's `parse` helper converts your Pydantic class to JSON Schema, sends it with the request, and validates the response back into an instance. Some JSON Schema features may not be supported by the constraint engine (for example certain numeric or string-length constraints); keep schemas simple and enforce extra rules in your own validation.",
      "Validation layers: (1) syntax - is it JSON? (2) structure - required fields and types (schema); (3) semantics - business rules and cross-field checks (your code); (4) truth - does the value match the source (spot checks, evaluation).",
    ),
    diagram: `   input text
       |
       v
 model + schema -----> constrained output
       |                (always parses)
       v
 parse JSON ------ fail --> retry with error
       |
 schema validate - fail --> retry with error
       |
 business rules -- fail --> flag / human
       |
       v
  typed object -> database / API / UI`,
    whyItExists: md(
      "Integrating LLMs into software requires outputs that code can rely on. Free text breaks parsers in production at the worst moments. Schemas, validation and constrained decoding turn an LLM from a text generator into a dependable component: an extractor, classifier or router with a typed interface.",
    ),
    whenToUse: md(
      "Use structured output whenever code consumes the result: classification, extraction from documents, routing decisions, generating records, filling forms, producing tool arguments, scoring in evaluations. Use enums for anything that maps to fixed options in your system.",
    ),
    whenNotToUse: md(
      "Do not force JSON for content meant for humans (an email reply, an explanation) - it adds escaping noise and can lower writing quality. For long prose plus a little metadata, return the prose as a string field or use tags. Do not build huge, deeply nested schemas for a single call; split the task.",
    ),
    commonMistakes: [
      "Calling `JSON.parse`/`json.loads` on raw model text with no error handling.",
      "Not stripping markdown code fences or surrounding prose when using prompt-only JSON.",
      "Making every field required, forcing the model to invent values that are not in the source.",
      "Assuming schema-valid means correct; values can still be wrong.",
      "Using free-text fields where an enum of allowed values belongs.",
      "Retrying without telling the model what was wrong.",
      "Retrying forever instead of capping attempts and falling back.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a JSON Schema (or Pydantic model) for a contact card: name (required), email (required), phone (optional), company (optional)." },
      { difficulty: "Easy", prompt: "Add an `items` array field to the offline validator demo's schema and support validating that it is an array of strings." },
      { difficulty: "Medium", prompt: "Extend `extractJson` to also handle prose before and after the JSON by locating the first '{' and the matching last '}'. Test on the four sample outputs." },
      { difficulty: "Medium", prompt: "Use `messages.parse` to extract a list of action items (owner, task, due date or null) from a meeting transcript. Add business-rule validation that every owner is in a known list of attendees." },
      { difficulty: "Hard", prompt: "Build a batch extractor: given 20 short job postings, extract title, company, salary range (nullable numbers), remote (enum: yes/no/hybrid/unknown). Validate, count failures by field, and write a CSV of the results." },
    ],
    interviewQuestions: [
      { question: "How do you get reliable JSON from an LLM?", answer: "Use the API's structured-output feature with a schema (e.g. `messages.parse` with a Pydantic model), which constrains generation to valid output. Otherwise, include the schema and examples in the prompt, parse and validate, and retry with the error message. Always validate business rules in code." },
      { question: "What is constrained decoding?", answer: "Restricting the tokens the model may choose at each step so the output always remains valid according to a grammar or schema. It guarantees the structure parses, but not that the values are correct." },
      { question: "Why make some schema fields nullable?", answer: "If a field is required but the information is absent from the input, the model is pushed to invent a value. Allowing null lets it report 'not present' honestly." },
      { question: "Why put a reasoning field before the answer fields?", answer: "Output is generated in order, so a reasoning field first lets the model work through the problem before committing to the answer fields, which can improve accuracy." },
      { question: "What validation do you still need with guaranteed schema conformance?", answer: "Semantic checks: value ranges, cross-field consistency, references to real entities, and spot-checking that extracted values actually appear in the source." },
    ],
    prerequisites: ["calling-an-llm-api", "prompting-basics"],
    relatedTopics: ["tool-use", "hallucinations-and-limitations", "document-loading", "evaluating-rag", "ai-security"],
    keywords: ["structured output", "json", "json schema", "pydantic", "messages.parse", "output_format", "parsed_output", "validation", "constrained decoding", "enum", "extraction", "retry"],
  },

  {
    id: "embeddings",
    title: "Embeddings and Vector Similarity",
    level: "beginner",
    description: "Turning text into vectors of numbers that capture meaning, and comparing them with cosine similarity and dot product - the foundation of semantic search and RAG.",
    explanation: md(
      "A **vector** is simply a list of numbers, like `[0.2, -1.3, 0.7]`. You can picture a vector with two numbers as an arrow (or a point) on a flat map, three numbers as a point in 3D space, and a vector with 384 or 1024 numbers as a point in a space with that many **dimensions** - impossible to picture, but the maths is the same.",
      "An **embedding** is a vector produced by a model (an **embedding model**) to represent a piece of text - a word, sentence, paragraph or document - such that **texts with similar meaning get vectors that are close together**. 'How do I reset my password?' and 'I forgot my login credentials' share almost no words, but their embeddings are near each other; 'best pizza in Naples' is far away from both.",
      "This is what makes **semantic search** possible: instead of matching keywords, you embed every document once, embed the user's query, and return the documents whose vectors are closest to the query vector. It is the retrieval step at the heart of RAG.",
      "**Measuring closeness.** The common measures:",
      "- **Dot product**: multiply matching positions and add them up: `a1*b1 + a2*b2 + ...`. Bigger means more similar, but it is also affected by the vectors' lengths.\n- **Cosine similarity**: the dot product divided by both vectors' lengths. It measures the *angle* between vectors and ignores length. It ranges from -1 (opposite) through 0 (unrelated) to 1 (same direction). For text embeddings, values are usually compared relative to each other rather than read as absolute scores.\n- **Euclidean distance**: the straight-line distance between the points. Smaller means more similar.",
      "**Normalization** means scaling a vector so its length is exactly 1 (divide every number by the vector's length). For normalized vectors, cosine similarity and dot product give the *same* number, and ranking by Euclidean distance gives the same order. That is why many systems normalize embeddings once and then use the fast dot product.",
      "**Dimensions** are how many numbers each vector has. More dimensions can capture more nuance but cost more storage and compute. Each embedding model has a fixed output size, and **vectors from different models cannot be compared** - a vector only has meaning relative to other vectors from the same model. If you change embedding models, you must re-embed everything.",
      "**Where embeddings come from.** An embedding model is a neural network (often a transformer, like an LLM but trained differently) trained on pairs of texts that should be close (a question and its answer, a title and its article) and pairs that should be far apart. Training pushes related texts together and unrelated ones apart in the vector space. You do not train one yourself: you use an existing model, either a local open-source one (for example via the `sentence-transformers` library) or a hosted embeddings API from providers such as Voyage AI, OpenAI or Cohere. Anthropic does not offer its own embedding model.",
      "Embeddings capture *meaning* well but are weaker at *exact* matches: product codes, error numbers, rare names. That is why production search often combines embeddings with keyword search (see retrieval-strategies).",
    ),
    analogy:
      "Imagine a huge library where books are not shelved alphabetically but by what they are about: cookbooks in one area, Italian cookbooks in one corner of that area, pasta books right next to each other. An embedding is a book's exact location (its coordinates) in that library. To find books about a question, you work out where the question would be shelved and grab the nearest books. Cosine similarity asks 'are these two books in the same direction from the entrance?' regardless of how far down the aisle each one is.",
    examples: [
      {
        title: "Dot product, length, normalization and cosine similarity",
        code: `const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const length = a => Math.sqrt(dot(a, a));
const normalize = a => a.map(x => x / length(a));
const cosine = (a, b) => dot(a, b) / (length(a) * length(b));

const a = [1, 2, 3];
const b = [2, 4, 6];      // same direction as a, twice as long
const c = [3, -1, 0];     // a different direction

console.log("dot(a,b)    =", dot(a, b));
console.log("cosine(a,b) =", cosine(a, b).toFixed(3), "(same direction -> 1)");
console.log("cosine(a,c) =", cosine(a, c).toFixed(3));

const na = normalize(a), nb = normalize(b);
console.log("normalized a =", na.map(x => x.toFixed(3)).join(", "), "| length", length(na).toFixed(3));
console.log("dot of normalized a,b =", dot(na, nb).toFixed(3), "= cosine");`,
        explanation: "Once vectors are normalized to length 1, the dot product IS the cosine similarity. This is why vector databases often store normalized vectors and use the cheaper dot product.",
        walkthrough: [
          { code: "const dot = (a, b) => ...", explanation: "Multiply matching positions and sum." },
          { code: "const length = a => Math.sqrt(dot(a, a))", explanation: "A vector's length (magnitude) is the square root of its dot product with itself." },
          { code: "const cosine = (a, b) => dot(a, b) / (length(a) * length(b))", explanation: "Dividing by the lengths removes the effect of size, leaving only direction." },
        ],
      },
      {
        title: "Semantic search with hand-made 'meaning' vectors",
        code: `// Pretend embedding model with 4 dimensions we can read:
// [about-accounts, about-money, about-food, about-travel]
// Real models learn hundreds of dimensions that are not human-readable.
const docs = {
  "How to reset your password":            [0.9, 0.1, 0.0, 0.0],
  "Changing the email on your login":      [0.8, 0.0, 0.0, 0.1],
  "Refund and billing questions":          [0.2, 0.9, 0.0, 0.0],
  "Best pasta restaurants near the office": [0.0, 0.1, 0.9, 0.2],
  "Booking flights for business trips":    [0.0, 0.3, 0.1, 0.9],
};
const queries = {
  "I forgot my login credentials": [0.85, 0.05, 0.0, 0.0],
  "Where can I get lunch?":        [0.0, 0.1, 0.95, 0.1],
};

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cosine = (a, b) => dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b));

for (const [q, qv] of Object.entries(queries)) {
  const ranked = Object.entries(docs)
    .map(([title, v]) => [title, cosine(qv, v)])
    .sort((x, y) => y[1] - x[1]);
  console.log("Query:", q);
  for (const [title, score] of ranked.slice(0, 3)) console.log("  " + score.toFixed(3), title);
}`,
        explanation: "'I forgot my login credentials' shares no keywords with 'How to reset your password', yet it ranks first because their vectors point the same way. A real embedding model produces such vectors automatically from the text.",
      },
      {
        title: "Bag-of-words vectors: why learned embeddings are needed",
        code: `// The simplest 'embedding': count words over a fixed vocabulary.
const docs = ["reset your password", "forgot my login credentials", "change your password today"];
const query = "I forgot my password";

const tokenize = s => s.toLowerCase().split(/\\W+/).filter(Boolean);
const vocab = [...new Set([...docs, query].flatMap(tokenize))];
const embed = s => {
  const words = tokenize(s);
  return vocab.map(w => words.filter(x => x === w).length);
};
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cosine = (a, b) => { const d = Math.sqrt(dot(a, a) * dot(b, b)); return d ? dot(a, b) / d : 0; };

console.log("vocabulary (" + vocab.length + " dims):", vocab.join(", "));
const q = embed(query);
for (const d of docs) console.log(cosine(q, embed(d)).toFixed(3), d);
console.log("'login credentials' vs 'password':", cosine(embed("login credentials"), embed("password")).toFixed(3));`,
        explanation: "Word counts only match exact words: 'login credentials' and 'password' score 0 even though they mean nearly the same thing. Learned embeddings fix this by placing synonyms and paraphrases close together. Word-count ideas are still useful, though - BM25 keyword search builds on them (retrieval-strategies).",
      },
      {
        title: "Real embeddings with sentence-transformers (Python)",
        language: "python",
        code: `# pip install sentence-transformers numpy
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")   # small local model, 384-dimensional vectors

docs = [
    "How to reset your password",
    "Refund and billing questions",
    "Best pasta restaurants near the office",
    "Booking flights for business trips",
]
doc_vecs = model.encode(docs, normalize_embeddings=True)       # shape (4, 384)
print("shape:", doc_vecs.shape)

query = "I forgot my login credentials"
q_vec = model.encode([query], normalize_embeddings=True)[0]   # shape (384,)

scores = doc_vecs @ q_vec        # dot product = cosine similarity (vectors are normalized)
for i in np.argsort(-scores):
    print(f"{scores[i]:.3f}  {docs[i]}")`,
        explanation: "Embed documents once (store the vectors), embed each query at search time, and rank by dot product. Exact scores depend on the model; what matters is the ranking. The same pattern scales to millions of documents with a vector database (vector-databases).",
      },
    ],
    howItWorks: md(
      "An embedding model reads the text (as tokens), runs it through its network, and combines the token representations into one fixed-size vector (for example by averaging them). The output is usually a few hundred to a few thousand numbers.",
      "Training uses **contrastive learning**: show the model a text and a related text (a question and its answer), plus unrelated texts. The loss rewards high similarity for related pairs and low similarity for unrelated ones. After training on many such pairs, *meaning* is encoded as *direction* in the vector space.",
      "**Search** with embeddings: (1) split documents into chunks, (2) embed each chunk and store vector + text + metadata, (3) embed the query with the *same* model, (4) find the nearest stored vectors (top-k), (5) return their texts. For small collections you can compare against every vector (exact search); for large ones, vector databases use approximate nearest-neighbour indexes to stay fast.",
      "Some embedding models expect different handling for queries versus documents (for example an instruction prefix or a separate input type). Read the model's documentation and apply it consistently.",
    ),
    diagram: `     meaning space (2 of many dimensions)
   accounts ^
            |  * reset password
            |  * forgot login   <- query lands here
            |
            |               * refunds/billing
            |
            +------------------------------> money
          * pasta places      * flights

 query vector . each doc vector -> scores
 top-k closest -> returned as search results`,
    whyItExists: md(
      "Keyword search fails when users describe things in different words than the documents use. Embeddings give computers a numeric notion of *meaning*, so search, recommendation, clustering, deduplication and classification can work on what text is about rather than the exact words it contains.",
    ),
    whenToUse: md(
      "Use embeddings for semantic search and RAG retrieval, finding similar items (similar tickets, duplicate questions), clustering documents by topic, and as features for lightweight classifiers. Normalize vectors and use dot product or cosine consistently with how your vector store is configured.",
    ),
    whenNotToUse: md(
      "Do not rely on embeddings alone for exact identifiers (SKUs, error codes, names) - combine with keyword search or filters. Do not compare vectors from different embedding models. Do not use embeddings when a structured database query answers the question exactly ('orders over $100 last week').",
    ),
    commonMistakes: [
      "Mixing vectors from two different embedding models (or versions) in the same index.",
      "Forgetting to re-embed all documents after switching embedding models.",
      "Using dot product on un-normalized vectors when cosine similarity was intended.",
      "Treating a similarity score as an absolute probability ('0.8 means 80% relevant') instead of a relative ranking signal.",
      "Embedding whole long documents as one vector, which blurs many topics together; chunk them first.",
      "Expecting embeddings to match exact codes or rare names reliably.",
      "Ignoring a model's query/document conventions (prefixes or input types) where the model requires them.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "By hand, compute the cosine similarity of [1, 0] and [1, 1]. Then check it with the demo code." },
      { difficulty: "Easy", prompt: "Add two documents and one query to the hand-made semantic search demo and predict the ranking before running it." },
      { difficulty: "Medium", prompt: "Write `euclidean(a, b)` and show that for normalized vectors, ranking by smallest Euclidean distance gives the same order as ranking by largest cosine similarity." },
      { difficulty: "Medium", prompt: "Using sentence-transformers, embed 20 FAQ questions and find the closest pair (likely duplicates). Print the top 3 pairs with their scores." },
      { difficulty: "Hard", prompt: "Build a tiny semantic search CLI in Python: load a text file of paragraphs, embed them once and save the vectors with numpy, then answer queries by printing the top-3 paragraphs with scores." },
    ],
    interviewQuestions: [
      { question: "What is an embedding?", answer: "A fixed-length vector produced by a model to represent an input such as text, arranged so that semantically similar inputs have nearby vectors. It enables similarity search over meaning rather than keywords." },
      { question: "Cosine similarity vs dot product - what's the difference?", answer: "Dot product depends on both direction and length; cosine similarity divides by the lengths, so it depends only on direction. For normalized (unit-length) vectors they are identical, which is why systems often normalize and use dot product." },
      { question: "Why can't you compare embeddings from two different models?", answer: "Each model defines its own vector space; the dimensions have no shared meaning across models, and sizes often differ. Similarity is only meaningful between vectors from the same model." },
      { question: "Where do embeddings fall short?", answer: "Exact matching of identifiers, rare names and numbers, negation and fine-grained details. Hybrid search (embeddings plus keyword/BM25) and metadata filters address this." },
      { question: "How are embedding models trained, roughly?", answer: "With contrastive learning on pairs of related texts (and unrelated negatives), so related texts are pulled together and unrelated ones pushed apart in vector space." },
      { question: "What happens to your index if you upgrade the embedding model?", answer: "All stored vectors must be regenerated with the new model, and queries must use the same new model; otherwise similarities are meaningless. Plan re-indexing as a migration." },
    ],
    prerequisites: ["how-llms-work"],
    relatedTopics: ["what-is-rag", "vector-databases", "retrieval-strategies", "chunking", "reranking"],
    keywords: ["embedding", "vector", "dimensions", "cosine similarity", "dot product", "euclidean distance", "normalization", "semantic search", "sentence-transformers", "all-MiniLM-L6-v2", "contrastive learning", "nearest neighbour"],
  },

  {
    id: "what-is-rag",
    title: "What is RAG and Why It Exists",
    level: "beginner",
    description: "Retrieval-Augmented Generation: fetch relevant passages from your own data and give them to the model, so answers are current, private-data-aware and citable - compared with fine-tuning and long context.",
    explanation: md(
      "**Retrieval-Augmented Generation (RAG)** is a pattern for answering questions with an LLM using *your* information. Instead of hoping the model memorised the answer during training, you **retrieve** the most relevant pieces of your documents at question time and **augment** the prompt with them, then the model **generates** an answer based on that material.",
      "It solves the problems from hallucinations-and-limitations directly:",
      "- **Private data**: the model never saw your internal wiki, contracts or support tickets. RAG supplies them.\n- **Freshness**: update a document and the next answer uses it - no retraining.\n- **Grounding**: the model answers from supplied text, which greatly reduces made-up answers.\n- **Citations**: you know which passages were used, so you can show sources and users can verify.\n- **Access control**: you can retrieve only documents the current user is allowed to see.",
      "A RAG system has two phases:",
      "- **Indexing (offline, ahead of time)**: load documents, split them into **chunks** (passages of a few hundred tokens), compute an **embedding** for each chunk, and store chunk text + vector + metadata (source, title, date, permissions) in a **vector store**.\n- **Querying (online, per question)**: embed the question, find the top-k most similar chunks, optionally **rerank** them, put the best ones into a prompt with clear instructions ('answer only from these sources, cite them, say you don't know otherwise'), and call the LLM.",
      "**RAG vs the alternatives:**",
      "- **Fine-tuning** (further training the model on your data) is good at changing *behaviour, style and format*, but it is a poor way to add *facts*: it is slow and costly to update, cannot cite sources, cannot enforce per-user permissions, and the model can still misremember. Use RAG for knowledge, fine-tuning (rarely) for behaviour (see fine-tuning-vs-rag).\n- **Long context** (just paste all the documents into the prompt) is perfectly reasonable when the material is small enough to fit comfortably and does not change much - it is the simplest solution and avoids retrieval errors. Prompt caching can make repeated long prompts cheaper. But it does not scale to large or growing collections, costs more per request, adds latency, and focus can suffer when the relevant part is a tiny fraction of a huge prompt. Many systems combine both: retrieve, then give the model generous context.\n- **Tools / agents**: for structured data (orders, accounts) the model can call an API or database query instead of retrieving text; agentic RAG lets the model decide when and what to search.",
      "RAG quality depends mostly on **retrieval**: if the right chunk is not retrieved, the model cannot use it (and may guess). Most of the RAG section of this subject is about doing retrieval well: loading, chunking, embedding, hybrid search, reranking and evaluation.",
    ),
    analogy:
      "A closed-book exam versus an open-book exam. A plain LLM sits a closed-book exam: it answers from memory and sometimes misremembers. RAG turns it into an open-book exam where a librarian first fetches the three most relevant pages and puts them on the desk, and the rules say 'answer from these pages and write down which page you used'. Fine-tuning is making the student study for weeks - great for learning the exam's style, but slow, and they still might misremember a detail. Long context is dumping the whole library on the desk: fine if it is a small shelf, unworkable if it is a building.",
    examples: [
      {
        title: "A complete RAG loop, offline (toy retrieval + fake LLM)",
        code: `// 1) INDEXING: chunks of our 'knowledge base'
const chunks = [
  { id: "refunds#1", text: "Refunds are available within 30 days of purchase for monthly plans." },
  { id: "refunds#2", text: "Annual plans are refunded pro rata for unused full months." },
  { id: "security#1", text: "Two-factor authentication can be enabled under Settings > Security." },
  { id: "billing#1", text: "Invoices are emailed on the first business day of each month." },
];

// Toy 'embedding': word counts (real systems use an embedding model)
const tokenize = s => s.toLowerCase().split(/\\W+/).filter(w => w.length > 2);
const vocab = [...new Set(chunks.flatMap(c => tokenize(c.text)))];
const embed = s => { const w = tokenize(s); return vocab.map(v => w.filter(x => x === v).length); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cosine = (a, b) => { const d = Math.sqrt(dot(a, a) * dot(b, b)); return d ? dot(a, b) / d : 0; };
const index = chunks.map(c => ({ ...c, vector: embed(c.text) }));

// 2) RETRIEVAL
function retrieve(question, k = 2) {
  const q = embed(question);
  return index
    .map(c => ({ ...c, score: cosine(q, c.vector) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// 3) AUGMENT: build the prompt
function buildPrompt(question, hits) {
  const sources = hits.map(h => "<source id='" + h.id + "'>" + h.text + "</source>").join(" ");
  return "<sources>" + sources + "</sources> Answer only from the sources and cite ids. " +
    "If they don't contain the answer, say you don't know. Question: " + question;
}

// 4) GENERATE: a fake LLM that 'reads' the sources in the prompt
function fakeLLM(prompt) {
  const found = [...prompt.matchAll(/<source id='([^']+)'>([^<]+)<\\/source>/g)];
  if (found.length === 0) return "I don't know - the knowledge base has nothing on that.";
  return found.map(m => m[2] + " [" + m[1] + "]").join(" ");
}

for (const question of ["Can I get refunds on annual plans?", "How do I enable two-factor authentication?", "What is your office address?"]) {
  const hits = retrieve(question);
  console.log("Q:", question);
  console.log("   retrieved:", hits.map(h => h.id + " (" + h.score.toFixed(2) + ")").join(", ") || "nothing");
  console.log("   A:", fakeLLM(buildPrompt(question, hits)));
}`,
        explanation: "Every real RAG system has these four steps. Swap the word-count embedding for a real embedding model, the array for a vector database, and the fake LLM for an API call, and you have a production architecture. Note the third question: nothing relevant is retrieved, so the system says it does not know instead of inventing an address.",
        walkthrough: [
          { code: "const index = chunks.map(c => ({ ...c, vector: embed(c.text) }))", explanation: "Indexing: compute and store a vector for every chunk, once, ahead of time." },
          { code: "function retrieve(question, k = 2)", explanation: "Embed the question and return the k most similar chunks." },
          { code: "function buildPrompt(question, hits)", explanation: "Augment: put the retrieved chunks in tagged sources with instructions to answer only from them and cite ids." },
          { code: "fakeLLM(buildPrompt(question, hits))", explanation: "Generate: the model answers using the sources it was given." },
        ],
      },
      {
        title: "Minimal real RAG in Python (in-memory, sentence-transformers + Claude)",
        language: "python",
        code: `# pip install anthropic sentence-transformers numpy
import numpy as np
import anthropic
from sentence_transformers import SentenceTransformer

chunks = [
    {"id": "refunds#1", "text": "Refunds are available within 30 days of purchase for monthly plans."},
    {"id": "refunds#2", "text": "Annual plans are refunded pro rata for unused full months."},
    {"id": "security#1", "text": "Two-factor authentication can be enabled under Settings > Security."},
    {"id": "billing#1", "text": "Invoices are emailed on the first business day of each month."},
]

# --- Indexing (do once, store the vectors) ---
embedder = SentenceTransformer("all-MiniLM-L6-v2")
vectors = embedder.encode([c["text"] for c in chunks], normalize_embeddings=True)

# --- Retrieval ---
def retrieve(question: str, k: int = 2):
    q = embedder.encode([question], normalize_embeddings=True)[0]
    scores = vectors @ q
    best = np.argsort(-scores)[:k]
    return [chunks[i] for i in best]

# --- Augment + generate ---
client = anthropic.Anthropic()

def answer(question: str) -> str:
    hits = retrieve(question)
    sources = "\\n".join(f'<source id="{h["id"]}">{h["text"]}</source>' for h in hits)
    resp = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=16000,
        system=("Answer using only the sources provided. Cite source ids in square brackets. "
                "If the sources do not contain the answer, say you don't know."),
        messages=[{"role": "user", "content": f"<sources>\\n{sources}\\n</sources>\\n\\nQuestion: {question}"}],
    )
    return next(b.text for b in resp.content if b.type == "text")

print(answer("I'm on the annual plan - can I get money back if I cancel?"))`,
        explanation: "Notice the question shares few words with the right chunk ('money back' vs 'refunded'), which semantic embeddings handle. The rest of the RAG section upgrades each part: a persistent vector database, better chunking, hybrid search, reranking, and citations.",
      },
      {
        title: "Choosing between long context, RAG and fine-tuning",
        language: "text",
        code: `Need                                          -> Start with
--------------------------------------------- -> ---------------------
A few documents that fit easily in context    -> Long context (+ caching)
Large / growing / frequently updated corpus   -> RAG
Answers must cite sources                     -> RAG (or long context + citations)
Different users may see different documents   -> RAG with permission filters
Live structured data (orders, balances)       -> Tools / API calls
Consistent style, tone or output format       -> Prompting first, fine-tuning rarely
Teach the model new facts                     -> RAG, not fine-tuning`,
        explanation: "A quick decision table. In practice, start with the simplest thing that works (often prompting plus long context), and move to RAG as the corpus grows.",
      },
    ],
    howItWorks: md(
      "**Indexing pipeline**: documents -> loaders (extract clean text from PDFs, HTML, etc.) -> chunker (split into passages, often with some overlap) -> embedding model -> vector store (vector + text + metadata). This runs whenever documents change.",
      "**Query pipeline**: question -> (optional) rewrite the question into a better search query -> embed -> similarity search for the top-k chunks (often 20-50 candidates) -> (optional) rerank to the best few -> build a prompt with sources in tags and grounding instructions -> LLM -> answer with citations -> (optional) validate citations.",
      "**Why the pieces matter**: chunk too large and retrieval gets vague and the prompt fills with irrelevant text; too small and chunks lose context. Pure vector search misses exact terms; keyword search misses paraphrases; hybrid search combines both. Rerankers read the question and each candidate together for a more accurate relevance judgement. The prompt's instructions decide whether the model admits ignorance or guesses.",
      "**Evaluating RAG** separates two questions: did retrieval find the right chunks (retrieval metrics like recall@k), and did the model answer faithfully from them (faithfulness, answer relevance)? Debugging always starts by checking which one failed (evaluating-rag).",
    ),
    diagram: `INDEXING (offline)
 docs -> load -> chunk -> embed -> [vector store]
                                    vector+text+meta

QUERYING (per question)
 question -> embed -> search top-k ---^
                         |
                     rerank (optional)
                         v
  prompt = instructions + <sources> + question
                         |
                         v
                   LLM generates
                         v
             answer + citations [id]`,
    whyItExists: md(
      "LLMs know a lot, but not *your* information, not anything after their training cutoff, and not reliably the exact details that matter in business answers. Retraining a model whenever a document changes is impractical. RAG exists because it is the cheapest, most up-to-date and most verifiable way to connect a general model to specific knowledge: update the index, not the model.",
    ),
    whenToUse: md(
      "Use RAG for question answering over documentation, policies, knowledge bases, tickets, contracts, research papers and code - especially when the content is large, changes often, is private, needs per-user permissions, or answers must cite sources.",
    ),
    whenNotToUse: md(
      "If all your material comfortably fits in the context window and rarely changes, skip the retrieval machinery and include it directly (with prompt caching). If the answer lives in structured data, query the database through a tool instead of embedding rows as text. If you need a different style or format, try prompting before anything else. And RAG cannot fix poor source documents - if the docs are wrong or missing, so are the answers.",
    ),
    commonMistakes: [
      "Building a complex RAG pipeline when the documents would simply fit in the prompt.",
      "Thinking fine-tuning is the way to 'teach the model our documents'.",
      "Blaming the LLM for bad answers when retrieval never returned the right chunk.",
      "Not instructing the model to answer only from sources and to say when it doesn't know.",
      "Ignoring metadata such as source, date and permissions, then being unable to cite or filter.",
      "Retrieving too few chunks (missing the answer) or far too many (diluting the prompt).",
      "Never re-indexing, so answers go stale as documents change.",
      "Shipping without a set of test questions to measure retrieval and answer quality.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, describe the indexing phase and the query phase of RAG, and which one runs per question." },
      { difficulty: "Easy", prompt: "Add three chunks to the offline RAG demo (for example about pricing) and ask questions that should retrieve them." },
      { difficulty: "Medium", prompt: "In the offline demo, add a `minScore` threshold to `retrieve` and show a question where a weak, irrelevant match is retrieved without it and correctly rejected with it." },
      { difficulty: "Medium", prompt: "For each scenario, choose long context, RAG, tools or fine-tuning and justify: (a) a 10-page employee handbook, (b) 50,000 support articles updated daily, (c) 'what is my order status?', (d) always replying in the company's formal tone." },
      { difficulty: "Hard", prompt: "Build the Python RAG example over a real folder of Markdown files: split each file into paragraphs, embed and store them (in memory or numpy files), retrieve top-4, and answer with cited file names. Write 10 test questions and record which ones retrieved the right paragraph." },
    ],
    interviewQuestions: [
      { question: "What is RAG?", answer: "Retrieval-Augmented Generation: at question time, retrieve relevant passages from an external knowledge source (usually via embedding similarity), insert them into the prompt, and have the LLM generate an answer grounded in them, ideally with citations." },
      { question: "Why use RAG instead of fine-tuning to add company knowledge?", answer: "RAG updates instantly by re-indexing, supports citations and per-user permissions, and grounds answers in exact text. Fine-tuning is costly to repeat, cannot cite, does not enforce access control, and is better suited to changing behaviour or style than to adding facts." },
      { question: "When is long context better than RAG?", answer: "When the relevant material is small enough to fit comfortably, changes rarely, and is needed as a whole; it avoids retrieval misses and complexity, and prompt caching reduces repeat cost. RAG wins for large, growing, frequently updated or permissioned corpora." },
      { question: "What are the main components of a RAG pipeline?", answer: "Document loading and cleaning, chunking, embedding, a vector store with metadata, retrieval (semantic, keyword or hybrid), optional reranking, prompt construction with grounding instructions, generation, and citation/answer validation, plus evaluation and re-indexing." },
      { question: "A RAG system gives a wrong answer. How do you debug it?", answer: "First check retrieval: were the correct chunks in the retrieved set? If not, look at chunking, embeddings, query phrasing, hybrid search or k. If they were retrieved, check the prompt and the model's faithfulness: instructions, ordering, too much irrelevant context, or missing 'I don't know' guidance." },
      { question: "Does RAG eliminate hallucinations?", answer: "No, but it reduces them substantially. The model can still misread sources, combine them wrongly or fall back on training knowledge, so you still need grounding instructions, citations, validation and evaluation." },
    ],
    prerequisites: ["embeddings", "prompting-basics", "hallucinations-and-limitations"],
    relatedTopics: ["building-a-rag-pipeline", "chunking", "vector-databases", "retrieval-strategies", "fine-tuning-vs-rag", "agentic-rag", "evaluating-rag"],
    keywords: ["rag", "retrieval augmented generation", "retrieval", "grounding", "vector store", "knowledge base", "chunks", "top-k", "fine-tuning", "long context", "citations", "semantic search", "indexing"],
  },
];
