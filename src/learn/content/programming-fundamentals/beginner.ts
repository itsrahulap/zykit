import type { Topic } from "../../types/content";

export const programmingFundamentalsBeginnerTopics: Topic[] = [
  {
    id: "what-is-programming",
    title: "What is Programming?",
    level: "beginner",
    description:
      "Writing precise instructions that a computer can follow to solve a problem.",
    explanation: `
A computer is very fast and very literal. It can't guess what you mean. It
only does exactly what it's told, one small step at a time.

**Programming** is writing those steps down. You break a problem into tiny,
unambiguous instructions ("add these two numbers", "if the list is empty,
stop", "repeat this for every line in the file") in a form the computer can
run.

A few words you'll see everywhere:

- **Algorithm**: a step-by-step method for solving a problem, independent of
  any language. "To find the largest number, look at each one and remember
  the biggest seen so far" is an algorithm.
- **Program**: an algorithm (usually many of them) written in a programming
  language so a computer can actually run it.
- **Programming language**: a strict, small language with exact rules
  (Python, JavaScript, C, Java, Go…). Each one trades off ease of writing,
  speed and safety differently, but they all express the same basic ideas:
  values, variables, decisions, repetition and functions.
- **Source code**: the text of a program as a human writes it.

What a programmer actually does is mostly **not** typing. It's understanding
a problem, deciding what the program should do, splitting the work into
small pieces, writing and reading code, testing it, finding bugs, and
changing code that already exists. Reading code is a bigger part of the job
than writing it.
    `.trim(),
    analogy:
      "Programming is like writing a recipe for someone who has never cooked and takes every word literally. \"Add salt\" isn't enough. You have to say how much, when, and what to do if the salt is missing.",
    examples: [
      {
        title: "An algorithm, then a program",
        language: "python",
        code: `# Algorithm (in plain words):
#   1. Remember the first number as the largest so far.
#   2. Look at each remaining number.
#   3. If it is bigger than the largest so far, remember it instead.
#   4. When there are no numbers left, the remembered one is the answer.

numbers = [4, 17, 9, 23, 8]

largest = numbers[0]
for number in numbers[1:]:
    if number > largest:
        largest = number

print(largest)  # 23`,
        explanation:
          "The comment describes the algorithm in plain words. The code below it is the same idea written precisely enough for Python to run.",
        walkthrough: [
          { code: "numbers = [4, 17, 9, 23, 8]", explanation: "Store a list of numbers under the name `numbers`." },
          { code: "largest = numbers[0]", explanation: "Step 1: start by treating the first number (4) as the largest." },
          { code: "for number in numbers[1:]:", explanation: "Step 2: go through every number after the first, one at a time." },
          { code: "if number > largest:", explanation: "Step 3: compare the current number with the best seen so far." },
          { code: "largest = number", explanation: "If it's bigger, remember it instead." },
          { code: "print(largest)", explanation: "Step 4: show the answer, 23." },
        ],
      },
      {
        title: "The same algorithm in JavaScript",
        language: "javascript",
        code: `const numbers = [4, 17, 9, 23, 8];

let largest = numbers[0];
for (const number of numbers.slice(1)) {
  if (number > largest) {
    largest = number;
  }
}

console.log(largest); // 23`,
        explanation:
          "Different syntax, identical algorithm. Once you understand the idea, switching languages is mostly learning new spelling.",
      },
    ],
    howItWorks: `
Every program, in every language, is built from a handful of ideas:

1. **Values and variables**: data (numbers, text, lists) and names for it.
2. **Operations**: arithmetic, comparisons, joining text.
3. **Decisions**: do this *if* something is true.
4. **Repetition**: do this *for each* item, or *while* something is true.
5. **Functions**: give a group of steps a name so you can reuse it.

Programs take **input** (typed text, a file, a click, a network message),
process it with those building blocks, and produce **output** (text on
screen, a saved file, a web page).

The usual workflow is a loop: understand the problem, write a little code,
run it, check the result, fix what's wrong, repeat.
    `.trim(),
    diagram: `
  Problem ──► Algorithm ──► Program (source code) ──► Run ──► Output
     ▲          (idea)        (in a language)                    │
     └──────────── fix bugs, adjust, improve ◄───────────────────┘
    `.trim(),
    whyItExists: `
Computers can only follow instructions. Without programs they do nothing.
Programming languages exist because the computer's own language (machine
code: raw numbers) is nearly impossible for humans to write and read.
Languages let people express logic in something close to words and math,
and tools translate that into what the machine runs.
    `.trim(),
    whenToUse: `
- Any task you'll repeat many times (renaming 500 files, generating reports).
- Problems too large or fast for a human (searching millions of records).
- Building something people interact with: apps, websites, games, devices.
- Making a process exact and repeatable, so it gives the same result every time.
    `.trim(),
    whenNotToUse: `
- A one-off task that takes two minutes by hand. Writing a program for it can
  take longer than just doing it.
- When an existing tool already does the job (a spreadsheet formula, a
  shell command, an off-the-shelf app).
- When the problem itself isn't understood yet. Talk to people and write the
  steps in plain words first; code comes after.
    `.trim(),
    commonMistakes: [
      "Starting to type code before understanding the problem. Write the steps in plain words first.",
      "Expecting the computer to \"know what you meant\". It does exactly what the code says, including the mistakes.",
      "Trying to learn many languages at once. The core ideas transfer, so learn them well in one language first.",
      "Writing a large program in one go and only then running it. Run small pieces often so bugs are easy to locate.",
      "Treating error messages as failures instead of information. They usually tell you exactly where to look.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write, in plain numbered steps (no code), an algorithm for making a cup of tea. Then find one step a literal-minded robot could misunderstand and rewrite it.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write an algorithm in plain words, then a program in Python or JavaScript, that counts how many numbers in a list are even.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Write an algorithm that checks whether a word is a palindrome (reads the same backwards, like \"level\"). Implement it in two languages and list what changed between them and what stayed the same.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the difference between an algorithm and a program?",
        answer:
          "An algorithm is a language-independent, step-by-step method for solving a problem. A program is a concrete implementation of one or more algorithms in a specific programming language that a computer can run.",
      },
      {
        question: "What properties should a good algorithm have?",
        answer:
          "It should be correct (produces the right answer for every valid input), unambiguous (each step has one meaning), finite (it eventually stops), and reasonably efficient in time and memory.",
      },
      {
        question: "What is source code?",
        answer:
          "The human-readable text of a program, written in a programming language. Tools such as compilers or interpreters turn it into something the machine can execute.",
      },
      {
        question: "Why are there so many programming languages?",
        answer:
          "Each makes different trade-offs: speed versus ease of writing, manual versus automatic memory management, strict versus flexible types, and fit for a domain (C for systems, JavaScript for browsers, Python for scripting and data). No single language is best at everything.",
      },
      {
        question: "What is the difference between a high-level and a low-level language?",
        answer:
          "A high-level language (Python, JavaScript) hides hardware details like memory addresses and registers, so code is shorter and closer to the problem. A low-level language (assembly, and to a degree C) exposes those details, giving more control and speed at the cost of more effort and more ways to make mistakes.",
      },
      {
        question: "What is a bug?",
        answer:
          "A mistake in a program that makes it behave differently from what was intended: a wrong result, a crash, or a hang. The program is doing exactly what the code says; the code just doesn't say what the programmer meant.",
      },
      {
        question: "Name the core building blocks shared by almost every programming language.",
        answer:
          "Values and data types, variables, operators, conditionals, loops, and functions. Most languages also provide collections like lists and maps.",
      },
      {
        question: "What is pseudocode and why is it useful?",
        answer:
          "Informal, language-agnostic notation for describing an algorithm. It lets you reason about logic without fighting syntax, and it's easy to translate into any real language afterwards.",
      },
      {
        question: "Scenario: you're given a vague task, \"make the report faster\". What do you do before writing code?",
        answer:
          "Clarify and measure. Ask what \"faster\" means (how fast, for whom), reproduce the slow case, measure where time is actually spent, then plan a change. Coding before understanding the problem often optimizes the wrong thing.",
      },
    ],
    prerequisites: [],
    relatedTopics: [
      "how-code-runs",
      "variables-and-assignment",
      "control-flow",
      "programming-paradigms",
    ],
    keywords: [
      "algorithm",
      "program",
      "programming language",
      "source code",
      "pseudocode",
      "coding",
      "beginner",
    ],
  },
  {
    id: "how-code-runs",
    title: "How Code Runs",
    level: "beginner",
    description:
      "How source code becomes instructions a CPU executes: compilers, interpreters, bytecode and JIT.",
    explanation: `
A CPU (the computer's processor) only understands **machine code**: long
sequences of numbers, each meaning a tiny operation like "add these two
values" or "jump to that instruction". Nobody wants to write that by hand.

So we write **source code** in a readable language and use a tool to
translate it. There are a few strategies:

- **Compiler**: translates the whole program into machine code *ahead of
  time*, producing an executable file. C, C++, Rust and Go work this way.
  Running the result needs no translator.
- **Interpreter**: reads the program and carries out its instructions
  directly, without producing a standalone machine-code file.
- **Bytecode + virtual machine (VM)**: the source is compiled into a compact,
  portable intermediate form called **bytecode**, which a VM then runs. Java
  (JVM), C# (.NET) and Python (CPython) work this way.
- **JIT (just-in-time) compiler**: a VM watches which code runs often
  ("hot" code) and compiles *that* into machine code while the program is
  running. JavaScript engines like V8 and the Java HotSpot VM do this.

"Compiled language" and "interpreted language" are really descriptions of
**implementations**, not languages. Python is usually compiled to bytecode and
then interpreted; JavaScript is interpreted *and* JIT-compiled.

However the code is translated, it ends up as machine instructions running on
the CPU, reading and writing **memory** (RAM).
    `.trim(),
    analogy:
      "A compiler is a translator who turns a whole book into French before you read it. An interpreter is a live interpreter at a meeting, translating each sentence as it's spoken. A JIT is a live interpreter who notices you keep saying the same phrases and writes those down in French so they can read them out instantly next time.",
    examples: [
      {
        title: "Compiled: C",
        language: "c",
        code: `// hello.c
#include <stdio.h>

int main(void) {
    printf("Hello from machine code!\\n");
    return 0;
}

// In a terminal:
//   gcc hello.c -o hello   (compile once, ahead of time)
//   ./hello                (run the produced executable)`,
        explanation:
          "The compiler (gcc) produces a native executable. You can delete hello.c and ./hello still runs, because it's already machine code.",
        walkthrough: [
          { code: "#include <stdio.h>", explanation: "Pull in declarations for standard input/output functions like `printf`." },
          { code: "int main(void) {", explanation: "Every C program starts running at the function named `main`." },
          { code: "printf(\"Hello...\\n\");", explanation: "Print text; `\\n` is a newline." },
          { code: "return 0;", explanation: "Exit code 0 tells the operating system the program succeeded." },
          { code: "gcc hello.c -o hello", explanation: "Translate the source into a machine-code file named `hello`." },
        ],
      },
      {
        title: "Bytecode: peeking inside Python",
        language: "python",
        code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# Output (exact opcodes vary by Python version), roughly:
#   LOAD_FAST    a
#   LOAD_FAST    b
#   BINARY_OP    +
#   RETURN_VALUE`,
        explanation:
          "CPython compiles your function to bytecode, and the `dis` module shows it. The Python virtual machine then executes these instructions one by one.",
      },
      {
        title: "Interpreted + JIT: JavaScript",
        language: "javascript",
        code: `function square(n) {
  return n * n;
}

let total = 0;
for (let i = 0; i < 1_000_000; i++) {
  total += square(i); // "hot" code: V8 will JIT-compile square()
}
console.log(total);`,
        explanation:
          "V8 starts by interpreting bytecode. After `square` has run many times with numbers, an optimizing compiler turns it into fast machine code specialized for numbers.",
      },
    ],
    howItWorks: `
**The CPU** repeats one cycle billions of times per second:

1. **Fetch** the next instruction from memory (its address is held in a
   register called the *program counter*).
2. **Decode** it: work out what operation it is and which data it needs.
3. **Execute** it: do the arithmetic, compare, read/write memory, or jump to
   a different instruction (that's how \`if\` and loops work underneath).

**Registers** are a few tiny, extremely fast storage slots inside the CPU.
**RAM** holds the program's instructions and data; it's much larger but
slower. **Caches** sit in between to keep recently used data close.

**From source to running program**, a typical toolchain does:

- **Lexing**: split text into tokens (\`total\`, \`=\`, \`0\`).
- **Parsing**: arrange tokens into a tree describing the program's structure.
- **Checking**: catch errors like undefined names (some languages also check types here).
- **Generating code**: emit machine code or bytecode.

The **operating system** loads the executable into memory, gives it a
process, and starts the CPU at its entry point.
    `.trim(),
    diagram: `
                      ┌──────────► machine code ─────────────► CPU   (C, Rust, Go)
                      │  compiler (ahead of time)
  source code ────────┤
                      │  compile          VM interprets
                      └──────────► bytecode ─────┬───────────► CPU   (Python, Java, JS)
                                                 │ JIT: hot code
                                                 └─► machine code ─► CPU

  CPU loop:  fetch ──► decode ──► execute ──► (next instruction) ──► fetch …
    `.trim(),
    whyItExists: `
Humans think in names, expressions and structure; CPUs execute numbered
instructions. Translation bridges the gap. The different strategies exist
because of trade-offs: ahead-of-time compiling gives fast startup and fast
code but slower edit-run cycles and per-platform builds; interpreters and VMs
give portability and quick iteration; JITs try to get the best of both at the
cost of complexity and warm-up time.
    `.trim(),
    whenToUse: `
Knowing how your code runs helps when you:

- Pick a language for a job (a tiny fast CLI vs a quick script).
- Understand error types: compile-time errors are caught before running,
  runtime errors only when that line actually executes.
- Reason about performance: why a hot loop gets faster after warm-up, or why
  startup time differs between languages.
- Ship software: a compiled binary must be built for each OS/CPU; a script
  needs the right interpreter installed.
    `.trim(),
    whenNotToUse: `
Don't let this drive premature decisions. For most beginner and business
programs, the clarity of your code matters far more than whether the
language is compiled or interpreted. Reach for low-level details only when
measurements show they matter.
    `.trim(),
    commonMistakes: [
      "Saying \"Python is interpreted, so it isn't compiled\". CPython compiles source to bytecode first (you can see `.pyc` files in `__pycache__`).",
      "Thinking a language is inherently compiled or interpreted. Those are properties of an implementation; C interpreters and Python compilers both exist.",
      "Assuming code that \"compiled fine\" is correct. Compiling only proves the syntax (and maybe types) are valid; logic errors still show up at runtime.",
      "Expecting a compiled binary to run on any machine. It targets a specific CPU architecture and operating system.",
      "Benchmarking JIT-compiled code without warming up, then concluding the language is slow.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write a Python function, run `dis.dis` on it, and explain in plain words what each bytecode instruction does.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a program with a deliberate error inside a function that is never called. Run it in Python and compile it in C. Explain why one reports the error and the other may not.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Time a loop that calls a small function 10 million times in JavaScript (Node.js). Measure the first 1,000 calls separately from the rest and explain the difference in terms of the JIT.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the difference between a compiler and an interpreter?",
        answer:
          "A compiler translates the whole program into another form (usually machine code) before it runs, producing an artifact you execute later. An interpreter executes the program directly, statement by statement or bytecode by bytecode, without producing a standalone executable.",
      },
      {
        question: "What is bytecode?",
        answer:
          "A compact, low-level instruction set designed for a virtual machine rather than a real CPU. It's portable across hardware: the same Java `.class` file runs on any machine with a JVM.",
      },
      {
        question: "What is a JIT compiler and why use one?",
        answer:
          "A just-in-time compiler turns frequently executed code into machine code while the program runs. It can use runtime information (such as the actual types seen) to optimize, combining an interpreter's flexibility with near-native speed for hot code.",
      },
      {
        question: "Is Python compiled or interpreted?",
        answer:
          "Both, in CPython. Source is compiled to bytecode, which the CPython virtual machine interprets. Other implementations differ; PyPy, for example, adds a JIT.",
      },
      {
        question: "Describe the fetch-decode-execute cycle.",
        answer:
          "The CPU fetches the instruction at the address in the program counter, decodes it to determine the operation and operands, executes it (arithmetic, memory access or a jump), updates the program counter, and repeats.",
      },
      {
        question: "What is the difference between a compile-time error and a runtime error?",
        answer:
          "A compile-time error is detected while translating the code, before it runs (syntax errors, type errors in statically typed languages). A runtime error happens while the program executes, such as dividing by zero or reading a missing file.",
      },
      {
        question: "What are registers, cache and RAM?",
        answer:
          "Registers are a handful of tiny storage slots inside the CPU, the fastest memory. Caches are small, fast memory near the CPU holding recently used data. RAM is the large main memory holding the running program's code and data, much slower than cache.",
      },
      {
        question: "Why does a compiled C program need to be rebuilt for a different platform?",
        answer:
          "Machine code is specific to a CPU architecture (x86-64, ARM64) and the executable format and system calls are specific to an operating system. A binary built for one won't run natively on another.",
      },
      {
        question: "What does \"warm-up\" mean for a JIT-compiled program?",
        answer:
          "The early phase where code runs in a slower interpreter while the VM profiles it. Once code is identified as hot and compiled, it runs much faster. Benchmarks should exclude or account for warm-up.",
      },
      {
        question: "Scenario: a teammate asks why a typo in a rarely used Python branch only crashed in production. What do you explain?",
        answer:
          "Python resolves names when each line executes, so a misspelled variable in a branch that never ran in testing isn't detected until it runs. Tests that exercise every branch, or a linter/type checker, catch these earlier.",
      },
    ],
    prerequisites: ["what-is-programming"],
    relatedTopics: [
      "how-compilers-work",
      "binary-and-number-systems",
      "stack-and-heap",
      "memory-management-and-garbage-collection",
      "event-loop",
    ],
    keywords: [
      "compiler",
      "interpreter",
      "bytecode",
      "virtual machine",
      "jit",
      "machine code",
      "cpu",
      "fetch decode execute",
      "ram",
      "registers",
    ],
  },
  {
    id: "binary-and-number-systems",
    title: "Binary and Number Systems",
    level: "beginner",
    description:
      "Bits, bytes, binary and hexadecimal, converting between bases, and why integers overflow.",
    explanation: `
Inside a computer, everything (numbers, text, images, your code) is stored as
**bits**. A bit is a single 0 or 1.

- A **byte** is 8 bits, so it can hold 2⁸ = 256 different patterns.
- **Binary** (base 2) writes numbers using only 0 and 1.
- **Decimal** (base 10) is the everyday system with digits 0–9.
- **Hexadecimal** (base 16) uses 0–9 and A–F (A=10 … F=15). One hex digit is
  exactly 4 bits, so two hex digits describe one byte. That makes hex a
  compact, human-friendly way to write binary: \`0xFF\` = \`11111111\` = 255.

In every base, a digit's value depends on its **position**. In decimal, 347
means 3×100 + 4×10 + 7×1. In binary, 1011 means 1×8 + 0×4 + 1×2 + 1×1 = 11.

**Why binary?** Electronic circuits are most reliable when they only need to
tell two states apart (voltage high or low, switch on or off). Two states are
easy to build, fast to switch and resistant to noise.

**Integer sizes.** Many languages store integers in a fixed number of bits:
8, 16, 32 or 64. An unsigned 8-bit integer holds 0–255. A signed 8-bit
integer holds −128 to 127. When a result doesn't fit, you get **overflow**.
    `.trim(),
    analogy:
      "Binary is like a row of light switches where each switch is worth double the one to its right: 1, 2, 4, 8, 16… To show a number, you flip on the switches that add up to it. Overflow is a car's odometer rolling from 999999 back to 000000.",
    examples: [
      {
        title: "Converting between bases",
        language: "python",
        code: `n = 202

print(bin(n))   # '0b11001010'
print(hex(n))   # '0xca'
print(oct(n))   # '0o312'

# And back again: int(text, base)
print(int("11001010", 2))  # 202
print(int("ca", 16))       # 202

# Literals in code
print(0b1010, 0xFF)  # 10 255`,
        explanation:
          "Python has built-ins for each direction. The `0b`, `0x` and `0o` prefixes mark binary, hex and octal literals.",
        walkthrough: [
          { code: "bin(n)", explanation: "Returns the binary text for 202: 128+64+8+2 → 11001010." },
          { code: "hex(n)", explanation: "Groups the bits into fours: 1100 = c, 1010 = a → 0xca." },
          { code: "int(\"11001010\", 2)", explanation: "Parses text as base 2 back into the number 202." },
          { code: "0b1010, 0xFF", explanation: "Writes numbers directly in binary or hex in your source code." },
        ],
      },
      {
        title: "Converting by hand (decimal → binary)",
        language: "javascript",
        code: `function toBinary(n) {
  if (n === 0) return "0";
  let bits = "";
  while (n > 0) {
    bits = (n % 2) + bits; // remainder is the next bit (from the right)
    n = Math.floor(n / 2);
  }
  return bits;
}

console.log(toBinary(13));          // "1101"
console.log((13).toString(2));      // "1101"  (built-in)
console.log(parseInt("1101", 2));   // 13`,
        explanation:
          "Repeatedly divide by 2 and collect the remainders; read them in reverse. JavaScript's `toString(base)` and `parseInt(text, base)` do the same thing.",
      },
      {
        title: "Overflow in C",
        language: "c",
        code: `#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint8_t small = 255;
    small = small + 1;          // wraps around
    printf("%u\\n", small);     // 0

    int32_t big = 2147483647;   // largest 32-bit signed int
    // big + 1 here would be undefined behavior in C for signed types!
    printf("%d\\n", big);
    return 0;
}`,
        explanation:
          "Unsigned integers in C wrap around (255 + 1 → 0 for 8 bits). Signed overflow is undefined behavior: the compiler may assume it never happens, so never rely on it.",
      },
    ],
    howItWorks: `
**Place values.** In base b, each position is worth b times the position to
its right:

- Decimal: …, 1000, 100, 10, 1
- Binary: …, 16, 8, 4, 2, 1
- Hex: …, 4096, 256, 16, 1

**Binary → decimal**: add up the place values where the bit is 1.
**Decimal → binary**: divide by 2 repeatedly; the remainders, read bottom-up,
are the bits.
**Binary ↔ hex**: group bits in fours from the right; each group is one hex
digit (1111 = F, 1010 = A).

**Negative numbers** are almost always stored with **two's complement**: to
negate, flip every bit and add 1. In 8 bits, −1 is \`11111111\`. The top bit
acts as the sign, and the same adder circuit works for both signed and
unsigned values.

**n bits** give 2ⁿ patterns: unsigned range 0 to 2ⁿ−1, signed range
−2ⁿ⁻¹ to 2ⁿ⁻¹−1.

**Language differences**: Python \`int\`s grow as needed and never overflow.
JavaScript \`number\` is a 64-bit float, exact for integers only up to
\`Number.MAX_SAFE_INTEGER\` (2⁵³−1); beyond that, use \`BigInt\`. C, Java, Go and
Rust use fixed-size integers.
    `.trim(),
    diagram: `
  Decimal 202 in one byte (8 bits):

  place value:  128  64  32  16   8   4   2   1
  bit:            1   1   0   0   1   0   1   0     = 128+64+8+2 = 202
                 └─── C (12) ───┘ └─── A (10) ──┘     = 0xCA

  8-bit unsigned:  0 ……………………………… 255   then 255 + 1 → 0   (wraps)
  8-bit signed:  −128 ………… 0 ………… 127   (two's complement)
    `.trim(),
    whyItExists: `
Binary exists because hardware is built from two-state switches. Hex exists
because long binary strings are hard for humans to read, and hex maps onto
bits perfectly (4 bits per digit). Fixed-size integers exist because the CPU
has fixed-width registers and arithmetic circuits; fixed sizes make math fast
and memory layout predictable.
    `.trim(),
    whenToUse: `
You'll meet these ideas when:

- Reading colors (\`#FF8800\`), memory addresses, hashes or byte dumps in hex.
- Working with file formats, network protocols or hardware registers.
- Choosing an integer type in C, Java, Go or Rust (or a database column).
- Debugging strange values: a negative number that should be huge, or a
  counter that suddenly resets to 0.
- Using flags and masks with bitwise operations.
    `.trim(),
    whenNotToUse: `
You rarely need to convert bases by hand in day-to-day code; use the
language's built-ins. And don't pick tiny integer types to "save memory"
without a reason: the overflow risk usually outweighs a few bytes saved.
For money, use integers of the smallest unit (cents) or a decimal type, not
floats.
    `.trim(),
    commonMistakes: [
      "Confusing bits and bytes. Network speeds are usually in bits per second (Mbps); file sizes in bytes (MB). 100 Mbps ≈ 12.5 MB/s.",
      "Assuming integers never overflow. In C, Java or a 32-bit database column, a counter can silently wrap or exceed its limit.",
      "Trusting large integers in JavaScript. Above 2⁵³−1, `number` can't represent every integer exactly; IDs from APIs can be silently corrupted. Use `BigInt` or keep them as strings.",
      "Reading a hex string like \"10\" as ten. `0x10` is 16.",
      "Relying on signed integer overflow in C to wrap. It's undefined behavior; use unsigned types or check before adding.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "By hand, convert 45 to binary and hex, then convert 0x3F and 0b10011 to decimal. Check your answers with Python's `bin`, `hex` and `int`.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a function `toBase(n, base)` (bases 2–16) without using built-in conversion, and a matching `fromBase(text, base)`. Test them against the built-ins.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Write a function that, given a bit width (like 8 or 16), returns the signed and unsigned ranges, and another that converts a negative integer into its two's complement bit string for that width.",
      },
    ],
    interviewQuestions: [
      {
        question: "How many values can n bits represent?",
        answer:
          "2ⁿ. One byte (8 bits) gives 256 values: 0–255 unsigned or −128 to 127 signed.",
      },
      {
        question: "Why do computers use binary?",
        answer:
          "Digital circuits reliably distinguish two states (high/low voltage). Two-state components are simple, fast, cheap and tolerant of electrical noise, and Boolean logic maps directly onto them.",
      },
      {
        question: "Why is hexadecimal popular with programmers?",
        answer:
          "Each hex digit is exactly 4 bits, so a byte is always two hex digits. It's far more compact than binary while still mapping cleanly onto the underlying bits.",
      },
      {
        question: "Convert 0b1101 and 0x2A to decimal.",
        answer: "0b1101 = 8 + 4 + 1 = 13. 0x2A = 2×16 + 10 = 42.",
      },
      {
        question: "What is two's complement?",
        answer:
          "The standard way to represent signed integers: a negative number is formed by inverting all bits of its positive value and adding 1. It gives one representation of zero and lets the same adder handle signed and unsigned addition.",
      },
      {
        question: "What is integer overflow?",
        answer:
          "When an arithmetic result is too large (or small) for the integer type storing it. Depending on the language it wraps around, throws, saturates, or (for signed integers in C/C++) is undefined behavior.",
      },
      {
        question: "Does Python have integer overflow?",
        answer:
          "Not for its built-in `int`, which has arbitrary precision and grows to fit any value (limited only by memory). Fixed-size types in libraries like NumPy can still overflow.",
      },
      {
        question: "What is `Number.MAX_SAFE_INTEGER` in JavaScript, and why does it exist?",
        answer:
          "2⁵³ − 1 (9007199254740991). JavaScript numbers are 64-bit floats with 53 bits of precision, so integers above this can't all be represented exactly. `BigInt` handles larger integers.",
      },
      {
        question: "What's the maximum value of a signed 32-bit integer?",
        answer: "2³¹ − 1 = 2,147,483,647. The minimum is −2³¹ = −2,147,483,648.",
      },
      {
        question: "Scenario: a database ID column suddenly rejects inserts after years of use. What's a likely cause?",
        answer:
          "The ID column is a 32-bit integer and the sequence passed 2,147,483,647. The fix is migrating the column to a 64-bit type (BIGINT).",
      },
    ],
    prerequisites: ["how-code-runs"],
    relatedTopics: [
      "bitwise-operations",
      "floating-point-numbers",
      "character-encoding-and-unicode",
      "data-types-and-values",
    ],
    keywords: [
      "binary",
      "hexadecimal",
      "hex",
      "bit",
      "byte",
      "base conversion",
      "two's complement",
      "overflow",
      "integer size",
      "bigint",
    ],
  },
  {
    id: "variables-and-assignment",
    title: "Variables and Assignment",
    level: "beginner",
    description:
      "Giving names to values, changing what a name refers to, and naming things well.",
    explanation: `
A **variable** is a name that refers to a value so you can use it later.
Instead of writing \`19.99\` everywhere, you write \`price\`, and the program
looks up what \`price\` currently refers to.

**Assignment** is how you bind a name to a value. In most languages it's a
single \`=\`:

- \`price = 19.99\` means "make \`price\` refer to 19.99". It's an action, not a
  statement of fact.
- **Reassignment** points the name at a new value: \`price = 24.99\`.

That's why \`=\` is **not** equality. Checking whether two values are equal
uses \`==\` (Python, C) or \`===\` (JavaScript). So \`count = count + 1\` is
perfectly sensible: compute \`count + 1\`, then store the result back in
\`count\`.

A **constant** is a name you don't intend to reassign. JavaScript enforces it
with \`const\`. Python has no enforced constants; by convention, ALL_CAPS
names like \`MAX_RETRIES\` mean "don't change this".

**Naming conventions** make code readable:

- Python: \`snake_case\` for variables and functions, \`UPPER_SNAKE\` for constants.
- JavaScript: \`camelCase\` for variables and functions, \`PascalCase\` for classes.
- Choose names that say what the value *means*: \`total_price\`, not \`tp\` or \`x\`.
    `.trim(),
    analogy:
      "A variable is a name tag, not a box. Assignment sticks the tag on a value. Reassignment peels the tag off and sticks it on a different value; the old value doesn't change, it just loses that tag.",
    examples: [
      {
        title: "Assign, read, reassign",
        language: "python",
        code: `score = 10          # bind the name "score" to 10
print(score)        # 10

score = score + 5   # read score (10), add 5, bind score to 15
print(score)        # 15

score += 1          # shorthand for score = score + 1
print(score)        # 16

print(score == 16)  # True  (comparison, not assignment)`,
        explanation:
          "The right-hand side is always evaluated first, then the result is bound to the name on the left.",
        walkthrough: [
          { code: "score = 10", explanation: "Create the name `score` and point it at the value 10." },
          { code: "score = score + 5", explanation: "Evaluate the right side using the current value (10 + 5 = 15), then point `score` at 15." },
          { code: "score += 1", explanation: "Compound assignment: same as `score = score + 1`." },
          { code: "score == 16", explanation: "`==` asks a question (are these equal?) and produces `True` or `False`. It changes nothing." },
        ],
      },
      {
        title: "let, const, and constants in JavaScript",
        language: "javascript",
        code: `const TAX_RATE = 0.2;     // never reassigned
let subtotal = 50;         // will change
subtotal = subtotal + 25;

const total = subtotal * (1 + TAX_RATE);
console.log(total);        // 90

// TAX_RATE = 0.25;        // TypeError: Assignment to constant variable.

const cart = ["apple"];
cart.push("pear");         // allowed! const stops reassignment, not mutation
console.log(cart);         // ["apple", "pear"]`,
        explanation:
          "Use `const` by default and `let` only when the name must be reassigned. Avoid `var` in modern code. `const` locks the binding, not the contents of an object or array.",
      },
      {
        title: "Swapping and multiple assignment",
        language: "python",
        code: `a, b = 1, 2
a, b = b, a       # swap without a temporary variable
print(a, b)       # 2 1

x = y = 0         # both names refer to 0`,
        explanation:
          "Python evaluates the whole right side before assigning, which makes swapping one line. JavaScript can do the same with `[a, b] = [b, a];`.",
      },
    ],
    howItWorks: `
When the program runs \`price = 19.99\`:

1. The right side is **evaluated**, producing a value somewhere in memory.
2. The name \`price\` is recorded in the current **scope** (a table of names
   visible at this point in the code) as referring to that value.

Reading \`price\` later looks the name up and returns its current value.
Reading a name that was never assigned raises an error: \`NameError\` in
Python, \`ReferenceError\` in JavaScript.

In **dynamically typed** languages (Python, JavaScript) a name can refer to
a value of any type, and reassignment can switch types. In **statically
typed** languages (C, Java), a variable is declared with a type and is tied
to a fixed-size memory slot of that type:

\`int count = 3;\` reserves space for an int named \`count\`.
    `.trim(),
    diagram: `
  score = 10           score = score + 5

  score ──► 10         score ──┐   10   (no name points here now)
                               └─► 15

  "=" means "make the name on the left refer to the value on the right"
  "==" asks "are these two values equal?"
    `.trim(),
    whyItExists: `
Programs need to remember things between steps: a running total, the
current user, a setting. Names make code readable (\`tax_rate\` explains
itself; \`0.2\` doesn't) and let you change a value in one place instead of
everywhere it's used.
    `.trim(),
    whenToUse: `
- To store results you'll use again, instead of recomputing them.
- To give a meaningful name to a "magic number" (\`SECONDS_PER_DAY = 86400\`).
- To break a long expression into named steps that read like an explanation.
- To track state that changes, like a counter in a loop.
    `.trim(),
    whenNotToUse: `
- Don't create a variable for a value used once when the expression is
  already clear.
- Avoid reusing one name for unrelated things (\`data\` that's first a string,
  then a list, then a count); make new, well-named variables instead.
- Avoid global variables shared across a whole program; pass values to
  functions instead.
    `.trim(),
    commonMistakes: [
      "Writing `if x = 5` when you mean `if x == 5`. Python rejects it as a syntax error; in C and JavaScript it assigns 5 and is always true.",
      "Using a variable before assigning it, or misspelling its name, which creates a `NameError`/`ReferenceError` (or, in sloppy-mode JavaScript, silently creates a new global).",
      "Thinking `const` makes an object or array immutable in JavaScript. It only prevents reassignment of the name.",
      "Vague names like `data`, `temp`, `x2` or single letters outside tiny loops.",
      "Expecting `b = a` to copy a list. Both names now refer to the same list, so changing it through one name is visible through the other.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Create variables for a product's name, price and quantity, compute the total cost into a new variable, and print a sentence that uses all of them.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Predict, then check, the final values: `a = 3; b = a; a = a * 2; b = b + a`. Draw the names-to-values diagram after each line.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Take a short program full of single-letter names and magic numbers (write one with at least five) and refactor it with descriptive names and named constants. Explain each choice.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between `=` and `==`?",
        answer:
          "`=` is assignment: it binds a name to a value. `==` is a comparison that evaluates to true or false. JavaScript also has `===`, which compares without type conversion and is preferred.",
      },
      {
        question: "What's the difference between `let`, `const` and `var` in JavaScript?",
        answer:
          "`const` and `let` are block-scoped; `const` can't be reassigned, `let` can. `var` is function-scoped and hoisted with an initial value of `undefined`, which causes subtle bugs, so modern code avoids it.",
      },
      {
        question: "Does Python have constants?",
        answer:
          "Not enforced ones. By convention, module-level `UPPER_SNAKE_CASE` names are treated as constants. Type checkers can enforce it with `typing.Final`.",
      },
      {
        question: "What does `x = x + 1` mean, given that it's false as math?",
        answer:
          "It's an instruction, not an equation: evaluate `x + 1` using the current value of `x`, then rebind `x` to the result.",
      },
      {
        question: "Output-prediction (Python): `a = [1, 2]; b = a; b.append(3); print(a)`?",
        answer:
          "`[1, 2, 3]`. `b = a` makes both names refer to the same list; it doesn't copy it. Use `a.copy()` or `list(a)` for a copy.",
      },
      {
        question: "Is a variable a box that holds a value?",
        answer:
          "In Python and JavaScript, it's closer to a label that refers to a value; several names can refer to the same object. In C, a variable really is a named, typed region of memory that holds the value directly.",
      },
      {
        question: "What makes a good variable name?",
        answer:
          "It describes what the value means, not its type or how it's computed, is as short as clarity allows, follows the language's convention, and uses units or plurals when helpful (`timeout_seconds`, `users`).",
      },
      {
        question: "What happens if you read a variable that was never assigned?",
        answer:
          "Python raises `NameError`; JavaScript raises `ReferenceError` (and reading a `let`/`const` before its declaration line also throws, due to the temporal dead zone). In C, a declared but uninitialized local holds an indeterminate value, and reading it is undefined behavior.",
      },
      {
        question: "How do you swap two variables?",
        answer:
          "With a temporary variable in any language, or with tuple/destructuring assignment: `a, b = b, a` in Python, `[a, b] = [b, a]` in JavaScript.",
      },
    ],
    prerequisites: ["what-is-programming"],
    relatedTopics: [
      "data-types-and-values",
      "scope-and-lifetime",
      "value-vs-reference",
      "mutability-and-immutability",
      "clean-code-and-refactoring",
    ],
    keywords: [
      "variable",
      "assignment",
      "constant",
      "const",
      "let",
      "naming conventions",
      "snake_case",
      "camelCase",
      "reassignment",
    ],
  },
  {
    id: "data-types-and-values",
    title: "Data Types and Values",
    level: "beginner",
    description:
      "Numbers, text, booleans, null and collections, and how languages convert between them.",
    explanation: `
Every value has a **type** that decides what it is and what you can do with
it. You can multiply two numbers, but multiplying two names makes no sense.

The common building blocks, in nearly every language:

- **Integers**: whole numbers (\`42\`, \`-7\`).
- **Floating-point numbers**: numbers with a fractional part (\`3.14\`). They're
  approximations, so \`0.1 + 0.2\` is not exactly \`0.3\`.
- **Booleans**: \`true\`/\`false\` (\`True\`/\`False\` in Python). Results of comparisons.
- **Strings**: text (\`"hello"\`), a sequence of characters.
- **"Nothing"**: \`None\` in Python; \`null\` and \`undefined\` in JavaScript. Means
  "no value here".
- **Collections**: lists/arrays, dictionaries/objects/maps, sets, which group
  many values together.

Language differences worth knowing:

- Python has separate \`int\` and \`float\`. JavaScript has one \`number\` type
  (a 64-bit float) plus \`bigint\` for huge integers.
- Changing a value from one type to another is **type conversion**. Doing it
  explicitly (\`int("42")\`) is **casting**. Doing it automatically is
  **coercion**. JavaScript coerces a lot (\`"5" * 2\` is \`10\`); Python mostly
  refuses (\`"5" + 1\` is a \`TypeError\`).
    `.trim(),
    analogy:
      "Types are like containers in a kitchen: a measuring jug for liquids, a carton for eggs, a jar for spices. You can pour from one to another, but you need to know what's inside, and pouring eggs into the jug doesn't go well.",
    examples: [
      {
        title: "Checking types",
        language: "python",
        code: `print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type(True))      # <class 'bool'>
print(type("hi"))      # <class 'str'>
print(type(None))      # <class 'NoneType'>
print(type([1, 2]))    # <class 'list'>
print(type({"a": 1}))  # <class 'dict'>

print(7 / 2)   # 3.5  (true division always gives a float)
print(7 // 2)  # 3    (floor division)`,
        explanation:
          "`type()` reveals a value's type. Note that `/` always produces a float in Python 3.",
        walkthrough: [
          { code: "type(42)", explanation: "A whole number is an `int`." },
          { code: "type(3.14)", explanation: "A number with a decimal point is a `float`." },
          { code: "type(None)", explanation: "`None` is Python's single \"no value\" object." },
          { code: "7 / 2", explanation: "Regular division returns a float, 3.5." },
          { code: "7 // 2", explanation: "Floor division drops the fractional part, giving 3." },
        ],
      },
      {
        title: "Checking types in JavaScript",
        language: "javascript",
        code: `console.log(typeof 42);         // "number"
console.log(typeof 3.14);       // "number"  (same type!)
console.log(typeof 10n);        // "bigint"
console.log(typeof true);       // "boolean"
console.log(typeof "hi");       // "string"
console.log(typeof undefined);  // "undefined"
console.log(typeof null);       // "object"  (historic bug, kept forever)
console.log(Array.isArray([1, 2])); // true  (typeof [] is "object")`,
        explanation:
          "`typeof` works for most primitives, but `null` and arrays report \"object\". Use `value === null` and `Array.isArray(value)` to check them.",
      },
      {
        title: "Conversion vs coercion",
        language: "javascript",
        code: `// Explicit conversion: you ask for it
Number("42");      // 42
String(42);        // "42"
Number("abc");     // NaN  ("Not a Number")
parseInt("42px");  // 42  (stops at the first non-digit)

// Implicit coercion: the language does it for you
"5" + 1;    // "51"  (+ with a string concatenates)
"5" - 1;    // 4     (- only works on numbers)
1 == "1";   // true  (loose equality coerces)
1 === "1";  // false (strict equality does not)

// Python, for comparison:
//   int("42")   -> 42
//   "5" + 1     -> TypeError: can only concatenate str (not "int") to str
//   str(5) + "1" -> "51"`,
        explanation:
          "Prefer explicit conversion. Implicit coercion makes code shorter but hides bugs, which is why JavaScript developers use `===`.",
      },
    ],
    howItWorks: `
Under the hood, every value is bits in memory. The **type** tells the
program how to interpret those bits and which operations are allowed. The
same 32 bits could be an integer, a float or four characters.

**Primitive vs compound**: numbers, booleans and (in most languages)
strings are simple values. Collections and objects hold or point to other
values.

**Static vs dynamic typing**: in C or Java, variables have declared types
checked before the program runs. In Python and JavaScript, *values* carry
their types and checks happen at runtime.

**Strong vs weak typing** (informal terms): Python is fairly strict about
mixing types and raises errors. JavaScript is weakly typed: many operators
coerce operands, following fixed rules (for example, \`+\` concatenates if
either side is a string; \`-\`, \`*\` and \`/\` convert to numbers).

**Strings are immutable** in both Python and JavaScript: "changing" a string
creates a new one.
    `.trim(),
    diagram: `
  Common types
  ├── Numbers ........ int / float (Python)   number / bigint (JS)
  ├── Boolean ........ True / False           true / false
  ├── Text ........... str                    string
  ├── Nothing ........ None                   null, undefined
  └── Collections .... list, tuple,           Array, Object,
                       dict, set              Map, Set
    `.trim(),
    whyItExists: `
Types let the computer store values efficiently and apply the right
operations: adding two numbers is different hardware work from joining two
strings. They also catch mistakes. An error like "can't add a string to an
int" points at a bug before it silently corrupts data.
    `.trim(),
    whenToUse: `
Think about types whenever data crosses a boundary:

- **Input** is almost always text (form fields, command-line args, files,
  query strings). Convert it to the type you need right away and validate it.
- **Output** often needs text: format numbers and dates for display.
- **Calculations** need numbers; make sure you're not adding strings.
- Choose a collection type based on how you'll use the data.
    `.trim(),
    whenNotToUse: `
Don't lean on implicit coercion to save a few characters (\`+"42"\`,
\`if (x == null)\` tricks) in code others must read; write the explicit
conversion. Don't use floats for money or anything that needs exact decimals;
use integer cents or a decimal type.
    `.trim(),
    commonMistakes: [
      "Forgetting that input is text: `input()` in Python and form values in JavaScript return strings, so `\"2\" + \"3\"` gives `\"23\"`.",
      "Expecting exact decimal math from floats: `0.1 + 0.2 === 0.3` is `false`.",
      "Checking for NaN with `x === NaN`, which is always false. Use `Number.isNaN(x)`.",
      "Using `typeof x === \"object\"` to detect objects in JavaScript; it's also true for `null` and arrays.",
      "Using `==` in JavaScript and getting surprised by coercion (`0 == \"\"` is `true`). Use `===`.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Ask the user for two numbers (with `input()` in Python or `prompt()` in a browser), convert them properly, and print their sum. Then remove the conversion and observe what happens.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write `describe(value)` in Python and in JavaScript that returns a string naming the value's type, correctly distinguishing integers, floats, booleans, strings, None/null, lists/arrays and dictionaries/objects.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Write `parseAge(text)` that returns an integer age or raises a clear error for empty strings, non-numbers, decimals like \"12.5\", negatives and absurd values like 500. Write tests for each case.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between type conversion and type coercion?",
        answer:
          "Conversion (casting) is explicit: the programmer calls `int(\"5\")` or `Number(\"5\")`. Coercion is implicit: the language converts automatically, as in `\"5\" * 2` → `10` in JavaScript.",
      },
      {
        question: "Why does `0.1 + 0.2` not equal `0.3`?",
        answer:
          "Floats are stored in binary, and 0.1 and 0.2 have no exact binary representation, much like 1/3 in decimal. The tiny rounding errors add up to 0.30000000000000004. Compare with a tolerance or use a decimal type when exactness matters.",
      },
      {
        question: "What's the difference between `null` and `undefined` in JavaScript?",
        answer:
          "`undefined` means a value was never assigned (missing variables, properties, arguments or return values). `null` is an explicit \"no value\" that a programmer sets on purpose.",
      },
      {
        question: "Why does `typeof null` return `\"object\"`?",
        answer:
          "It's a bug from JavaScript's first implementation, where `null` used the same type tag as objects. Fixing it would break existing websites, so it stays. Check with `value === null` instead.",
      },
      {
        question: "Output-prediction (JavaScript): `\"3\" + 4 + 5` and `3 + 4 + \"5\"`?",
        answer:
          "`\"345\"` and `\"75\"`. Evaluation is left to right: once a string is involved, `+` concatenates; before that, `3 + 4` is numeric addition.",
      },
      {
        question: "What happens with `\"5\" + 1` in Python?",
        answer:
          "`TypeError: can only concatenate str (not \"int\") to str`. Python doesn't coerce between strings and numbers; you must convert explicitly with `int()` or `str()`.",
      },
      {
        question: "What is NaN, and how do you test for it?",
        answer:
          "\"Not a Number\", a special float value from invalid math like `0/0` or `Number(\"abc\")`. NaN isn't equal to anything, including itself, so use `Number.isNaN(x)` in JavaScript or `math.isnan(x)` in Python.",
      },
      {
        question: "What's the difference between static and dynamic typing?",
        answer:
          "Static typing checks types before running (C, Java, TypeScript), attaching them to variables. Dynamic typing checks at runtime (Python, JavaScript), attaching types to values, so one name can hold different types over time.",
      },
      {
        question: "What's the difference between a primitive and a compound (reference) type?",
        answer:
          "A primitive is a single simple value like a number or boolean. A compound type (list, object, dict) groups other values. In Python and JavaScript, compound values are mutable objects accessed by reference, so two names can share one.",
      },
      {
        question: "Scenario: an API returns a 19-digit order ID and your JavaScript code shows a slightly different number. Why?",
        answer:
          "`JSON.parse` turns it into a `number`, which is exact only up to 2⁵³−1 (about 16 digits), so it's rounded. Have the API send IDs as strings, or parse with a BigInt-aware parser.",
      },
    ],
    prerequisites: ["variables-and-assignment", "binary-and-number-systems"],
    relatedTopics: [
      "type-systems",
      "floating-point-numbers",
      "character-encoding-and-unicode",
      "basic-data-structures",
      "value-vs-reference",
    ],
    keywords: [
      "data types",
      "int",
      "float",
      "boolean",
      "string",
      "null",
      "None",
      "undefined",
      "type conversion",
      "coercion",
      "casting",
      "NaN",
      "typeof",
    ],
  },
  {
    id: "control-flow",
    title: "Control Flow",
    level: "beginner",
    description:
      "Making decisions with if/else and repeating work with for and while loops.",
    explanation: `
By default, a program runs top to bottom, one line after another. **Control
flow** is how you change that order.

**Conditionals** choose between paths:

- \`if\` runs a block only when a condition is true.
- \`else\` runs when it's false.
- \`elif\` (Python) / \`else if\` (JavaScript) checks further conditions in order.
  Only the **first** matching branch runs.

**Loops** repeat a block:

- A **for** loop runs once per item in a sequence (each item in a list, each
  number in a range).
- A **while** loop runs as long as a condition stays true. Use it when you
  don't know in advance how many times to repeat.
- \`break\` exits the loop immediately. \`continue\` skips to the next iteration.

**Nesting**: you can put conditionals inside loops, loops inside loops, and so
on. Each level adds complexity, so keep nesting shallow.

**Truthiness**: conditions don't have to be literal booleans. Every value is
treated as "truthy" or "falsy". Empty and zero-like values are falsy.
    `.trim(),
    analogy:
      "Control flow is like directions for a walk: \"If the bridge is closed, take the ferry, otherwise cross\" is a conditional. \"Walk until you see the church\" is a while loop. \"Knock on each door on this street\" is a for loop.",
    examples: [
      {
        title: "if / elif / else",
        language: "python",
        code: `temperature = 18

if temperature >= 25:
    print("Hot")
elif temperature >= 15:
    print("Mild")      # this one runs
else:
    print("Cold")`,
        explanation:
          "Python checks conditions from top to bottom and runs only the first true branch. Indentation defines which lines belong to each branch.",
        walkthrough: [
          { code: "temperature = 18", explanation: "Store the value we'll make decisions about." },
          { code: "if temperature >= 25:", explanation: "Is 18 at least 25? No, so skip this block." },
          { code: "elif temperature >= 15:", explanation: "Is 18 at least 15? Yes, so run this block." },
          { code: "print(\"Mild\")", explanation: "Prints \"Mild\". The remaining branches are skipped entirely." },
          { code: "else:", explanation: "Would run only if every condition above was false." },
        ],
      },
      {
        title: "for, while, break and continue",
        language: "javascript",
        code: `// for: once per item
const scores = [72, 45, 90, 38];
for (const score of scores) {
  if (score < 50) continue;   // skip failing scores
  console.log("Pass:", score); // 72, 90
}

// classic counting for loop
for (let i = 0; i < 3; i++) {
  console.log(i);             // 0, 1, 2
}

// while: until a condition changes
let attempts = 0;
while (true) {
  attempts++;
  if (Math.random() < 0.3) break; // stop when we "succeed"
}
console.log("Took", attempts, "attempts");`,
        explanation:
          "`for...of` walks through values; the counting loop is useful when you need the index. `while (true)` with `break` is a common pattern for \"repeat until\".",
      },
      {
        title: "Truthiness differs between languages",
        language: "python",
        code: `# Python falsy values: False, None, 0, 0.0, "", [], {}, set(), ()
items = []
if not items:
    print("Nothing to do")   # runs: empty list is falsy

name = ""
print(name or "Anonymous")  # "Anonymous"

# JavaScript falsy values: false, 0, -0, 0n, "", null, undefined, NaN
# Careful: in JavaScript, [] and {} are TRUTHY.
#   if ([]) { console.log("runs!"); }`,
        explanation:
          "Empty collections are falsy in Python but truthy in JavaScript. In JavaScript, check `items.length === 0` instead.",
      },
    ],
    howItWorks: `
At the machine level, the CPU normally executes the next instruction in
memory. Conditionals and loops compile to **comparisons** and **jumps**:
"compare these values; if the result is X, jump to that instruction instead
of the next one."

- An \`if\` becomes: evaluate the condition; if false, jump past the block.
- A loop becomes: run the block, then jump back to the condition check.

**Short-circuit evaluation**: \`and\`/\`&&\` stops at the first falsy operand;
\`or\`/\`||\` stops at the first truthy one. So \`user and user.name\` never
touches \`user.name\` when \`user\` is \`None\`. These operators return one of the
operands, not necessarily a boolean.

**Loop shapes**:

- \`range(1, 5)\` in Python produces 1, 2, 3, 4: the end is **excluded**.
- A while loop must change something its condition depends on, or it runs
  forever.
    `.trim(),
    diagram: `
     if / else                           while loop

    ┌───────────┐                    ┌───────────┐
    │ condition │                ┌──►│ condition │── false ──► after loop
    └─────┬─────┘                │   └─────┬─────┘
     true │   false              │         │ true
     ▼         ▼                 │         ▼
  [then]    [else]               │     [loop body]
     └────┬────┘                 └─────────┘
          ▼
     next statement
    `.trim(),
    whyItExists: `
Without decisions, a program would do the same thing regardless of input.
Without repetition, you'd have to copy a line of code once for every item
you want to process. Conditionals and loops are what let a short program
handle any amount and any kind of input.
    `.trim(),
    whenToUse: `
- **if/else**: input validation, handling special cases, choosing behavior.
- **for**: processing every item in a collection or a known range.
- **while**: reading until end of input, retrying until success, game loops,
  or anything where the number of repetitions isn't known up front.
- **break**: stop early once you've found what you need.
- **continue**: skip items that don't apply without deep nesting.
    `.trim(),
    whenNotToUse: `
- Avoid long \`if/elif\` chains that map a value to a result; a dictionary
  lookup is often clearer.
- Avoid deep nesting; use early returns (guard clauses) instead.
- For simple transformations of a collection, built-ins like Python
  comprehensions or JavaScript's \`map\`/\`filter\` can be clearer than a
  hand-written loop.
- Avoid \`while\` when a \`for\` over a sequence expresses the same thing; it
  removes the risk of forgetting to update the counter.
    `.trim(),
    commonMistakes: [
      "Off-by-one errors: looping one time too many or too few (`<=` instead of `<`, or forgetting that `range(1, 10)` stops at 9).",
      "Infinite while loops because nothing inside the loop changes the condition.",
      "Assuming empty arrays and objects are falsy in JavaScript; `if ([])` is true.",
      "Ordering conditions wrongly, so a broad check (`score >= 50`) runs before a narrower one (`score >= 90`) and hides it.",
      "Modifying a list while looping over it, which can skip items. Loop over a copy or build a new list.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Print the numbers 1 to 30, but print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a number-guessing game: pick a secret number from 1–100 and loop, telling the player \"higher\" or \"lower\" until they guess it. Print the number of guesses.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Print every prime number below 200 using nested loops, then make it faster by stopping each inner check at the square root and breaking early. Count how many inner-loop iterations each version runs.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between `break` and `continue`?",
        answer:
          "`break` exits the loop entirely. `continue` skips the rest of the current iteration and moves to the next one.",
      },
      {
        question: "When would you use a while loop instead of a for loop?",
        answer:
          "When the number of iterations isn't known in advance and depends on a condition, such as reading input until it's empty or retrying until success. Use for loops to iterate over a known sequence.",
      },
      {
        question: "What values are falsy in JavaScript?",
        answer:
          "`false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined` and `NaN`. Everything else, including `[]`, `{}` and `\"0\"`, is truthy.",
      },
      {
        question: "What values are falsy in Python?",
        answer:
          "`False`, `None`, numeric zero (`0`, `0.0`, `0j`), and empty collections/strings (`\"\"`, `[]`, `()`, `{}`, `set()`, `range(0)`). Objects can define `__bool__` or `__len__` to control their truthiness.",
      },
      {
        question: "What is short-circuit evaluation?",
        answer:
          "Logical operators stop evaluating as soon as the result is known: `a and b` skips `b` if `a` is falsy; `a or b` skips `b` if `a` is truthy. It's used for safe access (`user and user.name`) and defaults (`name or \"Anonymous\"`).",
      },
      {
        question: "What is an off-by-one error?",
        answer:
          "A loop or index that's one too high or too low, usually from mixing up inclusive and exclusive bounds or starting at 1 instead of 0. Example: `for i in range(len(xs) + 1)` reads past the end.",
      },
      {
        question: "What is a guard clause?",
        answer:
          "An early `return` (or `continue`) that handles an invalid or special case at the top, so the main logic isn't nested inside an `if`. It flattens code and makes the happy path easier to read.",
      },
      {
        question: "Output-prediction (Python): `for i in range(3): pass` then `print(i)`?",
        answer:
          "`2`. A Python loop variable is still bound after the loop, holding its last value. In JavaScript, a `let` loop variable isn't visible after the loop.",
      },
      {
        question: "Does Python have a switch statement?",
        answer:
          "Since Python 3.10 it has `match`/`case` (structural pattern matching), which can serve as a switch and also destructure values. Before that, `if/elif` chains or dictionary lookups were used.",
      },
      {
        question: "Scenario: a loop that removes invalid items from a list skips some of them. Why, and how do you fix it?",
        answer:
          "Removing an item shifts later items left, so the loop's index moves past the next one. Build a new filtered list instead (`[x for x in xs if valid(x)]` or `xs.filter(valid)`), or iterate over a copy.",
      },
    ],
    prerequisites: ["data-types-and-values"],
    relatedTopics: [
      "functions-and-parameters",
      "recursion",
      "big-o",
      "basic-data-structures",
    ],
    keywords: [
      "if",
      "else",
      "elif",
      "for loop",
      "while loop",
      "break",
      "continue",
      "truthy",
      "falsy",
      "short-circuit",
      "nested loops",
      "off-by-one",
    ],
  },
  {
    id: "functions-and-parameters",
    title: "Functions and Parameters",
    level: "beginner",
    description:
      "Packaging steps into reusable, named units that take inputs and return outputs.",
    explanation: `
A **function** is a named block of code that does one job. You **define** it
once and **call** it whenever you need that job done.

- **Parameters** are the input names listed in the definition:
  \`def greet(name):\` has the parameter \`name\`.
- **Arguments** are the actual values passed in a call: \`greet("Ada")\`
  passes the argument \`"Ada"\`.
- A **return value** is what the function hands back to the caller. Without
  an explicit \`return\`, Python functions return \`None\` and JavaScript
  functions return \`undefined\`.
- **Default arguments** give a parameter a value used when the caller leaves
  it out: \`def greet(name, greeting="Hello")\`.

**Pure vs side-effecting functions**:

- A **pure** function's result depends only on its arguments, and it changes
  nothing outside itself. \`add(2, 3)\` is always 5. Pure functions are easy
  to test and reason about.
- A function with **side effects** changes something else: prints, writes a
  file, modifies a global variable, mutates an argument, or sends a request.
  Programs need side effects to be useful, but it helps to keep them in a
  few clearly named places.

**The call stack**: each call gets its own fresh set of local variables.
When a function calls another, the new call is stacked on top; when it
returns, it's removed and execution continues where it left off.
    `.trim(),
    analogy:
      "A function is like a coffee machine. You put in inputs (beans, water, a size choice), press the button (call it), and get an output (coffee). You don't need to know how it works inside each time, and you can use it again and again.",
    examples: [
      {
        title: "Define, call, return",
        language: "python",
        code: `def area_of_rectangle(width, height):
    return width * height

result = area_of_rectangle(3, 4)
print(result)                    # 12
print(area_of_rectangle(5, 2))   # 10`,
        explanation:
          "`width` and `height` are parameters; `3` and `4` are arguments. The function computes a value and returns it to the caller.",
        walkthrough: [
          { code: "def area_of_rectangle(width, height):", explanation: "Define a function named `area_of_rectangle` with two parameters." },
          { code: "return width * height", explanation: "Compute the product and send it back to whoever called the function." },
          { code: "result = area_of_rectangle(3, 4)", explanation: "Call it: `width` becomes 3, `height` becomes 4; the returned 12 is stored in `result`." },
          { code: "print(area_of_rectangle(5, 2))", explanation: "Call it again with different arguments; the return value 10 goes straight to `print`." },
        ],
      },
      {
        title: "Defaults, keyword arguments, and the JavaScript equivalent",
        language: "javascript",
        code: `function greet(name, greeting = "Hello") {
  return greeting + ", " + name + "!";
}

console.log(greet("Ada"));           // "Hello, Ada!"
console.log(greet("Ada", "Welcome")); // "Welcome, Ada!"

// Arrow function: a shorter way to write small functions
const double = (n) => n * 2;
console.log(double(21));              // 42

// Python equivalent with keyword arguments:
//   def greet(name, greeting="Hello"):
//       return f"{greeting}, {name}!"
//   greet("Ada", greeting="Welcome")`,
        explanation:
          "Defaults apply when an argument is missing. Python also lets callers name arguments (`greeting=\"Welcome\"`), which makes calls self-documenting.",
      },
      {
        title: "Pure vs side-effecting, and Python's mutable-default trap",
        language: "python",
        code: `# Pure: same input, same output, changes nothing else
def with_tax(price, rate):
    return price * (1 + rate)

# Side effect: mutates the caller's list
def add_item(cart, item):
    cart.append(item)

# Trap: the default list is created ONCE, when the function is defined
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

print(add_tag("a"))  # ['a']
print(add_tag("b"))  # ['a', 'b']  <- surprise: same list reused

# Fix: use None as the default and create a new list inside
def add_tag_fixed(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags`,
        explanation:
          "Python evaluates default values once at definition time. A mutable default (list, dict) is shared across calls. JavaScript evaluates defaults on every call, so it doesn't have this trap.",
      },
    ],
    howItWorks: `
When you call a function:

1. The arguments are evaluated.
2. A new **stack frame** is pushed onto the **call stack**. It holds the
   function's parameters, local variables and where to return to.
3. The parameters are bound to the argument values.
4. The body runs. Local variables live only in this frame.
5. On \`return\` (or the end of the body), the frame is popped and the return
   value is handed to the caller, which continues from where it paused.

Because each call gets its own frame, a function can be called many times,
even recursively, without calls interfering with each other's locals.

**Passing arguments**: in Python and JavaScript, the parameter refers to the
same object the caller passed. Reassigning the parameter inside the function
doesn't affect the caller, but **mutating** a passed list or object does.

If calls nest too deeply (often from runaway recursion), the stack runs out of
space: \`RecursionError\` in Python, \`RangeError: Maximum call stack size
exceeded\` in JavaScript.
    `.trim(),
    diagram: `
  main() calls total(), which calls with_tax()

  Call stack (top = running now)
  ┌──────────────────────────────┐
  │ with_tax(price=10, rate=0.2) │  ◄── returns 12.0, then popped
  ├──────────────────────────────┤
  │ total(items=[...])           │  ◄── resumes with 12.0
  ├──────────────────────────────┤
  │ main()                       │
  └──────────────────────────────┘
    `.trim(),
    whyItExists: `
Functions let you name an idea, write it once and reuse it. They split big
problems into small pieces you can understand, test and fix one at a time.
When a bug is fixed inside a function, every caller gets the fix.
    `.trim(),
    whenToUse: `
- When you'd otherwise copy and paste the same steps.
- When a block of code does one clear job that deserves a name.
- To hide details: callers use \`send_email(to, body)\` without knowing SMTP.
- To make logic testable in isolation, especially as pure functions.
    `.trim(),
    whenNotToUse: `
- Don't wrap a single obvious line in a function just to have one; it adds
  indirection without clarity.
- Avoid functions that do many unrelated things or take a long list of
  parameters; split them, or group related parameters into an object.
- Avoid hidden side effects in a function whose name suggests it just
  computes something (\`get_total\` shouldn't also save to the database).
    `.trim(),
    commonMistakes: [
      "Printing a result instead of returning it, so the caller can't use the value (the function returns `None`/`undefined`).",
      "Forgetting the parentheses: `greet` refers to the function; `greet()` calls it.",
      "Using a mutable default argument in Python (`def f(items=[])`), which is shared across calls.",
      "Mutating an argument (a list or object) unexpectedly, surprising the caller.",
      "Code after a `return` statement that never runs, or returning from only some branches so others return `None`.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write `celsius_to_fahrenheit(c)` and `fahrenheit_to_celsius(f)`, and check that converting a value there and back returns the original.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write `format_price(amount, currency=\"USD\", decimals=2)` in Python and JavaScript. Call it with only `amount`, with all arguments, and (in Python) with keyword arguments in a different order.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Take a 30-line script that reads numbers, filters them, computes statistics and prints a report. Split it into small functions, making as many as possible pure. Explain which ones must have side effects and why.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between a parameter and an argument?",
        answer:
          "A parameter is the variable name in the function's definition. An argument is the actual value supplied when calling it.",
      },
      {
        question: "What is a pure function?",
        answer:
          "A function whose output depends only on its inputs and that has no side effects: it doesn't modify external state, I/O or its arguments. Calling it with the same arguments always gives the same result.",
      },
      {
        question: "What is a side effect? Give examples.",
        answer:
          "Any observable change outside the function's own return value: printing, writing files, network requests, modifying globals, mutating arguments, or reading the current time or a random number.",
      },
      {
        question: "What does a function return if it has no return statement?",
        answer: "`None` in Python, `undefined` in JavaScript.",
      },
      {
        question: "Explain Python's mutable default argument problem.",
        answer:
          "Defaults are evaluated once, when the `def` statement runs. A list or dict default is shared by every call that uses it, so mutations accumulate. Use `None` as the default and create a new object inside the function.",
      },
      {
        question: "What is the call stack?",
        answer:
          "A stack of frames, one per active function call, each holding parameters, locals and the return address. A call pushes a frame; a return pops it. Error stack traces are a printout of this stack.",
      },
      {
        question: "What causes a stack overflow?",
        answer:
          "Too many nested calls, usually unbounded recursion without a working base case. Each call adds a frame until the stack's size limit is reached.",
      },
      {
        question: "If a function modifies a list passed to it, does the caller see the change?",
        answer:
          "Yes, in Python and JavaScript: the parameter refers to the same list object. Reassigning the parameter to a new list, however, does not affect the caller's variable.",
      },
      {
        question: "Why do keyword arguments help readability?",
        answer:
          "`resize(image, width=800, keep_aspect=True)` explains itself, unlike `resize(image, 800, True)`. They also let callers skip optional parameters and pass arguments in any order.",
      },
      {
        question: "Scenario: a function `calculate_total` passes all tests alone but gives wrong results in the app. What's a likely cause?",
        answer:
          "It probably depends on or changes shared state: a global variable, a mutated argument or a mutable default. Making it pure, with all inputs passed in explicitly, typically fixes it and makes the bug obvious.",
      },
    ],
    prerequisites: ["control-flow"],
    relatedTopics: [
      "scope-and-lifetime",
      "stack-and-heap",
      "recursion",
      "functional-programming",
      "closures",
      "value-vs-reference",
    ],
    keywords: [
      "function",
      "parameter",
      "argument",
      "return value",
      "default arguments",
      "keyword arguments",
      "pure function",
      "side effect",
      "call stack",
      "stack frame",
      "arrow function",
    ],
  },
  {
    id: "basic-data-structures",
    title: "Basic Data Structures",
    level: "beginner",
    description:
      "Lists/arrays, dictionaries/maps, sets and tuples, and how to choose between them.",
    explanation: `
A **data structure** is a way of organizing many values so they're easy and
fast to use. Four cover most everyday needs:

- **List / array**: an ordered sequence, accessed by position (index). Indexes
  start at **0**. Python \`list\`, JavaScript \`Array\`.
- **Dictionary / map**: key → value pairs. You look values up by key, like a
  word in a dictionary. Python \`dict\`, JavaScript \`Map\` or plain objects.
- **Set**: a collection of **unique** values with fast "is this in here?"
  checks. Python \`set\`, JavaScript \`Set\`.
- **Tuple**: a small, fixed, immutable group of values, like a coordinate
  \`(x, y)\`. Python has \`tuple\`; JavaScript has no tuple type, so a short array
  is used instead.

**Choosing one** comes down to how you'll access the data:

- Need order or positions? → list.
- Need to look things up by a name or ID? → dictionary.
- Need uniqueness or fast membership tests? → set.
- A fixed group of related values that shouldn't change? → tuple.
    `.trim(),
    analogy:
      "A list is a numbered queue of people. A dictionary is a phone book: look up a name, get a number. A set is a guest list where each name appears once and the bouncer can instantly say whether you're on it. A tuple is a sealed envelope with a fixed set of items.",
    examples: [
      {
        title: "The four structures in Python",
        language: "python",
        code: `fruits = ["apple", "banana", "cherry"]   # list
print(fruits[0])        # "apple"
fruits.append("date")

ages = {"ada": 36, "linus": 28}             # dict
print(ages["ada"])      # 36
ages["grace"] = 45

tags = {"python", "web", "python"}          # set
print(tags)             # {'python', 'web'}  (duplicates removed)
print("web" in tags)    # True

point = (3, 4)                              # tuple
x, y = point            # unpacking
# point[0] = 5          # TypeError: tuples are immutable`,
        explanation:
          "Square brackets make lists, curly braces with `key: value` make dicts, curly braces with plain values make sets, and parentheses make tuples. Note: `{}` alone is an empty dict; use `set()` for an empty set.",
        walkthrough: [
          { code: "fruits = [\"apple\", ...]", explanation: "A list keeps items in order; `fruits[0]` is the first one." },
          { code: "fruits.append(\"date\")", explanation: "Add an item to the end of the list." },
          { code: "ages[\"ada\"]", explanation: "Look up a value in the dict by its key." },
          { code: "{\"python\", \"web\", \"python\"}", explanation: "A set keeps only one copy of each value." },
          { code: "\"web\" in tags", explanation: "Fast membership test: is this value in the set?" },
          { code: "x, y = point", explanation: "Unpack a tuple's values into separate names." },
        ],
      },
      {
        title: "The same ideas in JavaScript",
        language: "javascript",
        code: `const fruits = ["apple", "banana", "cherry"];
fruits.push("date");
console.log(fruits.length);       // 4

const ages = new Map([["ada", 36], ["linus", 28]]);
ages.set("grace", 45);
console.log(ages.get("ada"));     // 36

const user = { name: "Ada", age: 36 }; // object: fixed, known keys
console.log(user.name);           // "Ada"

const tags = new Set(["js", "web", "js"]);
console.log(tags.size);           // 2
console.log(tags.has("web"));     // true

const point = [3, 4];             // array used as a tuple
const [x, y] = point;`,
        explanation:
          "Use plain objects for records with known fields, and `Map` for lookups with arbitrary or non-string keys. Use `Set` to remove duplicates or test membership.",
      },
      {
        title: "Why choice matters: membership tests",
        language: "python",
        code: `import time

ids_list = list(range(1_000_000))
ids_set = set(ids_list)

start = time.perf_counter()
999_999 in ids_list           # scans up to every item: O(n)
print("list:", time.perf_counter() - start)

start = time.perf_counter()
999_999 in ids_set            # hash lookup: O(1) on average
print("set: ", time.perf_counter() - start)`,
        explanation:
          "Checking membership in a list looks at items one by one; a set jumps straight to the right place using a hash. With a million items, the set is typically thousands of times faster.",
      },
    ],
    howItWorks: `
**Lists/arrays** store items in a contiguous block of slots. Reading
\`items[i]\` is instant (O(1)) because the position can be computed directly.
Appending to the end is fast on average; inserting or removing at the front
shifts every other item (O(n)). Searching for a value scans item by item (O(n)).

**Dictionaries and sets** are built on **hash tables**. A hash function turns
a key into a number that picks a slot, so lookup, insert and delete are O(1)
on average. Keys must be **hashable**: in Python, immutable values like
strings, numbers and tuples work; lists don't. Python dicts keep insertion
order (guaranteed since 3.7); sets have no meaningful order.

**Tuples** are like lists that can't change. Because they're immutable (and
hashable when their contents are), they can be dict keys or set members.

The O(…) notation (**Big-O**) describes how the work grows as the number of
items grows. It's covered in the DSA topics.
    `.trim(),
    diagram: `
  list    index:  0        1         2
                ┌────────┬─────────┬─────────┐
                │"apple" │"banana" │"cherry" │   access by position: O(1)
                └────────┴─────────┴─────────┘   search by value:    O(n)

  dict    "ada"   ──hash──► slot 5 ──► 36        lookup by key: O(1) average
          "linus" ──hash──► slot 2 ──► 28

  set     {"python", "web"}  (unique; fast "in" checks)

  Need…                       Use
  order / position            list / array
  lookup by key               dict / Map / object
  uniqueness, "is x in it?"   set / Set
  fixed group of values       tuple (Python) / short array (JS)
    `.trim(),
    whyItExists: `
Real programs deal with many values, not one. The way you organize them
determines how simple your code is and how fast it runs. Picking the right
structure often turns a slow, complicated loop into a single fast lookup.
    `.trim(),
    whenToUse: `
- **List**: a feed of posts, lines in a file, steps in order, anything you
  sort or access by position.
- **Dict/Map**: users by ID, settings by name, counting occurrences (word → count),
  caching results.
- **Set**: removing duplicates, tracking "seen" items, comparing groups
  (union, intersection, difference).
- **Tuple**: returning multiple values from a function, coordinates, fixed
  records, dictionary keys made of several parts.
    `.trim(),
    whenNotToUse: `
- Don't search a list repeatedly for membership; convert it to a set once.
- Don't use a dict when order and position are what matter; use a list.
- Don't use a set when you need duplicates or order.
- Don't use a plain JavaScript object as a general-purpose map with
  user-provided keys; keys like \`"__proto__"\` can misbehave. Use \`Map\`.
- For large numeric data, specialized structures (NumPy arrays, typed arrays)
  are far more efficient than plain lists.
    `.trim(),
    commonMistakes: [
      "Forgetting that indexes start at 0, so the last item is `items[len(items) - 1]` (or `items[-1]` in Python).",
      "Reading a missing dict key with `d[key]`, which raises `KeyError`. Use `d.get(key, default)` when absence is normal.",
      "Writing `{}` to create an empty set in Python; it creates an empty dict. Use `set()`.",
      "Using `in` on a large list inside a loop, making the whole algorithm O(n²). Build a set first.",
      "Trying to use a list as a dict key or set member in Python; lists aren't hashable. Use a tuple.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Given a list of names with duplicates, print the unique names (using a set), then print them in their original order without duplicates.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Count how many times each word appears in a paragraph using a dictionary (Python) or a Map (JavaScript), then print the five most common words.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Given two lists of 100,000 user IDs, find the IDs in both, in only the first, and in only the second. Write a version with nested loops and a version with sets, and time both.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between a list and a tuple in Python?",
        answer:
          "Lists are mutable and meant for variable-length collections of similar items. Tuples are immutable, often used for fixed groups of related values, and can be dict keys or set members if their contents are hashable.",
      },
      {
        question: "Why is looking up a key in a dictionary fast?",
        answer:
          "Dictionaries are hash tables: the key's hash determines its slot, so lookup is O(1) on average instead of scanning every entry.",
      },
      {
        question: "When would you use a set instead of a list?",
        answer:
          "When you need uniqueness or fast membership checks, or set operations like union and intersection, and don't care about order or duplicates.",
      },
      {
        question: "What's the time complexity of accessing `items[i]` versus searching for a value in an unsorted list?",
        answer:
          "Index access is O(1); searching by value is O(n), because each item may need to be checked.",
      },
      {
        question: "What's the difference between a JavaScript object and a `Map`?",
        answer:
          "Object keys are strings or symbols and objects inherit prototype properties. `Map` accepts any key type (including objects), keeps insertion order, has a `size` property, and is designed for frequent additions and removals.",
      },
      {
        question: "Why can't a Python list be a dictionary key?",
        answer:
          "Dict keys must be hashable, and a hash must not change over the key's lifetime. Lists are mutable, so their contents (and hash) could change, so they're unhashable. Use a tuple instead.",
      },
      {
        question: "Are Python dictionaries ordered?",
        answer:
          "Yes. Since Python 3.7, dicts are guaranteed to preserve insertion order. Sets are not ordered.",
      },
      {
        question: "How do you remove duplicates from a list while keeping the original order?",
        answer:
          "Python: `list(dict.fromkeys(items))`. JavaScript: `[...new Set(items)]`, since `Set` preserves insertion order. A plain `set(items)` in Python loses order.",
      },
      {
        question: "What does it cost to insert at the front of an array?",
        answer:
          "O(n): every existing element shifts one slot. If you need fast inserts and removals at both ends, use a deque (`collections.deque` in Python).",
      },
      {
        question: "Scenario: a script checks each of 50,000 incoming emails against a list of 50,000 blocked addresses and takes minutes. How do you fix it?",
        answer:
          "Each `in` check on a list is O(n), so the total is O(n²). Convert the blocklist to a set once; each check becomes O(1) on average and the script runs in a fraction of a second.",
      },
    ],
    prerequisites: ["data-types-and-values", "control-flow"],
    relatedTopics: [
      "arrays",
      "hash-tables",
      "big-o",
      "linked-lists",
      "stack",
      "queue",
      "mutability-and-immutability",
    ],
    keywords: [
      "list",
      "array",
      "dictionary",
      "dict",
      "map",
      "object",
      "set",
      "tuple",
      "data structure",
      "hash table",
      "index",
      "membership",
    ],
  },
  {
    id: "debugging-basics",
    title: "Debugging Basics",
    level: "beginner",
    description:
      "Finding and fixing bugs: reading errors and stack traces, printing, breakpoints and minimal reproductions.",
    explanation: `
**Debugging** is finding out why a program doesn't do what you expected,
then fixing it. Every programmer spends a lot of time on it, and it's a
skill you can learn, not luck.

The core loop:

1. **Reproduce** the bug reliably. If you can't trigger it on demand, you
   can't tell whether you've fixed it.
2. **Read the error message and stack trace** carefully. They usually name
   the error type, the message, and the exact file and line.
3. **Form a hypothesis**: "I think \`total\` is a string here, not a number."
4. **Test it** with print statements, a debugger or a small experiment.
5. **Fix the cause**, not just the symptom, then confirm the bug is gone and
   nothing else broke.

Tools and techniques:

- **Print debugging**: print values at key points to see what's really
  happening. Simple and always available.
- **Debuggers**: pause the program at a **breakpoint**, inspect every
  variable, and step through line by line.
- **Rubber-duck debugging**: explain the code, line by line, out loud (to a
  rubber duck, or a colleague). Saying what each line *should* do often
  exposes where it doesn't.
- **Minimal reproduction**: shrink the failing case to the smallest code and
  input that still shows the bug.
    `.trim(),
    analogy:
      "Debugging is detective work. The error message is the first clue, the stack trace is the trail of footprints, prints and breakpoints are interviews with witnesses, and a minimal reproduction is reconstructing the crime scene with nothing but the essentials.",
    examples: [
      {
        title: "Reading a Python traceback",
        language: "python",
        code: `def average(numbers):
    return sum(numbers) / len(numbers)

def report(scores):
    return "Average: " + average(scores)

print(report([80, 90, 70]))

# Traceback (most recent call last):
#   File "app.py", line 7, in <module>
#     print(report([80, 90, 70]))
#   File "app.py", line 5, in report
#     return "Average: " + average(scores)
# TypeError: can only concatenate str (not "float") to str`,
        explanation:
          "Read a Python traceback from the bottom up: the last line is the error type and message; the frame just above it is where it happened (line 5). The fix: `\"Average: \" + str(average(scores))`.",
        walkthrough: [
          { code: "TypeError: can only concatenate str (not \"float\") to str", explanation: "What went wrong: adding a string and a float." },
          { code: "File \"app.py\", line 5, in report", explanation: "Where: line 5, inside the function `report`." },
          { code: "return \"Average: \" + average(scores)", explanation: "The exact line. `average` returns a float, so `+` with a string fails." },
          { code: "File \"app.py\", line 7, in <module>", explanation: "How we got there: the top-level code on line 7 called `report`." },
        ],
      },
      {
        title: "Print debugging and breakpoints in JavaScript",
        language: "javascript",
        code: `function applyDiscount(price, percent) {
  console.log({ price, percent });     // inspect inputs as a labelled object
  const discounted = price - price * percent;
  console.log("discounted:", discounted);
  return discounted;
}

applyDiscount(100, 20); // -1900?! percent should be 0.2, not 20

// Pause here in the browser DevTools or Node inspector:
function applyDiscountDebug(price, percent) {
  debugger; // execution stops on this line when DevTools is open
  return price - price * percent;
}`,
        explanation:
          "Logging inputs immediately showed the cause: the caller passed 20 instead of 0.2. The `debugger` statement (or clicking a line number in DevTools) pauses execution so you can inspect variables and step through.",
      },
      {
        title: "Python's built-in debugger",
        language: "python",
        code: `def total_price(items):
    total = 0
    for item in items:
        breakpoint()   # pauses here and opens pdb
        total += item["price"] * item["qty"]
    return total

total_price([{"price": 5, "qty": 2}, {"price": 3, "qty": "4"}])

# At the (Pdb) prompt:
#   p item       print a variable
#   n            next line
#   s            step into a function call
#   c            continue to the next breakpoint
#   q            quit`,
        explanation:
          "`breakpoint()` drops you into pdb. On the second item you'd see `qty` is the string \"4\", explaining why the total is wrong (`3 * \"4\"` is `\"444\"`, and adding that to an int raises a TypeError).",
      },
    ],
    howItWorks: `
**Stack traces** are a snapshot of the call stack at the moment of the
error: which function was running, which function called it, and so on.

- **Python** prints "most recent call last": read from the **bottom** up.
- **JavaScript** prints the error first, then frames from the most recent
  call **downward**: read from the **top**.

Focus on frames from *your* code; frames inside libraries usually mean you
passed something wrong into them.

**Debuggers** work with the language runtime to pause execution at chosen
lines. While paused you can:

- **Step over**: run the current line, including any calls, and stop at the next.
- **Step into**: enter the function called on this line.
- **Step out**: finish the current function and return to its caller.
- **Watch** expressions and inspect the call stack.
- Use **conditional breakpoints** that only pause when, say, \`i == 500\`.

**Minimal reproductions** work by elimination: remove code and data in
chunks. If the bug remains, that part wasn't needed. What's left points at
the cause. Bisecting history (\`git bisect\`) applies the same idea to commits.
    `.trim(),
    diagram: `
     ┌───────────────┐
     │  Reproduce    │◄──────────────────────────┐
     └──────┬────────┘                           │
            ▼                                    │
     ┌───────────────┐   read error, trace,      │
     │  Observe      │   prints, debugger        │
     └──────┬────────┘                           │
            ▼                                    │
     ┌───────────────┐                           │
     │  Hypothesize  │                           │
     └──────┬────────┘                           │
            ▼                     wrong guess    │
     ┌───────────────┐ ──────────────────────────┘
     │  Test it      │
     └──────┬────────┘ confirmed
            ▼
     Fix cause → re-run → add a test so it stays fixed
    `.trim(),
    whyItExists: `
Code is written by people, and people make mistakes. Requirements change,
inputs are messier than expected, and code interacts in ways no one
predicted. A systematic debugging approach turns hours of guessing into a
short, repeatable process.
    `.trim(),
    whenToUse: `
- **Read the error** first, every time. It's the cheapest clue.
- **Print debugging** for quick checks, code that runs once, or environments
  where a debugger is awkward (servers, CI logs).
- **A debugger** when you need to see many variables, follow a complex path,
  or don't know where to put prints.
- **Rubber-ducking** when you're stuck and "everything looks right".
- **A minimal reproduction** before asking for help or filing a bug report;
  often you'll find the cause while making it.
    `.trim(),
    whenNotToUse: `
- Don't change random things hoping the bug disappears ("shotgun
  debugging"); you might hide it rather than fix it.
- Don't leave debug prints and \`debugger\` statements in committed code; use
  proper logging for things you want to keep.
- Don't wrap failing code in a \`try\` that swallows the error to make it "go
  away"; the bug is still there, now hidden.
    `.trim(),
    commonMistakes: [
      "Not reading the error message, or reading only the first line of a long trace instead of finding the frame in your own code.",
      "Assuming you know what a variable contains instead of checking it.",
      "Fixing the symptom (special-casing the bad value) instead of finding where the bad value came from.",
      "Making several changes at once, so you can't tell which one fixed (or broke) things.",
      "Not adding a test after fixing a bug, so it quietly comes back later.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write a program that crashes with a `KeyError` (Python) or `TypeError: Cannot read properties of undefined` (JavaScript). Read the trace, identify the exact line and cause, and fix it.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a function with an off-by-one bug that sums only the first n−1 items of a list. Find it twice: once with print statements and once by stepping through with a debugger. Compare the experiences.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Take a buggy 50+ line program (or one you wrote earlier) and produce a minimal reproduction under 10 lines that still shows the bug. Write the bug report you'd file: steps, expected vs actual behavior, environment.",
      },
    ],
    interviewQuestions: [
      {
        question: "How do you approach a bug you've never seen before?",
        answer:
          "Reproduce it reliably, read the error and stack trace, narrow down where behavior diverges from expectations (prints, debugger, bisecting), form and test a hypothesis, fix the root cause, then add a test that would have caught it.",
      },
      {
        question: "What is a stack trace?",
        answer:
          "A list of the active function calls at the point an error occurred, with file names and line numbers. It shows where the error happened and the chain of calls that led there.",
      },
      {
        question: "In which order do you read a Python traceback versus a JavaScript stack trace?",
        answer:
          "Python lists the most recent call last, so the error and its location are at the bottom. JavaScript prints the error message first, followed by the most recent frame, so the relevant location is at the top.",
      },
      {
        question: "What is a breakpoint?",
        answer:
          "A marker that pauses execution at a specific line so you can inspect variables, the call stack, and step through code. Conditional breakpoints pause only when an expression is true.",
      },
      {
        question: "What's the difference between step over, step into and step out?",
        answer:
          "Step over runs the current line, including any function calls, and stops at the next line. Step into enters the function being called. Step out runs until the current function returns to its caller.",
      },
      {
        question: "What is rubber-duck debugging and why does it work?",
        answer:
          "Explaining code line by line to someone, or something, that knows nothing about it. Saying what each line is supposed to do forces you to check assumptions you'd otherwise skim past.",
      },
      {
        question: "What is a minimal reproducible example and why is it valuable?",
        answer:
          "The smallest code and input that still trigger the bug. It isolates the cause, makes the problem easy for others to understand and test, and the process of shrinking it often reveals the bug.",
      },
      {
        question: "What is `git bisect`?",
        answer:
          "A Git command that binary-searches commit history to find the commit that introduced a bug. You mark a good and a bad commit, then test the commits Git checks out until it identifies the culprit.",
      },
      {
        question: "Print debugging or a debugger: which is better?",
        answer:
          "Neither always. Prints are quick, work anywhere and leave a log of a whole run. Debuggers let you inspect everything at a moment and explore interactively without re-running. Good developers use both.",
      },
      {
        question: "Scenario: a bug only happens in production, never locally. How do you investigate?",
        answer:
          "Gather evidence from production (logs, error reports with stack traces, the exact inputs). Look for differences: data, configuration, environment variables, versions, load and timing. Then reproduce with production-like data or config locally, and add logging where evidence is missing.",
      },
    ],
    prerequisites: ["functions-and-parameters"],
    relatedTopics: [
      "error-handling-strategies",
      "testing-fundamentals",
      "version-control-basics",
      "clean-code-and-refactoring",
    ],
    keywords: [
      "debugging",
      "stack trace",
      "traceback",
      "error message",
      "breakpoint",
      "debugger",
      "pdb",
      "devtools",
      "print debugging",
      "rubber duck",
      "minimal reproduction",
      "git bisect",
    ],
  },
  {
    id: "version-control-basics",
    title: "Version Control Basics",
    level: "beginner",
    description:
      "Tracking changes with Git: repositories, commits, branches, merges, remotes and good commit messages.",
    explanation: `
**Version control** records the history of your project's files so you can
see what changed, when, why and by whom, go back to any earlier state, and
work with other people without overwriting each other's work.

**Git** is by far the most widely used version control system. Its core
ideas:

- **Repository (repo)**: a project folder plus its complete history, stored
  in a hidden \`.git\` directory.
- **Commit**: a saved snapshot of the project at a moment, with a message, an
  author, a timestamp and a link to the previous commit (its parent). Each
  commit has a unique ID (a hash, like \`3f2a9c1\`).
- **Staging area**: where you choose which changes go into the next commit
  (\`git add\`).
- **Branch**: a movable label pointing at a commit, letting you develop
  something in parallel without disturbing the main line (\`main\`).
- **Merge**: combine the work from one branch into another. If both changed
  the same lines, you get a **merge conflict** to resolve by hand.
- **Remote**: a copy of the repo elsewhere, usually on a host like GitHub or
  GitLab (\`origin\`). You **push** your commits to it and **pull** others'.

Git is **distributed**: every clone holds the full history, so you can
commit, branch and view history offline.
    `.trim(),
    analogy:
      "Git is like save points in a video game, with labels describing each save. Branches are like trying a risky path in a separate save slot: if it works out, you merge it into your main game; if not, you delete the slot and nothing is lost.",
    examples: [
      {
        title: "Starting a repo and making commits",
        language: "bash",
        code: `git init                      # create a new repository here
git status                    # see what's changed / untracked

git add hello.py              # stage a file for the next commit
git commit -m "Add hello script"

# edit hello.py ...
git diff                      # see unstaged changes line by line
git add hello.py
git commit -m "Greet the user by name"

git log --oneline             # view history
# 9c1e4b2 Greet the user by name
# 3f2a9c1 Add hello script`,
        explanation:
          "The everyday loop: change files, check `status`/`diff`, `add` what belongs together, `commit` with a clear message.",
        walkthrough: [
          { code: "git init", explanation: "Turn the current folder into a Git repository (creates `.git`)." },
          { code: "git status", explanation: "Show which files are modified, staged or untracked." },
          { code: "git add hello.py", explanation: "Stage this file's current contents for the next commit." },
          { code: "git commit -m \"Add hello script\"", explanation: "Save a snapshot of everything staged, with a message." },
          { code: "git log --oneline", explanation: "List commits, newest first, one line each." },
        ],
      },
      {
        title: "A basic branch-and-merge workflow",
        language: "bash",
        code: `git clone https://github.com/example/project.git
cd project

git switch -c add-login       # create and switch to a new branch
# ...edit files...
git add .
git commit -m "Add login form"

git push -u origin add-login  # publish the branch to the remote
# open a pull request on GitHub, get a review, then merge it

git switch main
git pull                      # fetch + merge the latest main
git branch -d add-login       # delete the merged branch locally`,
        explanation:
          "Work on a short-lived branch, push it, open a pull request for review, merge into `main`, then update your local `main`. `git switch` is the modern form of `git checkout` for changing branches.",
      },
      {
        title: "Resolving a merge conflict",
        language: "text",
        code: `$ git merge feature
CONFLICT (content): Merge conflict in greeting.py

# greeting.py now contains:
<<<<<<< HEAD
message = "Hello, world"
=======
message = "Hi there, world"
>>>>>>> feature

# 1. Edit the file to the version you want (remove the markers):
message = "Hi there, world"

# 2. Mark it resolved and finish the merge:
$ git add greeting.py
$ git commit`,
        explanation:
          "Git shows both versions between markers: yours (`HEAD`) above `=======`, theirs below. You decide the final content, stage it, and commit.",
      },
    ],
    howItWorks: `
Git stores **snapshots**, not just lists of changes. Each commit records the
full state of the tracked files (unchanged files are shared with the
previous commit, so this stays cheap) and points to its parent commit(s).
Together, commits form a chain (more precisely, a graph) of history.

A commit's ID is a **hash** of its contents, metadata and parent. Change
anything and the hash changes, which is how Git detects corruption and why
rewriting history produces new IDs.

**Three places your changes live**:

1. **Working directory**: the files you edit.
2. **Staging area (index)**: what \`git add\` has prepared for the next commit.
3. **Repository**: committed history.

A **branch** is just a small file containing a commit ID. Committing on a
branch moves its label forward. **HEAD** points to the branch (or commit) you
currently have checked out.

**Merging**: if \`main\` hasn't moved since you branched, Git just moves the
label forward (**fast-forward**). Otherwise it creates a **merge commit** with
two parents. \`git pull\` is \`git fetch\` (download new commits) followed by a
merge (or a rebase, if configured).
    `.trim(),
    diagram: `
  working dir ──git add──► staging area ──git commit──► local repo ──git push──► remote
       ▲                                                    │  ▲                    │
       └──────────────────── git switch / restore ──────────┘  └──── git pull ──────┘

  History with a branch and a merge:

  main:      A ─── B ─────────── E  (merge commit, parents B and D)
                    \\           /
  feature:           C ─────── D
    `.trim(),
    whyItExists: `
Before version control, people kept copies like \`report_final_v2_REAL.doc\`
and emailed files around, losing work and overwriting each other. Version
control gives a reliable history, a safe way to experiment, a record of why
each change was made, and a structured way for many people to work on the
same code at the same time.
    `.trim(),
    whenToUse: `
Use it for practically every project, even solo ones:

- Code of any size, configuration files, documentation, infrastructure
  scripts.
- Before risky changes: commit first, so you can always get back.
- For collaboration: branches and pull requests let teammates review changes
  before they reach \`main\`.

**Writing good commit messages**:

- A short summary line (around 50 characters, imperative mood): "Add login
  form", "Fix crash on empty cart".
- A blank line, then a body explaining **why** the change was needed, if
  it's not obvious.
- One logical change per commit, so history is easy to read and revert.
    `.trim(),
    whenNotToUse: `
- Don't commit secrets (passwords, API keys, \`.env\` files); history is hard
  to scrub and remotes may be public. List such files in \`.gitignore\`.
- Don't commit generated or downloaded files (\`node_modules/\`, build
  output, \`__pycache__/\`); regenerate them instead.
- Plain Git is a poor fit for large binary files (videos, datasets); use Git
  LFS or separate storage.
    `.trim(),
    commonMistakes: [
      "Giant commits mixing unrelated changes with messages like \"stuff\" or \"fix\", which make history useless.",
      "Committing secrets or `.env` files. Removing them in a later commit leaves them in history; rotate the secret immediately.",
      "Working directly on `main` for everything instead of using short-lived branches.",
      "Panicking at a merge conflict. It's just Git asking you to choose between two edits to the same lines.",
      "Using `git push --force` on a shared branch, overwriting teammates' commits. Prefer `--force-with-lease`, and only on your own branches.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Create a new repo, add a file, and make three commits with clear messages. Use `git log --oneline` and `git diff HEAD~1` to view the history and the last change.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Create a branch, change the same line of a file on both the branch and `main`, merge the branch into `main`, and resolve the resulting conflict.",
      },
      {
        difficulty: "Hard",
        prompt:
          "In a repo with 20+ commits, introduce a bug in one of the middle commits. Then use `git bisect` to find it, writing a small script so `git bisect run` finds it automatically.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is a commit?",
        answer:
          "A snapshot of the tracked files at a point in time, plus metadata (author, date, message) and a pointer to its parent commit(s). It's identified by a hash of its contents.",
      },
      {
        question: "What is a branch in Git?",
        answer:
          "A lightweight, movable pointer to a commit. Creating one is nearly free; committing on it moves the pointer forward, leaving other branches untouched.",
      },
      {
        question: "What's the difference between `git fetch` and `git pull`?",
        answer:
          "`fetch` downloads new commits from the remote but doesn't change your working branch. `pull` runs a fetch and then integrates the changes into your current branch by merging (or rebasing, if configured).",
      },
      {
        question: "What's the purpose of the staging area?",
        answer:
          "It lets you choose exactly which changes go into the next commit, so one commit can contain one logical change even if you've edited several things.",
      },
      {
        question: "What is a merge conflict and how do you resolve it?",
        answer:
          "It happens when two branches change the same part of a file differently and Git can't decide which to keep. Edit the file to the correct final content, remove the conflict markers, `git add` it, and complete the merge with a commit.",
      },
      {
        question: "What's the difference between Git and GitHub?",
        answer:
          "Git is the version control tool that runs locally. GitHub is a hosting service for Git repositories that adds collaboration features: pull requests, code review, issues and CI.",
      },
      {
        question: "What is a fast-forward merge?",
        answer:
          "When the target branch has no new commits since the feature branch split off, Git simply moves the target's pointer forward to the feature's latest commit. No merge commit is needed.",
      },
      {
        question: "What makes a good commit message?",
        answer:
          "A concise summary in the imperative mood (\"Fix crash on empty cart\"), optionally followed by a blank line and a body explaining why the change was made. Each commit should contain one logical change.",
      },
      {
        question: "What is `.gitignore` for?",
        answer:
          "It lists file patterns Git should not track, such as dependencies, build output, editor files and local secrets. It doesn't affect files already committed; those must be removed with `git rm --cached`.",
      },
      {
        question: "Scenario: you accidentally committed an API key and pushed it. What do you do?",
        answer:
          "Treat it as leaked: revoke and rotate the key immediately. Then remove it from the code and, if needed, rewrite history (for example with `git filter-repo`) and force-push, coordinating with the team. Rewriting alone isn't enough, because clones and caches may already have it.",
      },
    ],
    prerequisites: ["what-is-programming"],
    relatedTopics: [
      "debugging-basics",
      "testing-fundamentals",
      "clean-code-and-refactoring",
    ],
    keywords: [
      "git",
      "version control",
      "repository",
      "commit",
      "branch",
      "merge",
      "merge conflict",
      "remote",
      "push",
      "pull",
      "fetch",
      "github",
      "commit message",
      "gitignore",
    ],
  },
];
