import type { Topic } from "../../types/content";

export const programmingFundamentalsAdvancedTopics: Topic[] = [
  {
    id: "memory-management-and-garbage-collection",
    title: "Memory Management and Garbage Collection",
    level: "advanced",
    description: "How programs get memory, give it back, and how languages automate (or don't automate) that job.",
    explanation: `
Every value your program creates lives somewhere in memory. Short-lived local
values usually sit on the stack and disappear when a function returns. Values
that must outlive a function call, or whose size isn't known up front, go on
the **heap**. Someone has to decide when heap memory is no longer needed and
hand it back. That job is **memory management**.

Languages take one of four broad approaches:

- **Manual** (C): you call \`malloc\` to get memory and \`free\` to return it.
  Fast and predictable, but every mistake is a bug or a security hole.
- **Ownership / RAII** (C++, Rust): each piece of memory has an owner, and the
  memory is released automatically when the owner goes out of scope. Rust's
  compiler checks ownership rules at compile time.
- **Reference counting** (Swift, CPython, \`Rc\`/\`Arc\` in Rust,
  \`shared_ptr\` in C++): each object counts how many references point to it
  and frees itself when the count hits zero. Simple, but cycles never reach zero.
- **Tracing garbage collection** (Java, Go, C#, JavaScript): a collector
  periodically finds every object reachable from the program's **roots**
  (stack variables, globals, registers) and reclaims everything else.

Garbage collection removes whole classes of bugs (use-after-free, double free),
but it does not make leaks impossible. If you keep a reference to something you
no longer need, the collector must assume you still need it.
    `.trim(),
    analogy:
      "Manual memory is borrowing library books and returning each one yourself. Ownership is a rule that a book goes back automatically when its borrower leaves. Reference counting is a sign-out sheet: when the last name is crossed off, the book goes back. Tracing GC is a librarian who periodically walks the building, collects any book nobody is holding, and reshelves it.",
    examples: [
      {
        title: "Manual memory in C",
        language: "c",
        code: `#include <stdlib.h>
#include <string.h>

char *copy_name(const char *name) {
    char *copy = malloc(strlen(name) + 1); /* +1 for the '\\0' terminator */
    if (copy == NULL) return NULL;          /* allocation can fail */
    strcpy(copy, name);
    return copy;                            /* caller now owns this memory */
}

int main(void) {
    char *name = copy_name("Ada");
    /* ... use name ... */
    free(name);   /* forget this and you leak; do it twice and you corrupt the heap */
    name = NULL;  /* avoid a dangling pointer */
    return 0;
}`,
        walkthrough: [
          { code: "char *copy = malloc(strlen(name) + 1);", explanation: "Asks the allocator for enough heap bytes to hold the string plus its terminating zero byte." },
          { code: "if (copy == NULL) return NULL;", explanation: "malloc returns NULL when it can't allocate, so check before using the pointer." },
          { code: "return copy;", explanation: "The heap memory outlives this function. Responsibility for freeing it passes to the caller." },
          { code: "free(name);", explanation: "Returns the memory to the allocator. After this, the pointer must not be used." },
          { code: "name = NULL;", explanation: "Clearing the pointer makes accidental reuse crash loudly instead of silently reading freed memory." },
        ],
      },
      {
        title: "Ownership in Rust: freed when the owner goes out of scope",
        language: "rust",
        code: `fn main() {
    let names = vec![String::from("Ada"), String::from("Grace")];
    let moved = names;            // ownership moves; \`names\` is no longer usable
    // println!("{:?}", names);   // compile error: value used after move
    println!("{:?}", moved);
}                                 // \`moved\` goes out of scope: Vec and Strings are freed here`,
        explanation:
          "No garbage collector runs. The compiler inserts the cleanup (the `Drop` call) at the end of the owner's scope, and refuses to compile code that uses a value after it has moved.",
      },
      {
        title: "A reference cycle that reference counting can't free (Python)",
        language: "python",
        code: `import gc

class Node:
    def __init__(self):
        self.other = None

a = Node()
b = Node()
a.other = b
b.other = a      # a -> b -> a: each count stays at least 1

del a, b         # no names left, but the counts never reach zero
print(gc.collect())  # CPython's backup cycle collector finds and frees them`,
        explanation:
          "CPython uses reference counting for most objects and a separate cycle detector for exactly this case. Swift has no cycle collector, so you break cycles yourself with `weak` references.",
      },
    ],
    howItWorks: `
**Allocators.** \`malloc\` asks an allocator for a block. The allocator keeps
free lists or size classes, carves blocks out of larger regions it got from the
OS (via \`mmap\`/\`brk\` on Unix), and records each block's size so \`free\`
knows how much to return. Freed blocks are reused; they aren't always returned
to the OS.

**Reference counting.** Every reference copy increments a counter; every drop
decrements it. At zero the object is freed immediately, which gives predictable
timing. Costs: counter updates on every assignment (atomic ones if shared across
threads) and the inability to free cycles without a weak reference or a separate
cycle collector.

**Mark-sweep.** The collector starts at the roots, follows every pointer, and
**marks** each object it reaches. Then it **sweeps** the heap, freeing anything
unmarked. Reachability, not "is it still used", is the rule. Compacting
collectors also move live objects together to reduce fragmentation, updating
every pointer to them.

**Generational GC.** Most objects die young (the *generational hypothesis*).
So the heap is split into a small **young generation**, collected often and
cheaply, and an **old generation**, collected rarely. Objects that survive a few
young collections get promoted. A **write barrier** records old-to-young
pointers so a young collection doesn't have to scan the whole old generation.

**Pauses.** Early collectors stopped the program for the whole collection
("stop the world"). Modern ones (Go's concurrent mark-sweep, Java's G1/ZGC)
do most work concurrently or incrementally to keep pauses short, at the cost of
extra CPU and barriers.
    `.trim(),
    diagram: `
Roots (stack, globals)
   |
   v
 [A] ---> [B] ---> [C]        reachable: marked, kept
            \\
             v
            [D]

 [E] <---> [F]                unreachable cycle: not marked, swept
                              (tracing GC frees it; plain refcounting can't)

Generational heap:
 +-----------------+   survive N collections   +-------------------+
 | young (nursery) | ------------------------> | old generation    |
 | collected often |        promotion          | collected rarely  |
 +-----------------+                           +-------------------+
    `.trim(),
    whyItExists: `
Programs need memory whose lifetime isn't tied to a single function call, and
the machine has a finite amount. Manual management was the original answer, and
decades of use-after-free, double-free and leak bugs (many of them security
vulnerabilities) pushed language designers toward automatic schemes. Each scheme
trades something: GC trades CPU and pause time for safety and convenience;
ownership trades a stricter compiler for safety with no runtime collector.
    `.trim(),
    whenToUse: `
- **Manual or ownership-based** memory when you need predictable latency, tight
  control over layout, or no runtime: kernels, embedded firmware, game engines,
  databases, audio processing.
- **Garbage-collected** languages for most application and service code, where
  developer time and safety matter more than the last few percent of performance.
- **Understanding GC internals** whenever you tune a JVM/Go/Node service,
  investigate latency spikes, or chase a growing heap.
    `.trim(),
    whenNotToUse: `
- Don't pick manual memory management for ordinary business software just for
  speed; the bug cost is high and GC is fast enough for almost all of it.
- Don't fight the collector with object pools and manual \`null\`-ing everywhere
  without profiling first. Modern GCs handle short-lived objects very cheaply,
  and pools can make things worse by keeping objects alive into the old generation.
- Don't call \`System.gc()\` or \`gc.collect()\` routinely to "help"; it usually
  just adds pauses.
    `.trim(),
    commonMistakes: [
      "Assuming a garbage collector means memory leaks are impossible. Anything still reachable (a growing cache, a forgotten event listener, a static list) is never collected.",
      "In C, freeing memory and then continuing to use the pointer (use-after-free), or freeing the same pointer twice. Both corrupt the allocator and are classic security bugs.",
      "Forgetting that `malloc` can return NULL, or allocating `strlen(s)` bytes and forgetting the terminator.",
      "Creating strong reference cycles in a reference-counted system (Swift closures capturing `self`, parent and child holding each other via `Rc`) and leaking both objects.",
      "Relying on finalizers or destructors in a GC language to release files or sockets. Collection timing is unpredictable; use `try-with-resources`, `with`, `using` or `defer` instead.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a C function that allocates an array of n integers, fills it with squares, and returns it. Write the caller so it frees the array exactly once. Run it under Valgrind or AddressSanitizer to confirm there are no leaks." },
      { difficulty: "Medium", prompt: "In a GC language of your choice, write a small program that leaks memory despite the garbage collector (for example, an unbounded static cache or listeners that are never removed). Use a heap profiler to find the leak, then fix it." },
      { difficulty: "Hard", prompt: "Implement a toy mark-sweep collector: objects stored in an array, each with a list of references, plus a set of root indices. Write `mark(roots)` and `sweep()` and test that unreachable cycles are reclaimed while reachable objects survive." },
    ],
    interviewQuestions: [
      { question: "What is the difference between stack and heap allocation?", answer: "Stack allocation is a pointer bump tied to a function call: very fast and freed automatically on return, but sizes are usually fixed and lifetimes can't exceed the call. Heap allocation is for data whose size or lifetime isn't known statically; it costs more and must be freed manually, by ownership rules, or by a GC." },
      { question: "What is a memory leak, and how can one happen in a garbage-collected language?", answer: "A leak is memory the program no longer needs but that is never reclaimed. In a GC language it happens when objects remain reachable: an ever-growing map used as a cache, listeners or callbacks never unregistered, a static collection, or a closure capturing a large object." },
      { question: "Why can't plain reference counting collect cycles, and how do systems deal with it?", answer: "In a cycle each object holds a reference to the next, so no count reaches zero even when nothing outside the cycle refers to them. Fixes: weak references that don't increment the count (Swift `weak`, Rust `Weak`), or a backup tracing cycle collector (CPython's `gc` module)." },
      { question: "Explain mark-sweep garbage collection.", answer: "Starting from roots (stack slots, globals, registers), the collector traverses all references and marks every reachable object. It then sweeps the heap and frees every unmarked object. It handles cycles naturally because it asks 'is this reachable?' rather than 'how many refer to this?'." },
      { question: "What is the generational hypothesis and how do collectors exploit it?", answer: "Most objects die soon after allocation. Generational collectors allocate into a small young generation that is collected frequently; since most of it is dead, collection is cheap (often copying only survivors). Long-lived survivors are promoted to an old generation collected less often. Write barriers track old-to-young references so young collections stay small." },
      { question: "What does Rust's ownership model give you compared with a GC?", answer: "Memory safety without a runtime collector: each value has one owner, borrows are checked at compile time, and the value is dropped deterministically when the owner goes out of scope. You get predictable latency and timely release of non-memory resources, at the cost of a stricter compiler and more upfront design." },
      { question: "What is RAII?", answer: "Resource Acquisition Is Initialization: a resource (memory, file, lock) is tied to an object's lifetime. The constructor acquires it and the destructor releases it, so leaving scope, including via an exception, always cleans up. C++ smart pointers and lock guards, and Rust's `Drop`, are RAII." },
      { question: "Why are GC pauses a problem, and how do modern collectors reduce them?", answer: "A stop-the-world pause halts every application thread, which shows up as tail-latency spikes. Modern collectors mark concurrently with the program, collect incrementally or by region, and use read/write barriers to keep the heap consistent while the program mutates it. Go, G1, ZGC and Shenandoah all aim for millisecond or sub-millisecond pauses, paying with extra CPU and memory overhead." },
      { question: "A service's heap grows steadily over days until it crashes. How do you investigate?", answer: "Confirm it's a leak and not normal growth (memory after full GC keeps rising). Take heap dumps at two points in time and diff them to see which object types grow, then follow the retention path (the chain of references from a GC root) to see what keeps them alive. Common culprits: unbounded caches, listener registries, thread-locals, and request-scoped data stored in long-lived structures." },
      { question: "Why might an object pool hurt performance in a generational GC language?", answer: "Pooled objects live a long time, so they get promoted to the old generation. Writes from them to young objects then trigger write barriers and keep young objects alive longer, and old-generation collections get more expensive. Short-lived allocation is usually cheap in a young generation, so pooling only pays off for genuinely expensive objects (buffers, connections) and should be justified by profiling." },
    ],
    prerequisites: ["stack-and-heap", "scope-and-lifetime", "value-vs-reference"],
    relatedTopics: ["pointers-and-references", "stack-and-heap", "memory-management", "scope-and-lifetime"],
    keywords: ["malloc", "free", "garbage collection", "gc", "mark and sweep", "generational", "reference counting", "raii", "ownership", "rust", "memory leak", "heap"],
  },
  {
    id: "pointers-and-references",
    title: "Pointers and References",
    level: "advanced",
    description: "Values that hold the location of other values, and what goes wrong when that location is invalid.",
    explanation: `
Every value in memory lives at an **address**, a number identifying where its
bytes start. A **pointer** is a variable whose value is an address. Following
that address to get the value stored there is called **dereferencing**.

Pointers let a function change its caller's data, let many parts of a program
share one large object without copying it, and make linked structures like
lists and trees possible.

In C and C++ pointers are explicit and raw: you can print them, do arithmetic on
them, and point them anywhere, including at memory that no longer belongs to
you. That power causes the most famous bugs in software: **null pointer**
dereferences, **dangling pointers** to freed memory, and buffer overflows.

Managed languages (Java, Python, JavaScript, C#, Go to a degree) give you
**references** instead: handles to objects that you can copy and compare but
not do arithmetic on. The runtime guarantees a reference either points at a
live object or is \`null\`/\`None\`, so dangling references are impossible,
though null references are still very possible.
    `.trim(),
    analogy:
      "A pointer is a house address written on a piece of paper. Copying the paper doesn't copy the house. Going to the address is dereferencing. A null pointer is a blank piece of paper; a dangling pointer is the address of a house that's been demolished, where someone else may now be living.",
    examples: [
      {
        title: "Address, dereference, and changing a caller's variable (C)",
        language: "c",
        code: `#include <stdio.h>

void increment(int *counter) {
    *counter = *counter + 1;   /* change the value at the address */
}

int main(void) {
    int count = 41;
    int *pointer = &count;     /* & takes the address of count */
    printf("%p holds %d\\n", (void *)pointer, *pointer);
    increment(&count);
    printf("count is now %d\\n", count);  /* 42 */
    return 0;
}`,
        walkthrough: [
          { code: "int *pointer = &count;", explanation: "`&count` is the address of `count`. `pointer` is a variable that stores that address; its type says it points to an int." },
          { code: "*pointer", explanation: "The `*` dereferences: it reads the int stored at the address held in `pointer`." },
          { code: "void increment(int *counter)", explanation: "The function receives a copy of the address, not a copy of the int." },
          { code: "*counter = *counter + 1;", explanation: "Writing through the pointer changes the caller's `count`, because both refer to the same memory." },
        ],
      },
      {
        title: "Pointer arithmetic and a dangling pointer (C)",
        language: "c",
        code: `int numbers[4] = {10, 20, 30, 40};
int *cursor = numbers;        /* array decays to pointer to its first element */
cursor = cursor + 2;          /* moves 2 * sizeof(int) bytes, not 2 bytes */
printf("%d\\n", *cursor);     /* 30 */

int *dangling(void) {
    int local = 5;
    return &local;            /* BUG: local dies when the function returns */
}`,
        explanation:
          "Adding n to a pointer advances it by n elements of its type. Returning the address of a local variable gives the caller a dangling pointer to a stack slot that will be reused by the next call.",
      },
      {
        title: "References in a managed language (Java)",
        language: "java",
        code: `List<String> first = new ArrayList<>();
List<String> second = first;   // copies the reference, not the list
second.add("shared");
System.out.println(first);     // [shared]: both names refer to one object

second = new ArrayList<>();    // rebinds second only
System.out.println(first);     // still [shared]`,
        explanation:
          "Java passes and assigns references by value. You can mutate the shared object through either reference, but reassigning one variable never affects the other.",
      },
    ],
    howItWorks: `
Memory is a large array of bytes, and an address is an index into it (a
*virtual* address that the CPU's memory management unit translates to physical
memory). A pointer is typically 8 bytes on a 64-bit machine.

The pointer's **type** tells the compiler two things: how many bytes to read
when you dereference it, and how far \`p + 1\` moves (\`sizeof(*p)\` bytes).
\`array[i]\` in C is literally defined as \`*(array + i)\`.

**Null** is a reserved address (0 in practice) that means "points nowhere".
The OS leaves the lowest page of the address space unmapped, so dereferencing
null usually crashes immediately with a segmentation fault. In C and C++ it is
still **undefined behavior**, so the compiler may assume it never happens and
optimize accordingly.

A **dangling pointer** still holds an address, but the memory there has been
freed or has gone out of scope. Reading it might return stale data, garbage, or
someone else's data; writing through it corrupts whatever lives there now.

**Managed references** are pointers the runtime controls. You can't do
arithmetic or cast integers to them, and the garbage collector only frees an
object when no reference to it remains, so references can't dangle. A moving
collector may even relocate objects and update every reference behind your back.
C++ references (\`int&\`) are different again: an alias that must be bound once
and can't be null or reseated.
    `.trim(),
    diagram: `
 Variable     Address    Value
 --------     -------    -----
 count        0x1000     41
 pointer      0x1008     0x1000   ---+
                                     |  *pointer follows the arrow
                                     v
                         0x1000:  41

 int numbers[4] at 0x2000 (4-byte ints):
 0x2000  0x2004  0x2008  0x200C
 [ 10 ]  [ 20 ]  [ 30 ]  [ 40 ]
   ^               ^
 numbers         numbers + 2
    `.trim(),
    whyItExists: `
Programs need to share data without copying it, let functions modify data they
were given, and build structures whose pieces are linked rather than laid out
contiguously. Hardware works in addresses, so low-level languages expose them
directly. Managed languages keep the useful part (sharing and indirection) and
remove the dangerous part (arithmetic and manual lifetimes).
    `.trim(),
    whenToUse: `
- Raw pointers in C/C++ for systems work: OS kernels, drivers, memory-mapped I/O,
  custom allocators, and performance-critical data structures.
- Passing a pointer or reference to avoid copying large structs, or to let a
  function fill in an output.
- Building linked lists, trees and graphs where nodes refer to each other.
- In C++, prefer references and smart pointers (\`unique_ptr\`, \`shared_ptr\`)
  and reach for raw pointers only for non-owning observation.
    `.trim(),
    whenNotToUse: `
- Don't use raw owning pointers in modern C++ or \`unsafe\` Rust when an
  ownership type would do; they're where leaks and dangling pointers come from.
- Don't use pointer arithmetic to walk data when indexing or iterators express
  the same thing; they're bounds-checkable and easier to read.
- Don't pass a pointer just to "make it faster" for small values like ints;
  copying 4 or 8 bytes is as cheap as copying an address.
    `.trim(),
    commonMistakes: [
      "Returning a pointer or reference to a local variable. The stack frame is gone once the function returns, so the pointer dangles.",
      "Dereferencing a pointer without checking for null, especially return values from `malloc`, lookups, or optional fields.",
      "Thinking `p + 1` moves one byte. It moves one element, so `int *p` advances by `sizeof(int)`.",
      "Using a pointer into a growable container (a C++ `vector` element, a Go slice) after the container reallocates; the old storage is freed and the pointer dangles.",
      "In managed languages, assuming `b = a` copies an object. It copies the reference, so mutations through `b` show up through `a`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a C function `void swap(int *a, int *b)` that swaps two integers in the caller, and explain why `void swap(int a, int b)` can't work." },
      { difficulty: "Medium", prompt: "Implement a singly linked list in C with `push_front`, `find`, and `free_all`. Use AddressSanitizer to prove there are no leaks or use-after-free bugs, then deliberately add one and read the report." },
      { difficulty: "Hard", prompt: "Write `my_strlen` and `my_memcpy` in C using only pointer arithmetic (no indexing). Then explain what happens if the source and destination regions overlap, and write `my_memmove` that handles it." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a pointer and a reference?", answer: "A pointer is a variable holding an address: it can be null, reassigned, and (in C/C++) used in arithmetic. A C++ reference is an alias that must be initialized, can't be null in valid code, and can't be reseated. A managed-language reference is a GC-controlled handle: nullable and reassignable, but with no arithmetic and no dangling." },
      { question: "What is a dangling pointer, and how do you get one?", answer: "A pointer to memory that is no longer valid: freed heap memory, a local variable whose function has returned, or a container element after the container reallocated. Using it is undefined behavior and may read stale data or corrupt live data." },
      { question: "What happens when you dereference a null pointer?", answer: "In C and C++ it's undefined behavior. In practice it usually causes a segmentation fault because the OS leaves address 0 unmapped, but the compiler may also optimize code assuming it can't happen. In Java or C# it throws `NullPointerException` / `NullReferenceException`." },
      { question: "How does pointer arithmetic work in C?", answer: "Adding n to a `T *` advances the address by `n * sizeof(T)`. Subtracting two pointers into the same array gives the element distance. `a[i]` is defined as `*(a + i)`. Arithmetic is only defined within one array object (plus one past its end)." },
      { question: "Why can't Java have dangling references?", answer: "Java gives no way to free an object explicitly or to compute an address. The GC reclaims an object only when nothing references it, so any reference you hold always points to a live object or is null." },
      { question: "Is Java pass-by-reference?", answer: "No. Java is always pass-by-value; for objects the value passed is a reference. The method can mutate the shared object, but reassigning the parameter has no effect on the caller's variable." },
      { question: "What is a double free, and why is it dangerous?", answer: "Calling `free` twice on the same pointer. Allocators keep metadata in and around freed blocks, so a second free can corrupt free lists. Attackers can exploit this to make later allocations overlap and overwrite chosen memory." },
      { question: "How do smart pointers reduce pointer bugs in C++?", answer: "They encode ownership in the type. `unique_ptr` has one owner and frees on scope exit; `shared_ptr` reference-counts shared ownership; `weak_ptr` observes without owning and breaks cycles. Frees become automatic and ownership transfers become explicit with `std::move`." },
      { question: "Why does Rust have both references and raw pointers?", answer: "Safe references (`&T`, `&mut T`) are checked by the borrow checker: always valid and either shared-read or exclusive-write, never both. Raw pointers (`*const T`, `*mut T`) skip those checks for FFI and low-level code and can only be dereferenced in an `unsafe` block, which marks where a human must uphold the invariants." },
    ],
    prerequisites: ["value-vs-reference", "stack-and-heap"],
    relatedTopics: ["memory-management-and-garbage-collection", "value-vs-reference", "stack-and-heap", "basic-data-structures"],
    keywords: ["pointer", "reference", "address", "dereference", "null pointer", "dangling pointer", "pointer arithmetic", "segfault", "smart pointer", "c"],
  },
  {
    id: "processes-and-threads",
    title: "Processes and Threads",
    level: "advanced",
    description: "How the operating system runs many programs, and many paths within one program, at the same time.",
    explanation: `
A **process** is a running program: its code, its own private memory (the
**address space**), open files, and at least one thread. Two processes can't see
each other's memory unless they set up sharing explicitly.

A **thread** is one path of execution inside a process: an instruction pointer,
registers and a stack. All threads in a process share the same heap, globals and
open files. That makes communication between threads cheap (just read shared
memory) and dangerous (two threads can change the same data at once).

The OS **scheduler** decides which thread runs on which CPU core and for how
long. When it swaps one thread out for another, that's a **context switch**.

Some runtimes add their own lightweight threads on top: Go's **goroutines**,
Java's **virtual threads**, Erlang processes. These are called **green threads**
or user-space threads. The runtime multiplexes many of them onto a few OS
threads, so you can have hundreds of thousands at once.
    `.trim(),
    analogy:
      "A process is a restaurant kitchen with its own pantry and equipment. Threads are cooks in that kitchen: they share the pantry, so they work together quickly, but two cooks can grab the same pan. Separate processes are separate kitchens; safer, but passing food between them means carrying it across the street.",
    examples: [
      {
        title: "Threads share memory; processes don't (Python)",
        language: "python",
        code: `import threading
import multiprocessing

counter = {"value": 0}

def bump():
    counter["value"] += 1

thread = threading.Thread(target=bump)
thread.start(); thread.join()
print(counter["value"])   # 1: the thread changed our dict

process = multiprocessing.Process(target=bump)
process.start(); process.join()
print(counter["value"])   # still 1: the child changed its own copy`,
        walkthrough: [
          { code: "thread = threading.Thread(target=bump)", explanation: "A new thread in the same process. It shares the `counter` dict." },
          { code: "thread.start(); thread.join()", explanation: "Run it and wait for it to finish." },
          { code: "print(counter[\"value\"])   # 1", explanation: "The change is visible because the thread wrote to the same memory." },
          { code: "process = multiprocessing.Process(target=bump)", explanation: "A new process with its own address space (a forked or freshly started copy)." },
          { code: "# still 1", explanation: "The child incremented its own copy of the dict; the parent's memory is untouched." },
        ],
      },
      {
        title: "Goroutines: cheap concurrent tasks (Go)",
        language: "go",
        code: `package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    results := make([]int, 10_000)
    for i := 0; i < 10_000; i++ {
        wg.Add(1)
        go func(i int) {           // 10,000 goroutines, a few OS threads
            defer wg.Done()
            results[i] = i * i     // each writes its own slot: no sharing conflict
        }(i)
    }
    wg.Wait()
    fmt.Println(results[9_999])
}`,
        explanation:
          "Each goroutine starts with a few KB of stack that grows as needed, so ten thousand are cheap. Ten thousand OS threads would each reserve far more memory and strain the scheduler.",
      },
    ],
    howItWorks: `
**Address spaces.** Each process gets a virtual address space. The CPU's MMU
translates virtual addresses to physical pages using the process's page tables,
so the same address in two processes points to different physical memory. That
isolation is what stops one crashing program from corrupting another.

**Creating them.** On Unix, \`fork()\` clones a process (pages are shared
copy-on-write until either side writes), and \`exec()\` replaces its program.
Creating a thread is cheaper: it only needs a new stack and register state in the
existing address space.

**Context switching.** The kernel saves the running thread's registers and
instruction pointer, picks another thread, and restores its state. Switching
between threads of the same process keeps the same page tables. Switching
between processes also changes the address space, which flushes some TLB
entries and makes caches colder, so it costs more.

**Scheduling.** Preemptive schedulers give each runnable thread a time slice and
interrupt it with a timer when the slice ends. Threads blocked on I/O or a lock
don't get scheduled until they're woken. Linux's scheduler balances fairness and
priority across cores.

**Green threads (M:N).** The runtime schedules M lightweight tasks onto N OS
threads. When a goroutine blocks on a channel or network I/O, the Go runtime
parks it and runs another on the same OS thread, without a kernel context switch.

**Python's GIL.** CPython has a Global Interpreter Lock: only one thread
executes Python bytecode at a time. Threads still help for I/O-bound work (the
lock is released while waiting on I/O), but CPU-bound Python code needs
\`multiprocessing\` (separate processes, each with its own GIL) or native
extensions that release the lock. CPython 3.13+ offers an experimental
free-threaded build without the GIL.
    `.trim(),
    diagram: `
 Process A (own address space)          Process B (own address space)
 +------------------------------+       +---------------------------+
 | code | globals | heap        |       | code | globals | heap     |
 |------------------------------|       |---------------------------|
 | Thread 1 | Thread 2 | Thread3|       | Thread 1                  |
 | stack    | stack    | stack  |       | stack                     |
 +------------------------------+       +---------------------------+
        threads share heap                  separated by the MMU;
                                            talk via pipes, sockets,
                                            shared memory

 Green threads (M:N):
  g1 g2 g3 g4 g5 g6 ...  (goroutines)
    \\  |  /    \\ | /
   OS thread 1  OS thread 2   ->  CPU cores
    `.trim(),
    whyItExists: `
Computers run many programs at once, and one program often has several things to
do at once: serve many clients, keep a UI responsive while working, use every
CPU core. Processes provide isolation so programs can't corrupt each other.
Threads provide cheap concurrency inside a program. Green threads exist because
OS threads are too heavy to create one per connection at large scale.
    `.trim(),
    whenToUse: `
- **Multiple processes** for isolation (a browser tab per process, worker
  processes behind a web server), for crash containment, and for CPU-bound
  parallelism in GIL languages like Python.
- **Threads** for parallel CPU work over shared data, and for blocking I/O when
  you don't have an async API.
- **Goroutines / virtual threads** for servers handling many concurrent
  connections with simple, blocking-style code.
    `.trim(),
    whenNotToUse: `
- Don't add threads to a program that is fast enough single-threaded; shared
  state brings race conditions and much harder debugging.
- Don't create one OS thread per request at high concurrency; use a pool, green
  threads, or async I/O.
- Don't use Python threads to speed up CPU-bound pure-Python code; the GIL
  serializes it. Use processes or a native library.
- Don't use more CPU-bound worker threads than cores; extra ones just add
  context switches.
    `.trim(),
    commonMistakes: [
      "Expecting a child process to see changes to the parent's variables (or vice versa). After fork or spawn, each has its own memory.",
      "Using threads in CPython for CPU-heavy work and seeing no speedup because of the GIL.",
      "Creating an unbounded number of OS threads (one per request) and running out of memory or thrashing the scheduler.",
      "Forgetting to join or wait for threads, so the program exits before they finish or results are read too early.",
      "Assuming the OS will run threads in the order they were started. Scheduling order is not guaranteed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a program that starts 4 threads, each printing its id 5 times. Run it several times and describe how the interleaving changes between runs." },
      { difficulty: "Medium", prompt: "In Python, time a CPU-bound function (e.g. counting primes below 2 million) run 4 times: sequentially, with 4 threads, and with 4 processes. Explain the results in terms of the GIL." },
      { difficulty: "Hard", prompt: "In Go, spawn 100,000 goroutines that each sleep for one second, then do the same with OS threads in C (pthreads) or Java platform threads. Measure memory usage and creation time, and explain the difference." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a process and a thread?", answer: "A process is an isolated running program with its own virtual address space and resources. A thread is an execution path inside a process; threads in the same process share memory and file descriptors but each has its own stack and registers. Processes are isolated and heavier; threads are cheap and share state." },
      { question: "What happens during a context switch?", answer: "The kernel saves the current thread's CPU registers and instruction pointer, picks the next thread to run, and restores that thread's saved state. If the new thread belongs to another process, the kernel also switches page tables, which invalidates TLB entries and makes caches colder." },
      { question: "Why is a process switch more expensive than a thread switch?", answer: "Threads in one process share an address space, so switching between them keeps page tables and the TLB. A process switch changes the address space, invalidating TLB entries (unless tagged) and losing cache locality, on top of saving and restoring registers." },
      { question: "What is copy-on-write in `fork()`?", answer: "After fork, parent and child share the same physical pages marked read-only. Only when one of them writes to a page does the kernel copy that page. Forking is therefore cheap even for large processes, especially when the child immediately calls exec." },
      { question: "What are green threads or goroutines, and why use them?", answer: "User-space threads scheduled by a language runtime rather than the kernel, multiplexed M:N onto OS threads. They start with small growable stacks and switch without a kernel transition, so you can run hundreds of thousands. When one blocks on I/O, the runtime parks it and runs another." },
      { question: "What is Python's GIL, and how does it affect multithreading?", answer: "The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython. I/O-bound threads still benefit because the GIL is released while blocked, but CPU-bound threads don't run in parallel. Use multiprocessing, native extensions that release the GIL, or the experimental free-threaded build." },
      { question: "How do processes communicate if they don't share memory?", answer: "Through inter-process communication: pipes, Unix domain or network sockets, message queues, signals, files, or explicitly mapped shared memory segments. Message passing is safer; shared memory is faster but needs synchronization." },
      { question: "What is the difference between preemptive and cooperative scheduling?", answer: "Preemptive schedulers interrupt a running thread when its time slice ends, so one busy thread can't starve others. Cooperative scheduling only switches when a task yields, which is cheaper but lets a misbehaving task block everyone, as with a CPU-heavy callback on an event loop." },
      { question: "When would you choose multiple processes over multiple threads?", answer: "When you need fault isolation (one crash shouldn't take down others), security boundaries, CPU parallelism in a GIL language, or to scale across machines later. Threads win when tasks share large in-memory state and communicate frequently." },
      { question: "How many threads should a thread pool have?", answer: "For CPU-bound work, about one per core; more just adds switching. For I/O-bound work, more threads than cores, roughly cores × (1 + wait time / compute time). Measure and tune, and bound the pool so load spikes queue instead of exhausting memory." },
    ],
    prerequisites: ["how-code-runs", "stack-and-heap"],
    relatedTopics: ["concurrency-and-race-conditions", "async-and-event-driven-programming", "locks-and-deadlocks", "event-loop"],
    keywords: ["process", "thread", "context switch", "scheduler", "address space", "fork", "goroutine", "green threads", "virtual threads", "gil", "multiprocessing", "multithreading"],
  },
  {
    id: "concurrency-and-race-conditions",
    title: "Concurrency and Race Conditions",
    level: "advanced",
    description: "What goes wrong when several tasks touch the same data at once, and why the result depends on timing.",
    explanation: `
**Concurrency** means several tasks are in progress during the same period; they
may take turns on one core. **Parallelism** means tasks literally execute at the
same instant on different cores. Concurrency is about structure, parallelism is
about execution. A single-core machine can be concurrent but not parallel.

Concurrency becomes hard when tasks share **mutable state**. A **race
condition** is a bug where the result depends on the exact timing or
interleaving of operations. It might work a million times and fail on the
million-and-first, which makes races some of the hardest bugs to find.

Three ideas explain most races:

- **Atomicity.** An operation is atomic if no other task can observe it half
  done. \`count += 1\` looks like one step but is really read, add, write.
- **Check-then-act.** "If the file doesn't exist, create it" fails when another
  task acts between your check and your action.
- **Memory visibility.** On modern CPUs and compilers, a write made by one thread
  isn't guaranteed to be seen by another thread promptly, or in the same order,
  unless you use synchronization.
    `.trim(),
    analogy:
      "Two people share a bank account with $100. Both check the balance at the same moment, see $100, and each withdraws $80. Each check was correct when it happened, but by the time they acted the world had changed. The bank now has -$60.",
    examples: [
      {
        title: "Lost updates: count += 1 is not atomic (Java)",
        language: "java",
        code: `public class Counter {
    private int count = 0;

    public void increment() {
        count++;              // read, add 1, write back: three steps
    }

    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Runnable work = () -> { for (int i = 0; i < 100_000; i++) counter.increment(); };
        Thread first = new Thread(work), second = new Thread(work);
        first.start(); second.start();
        first.join(); second.join();
        System.out.println(counter.count);   // usually less than 200000
    }
}`,
        walkthrough: [
          { code: "count++;", explanation: "Compiles to: load count into a register, add one, store it back." },
          { code: "first.start(); second.start();", explanation: "Both threads run increment loops at the same time." },
          { code: "// usually less than 200000", explanation: "If both threads load the same value before either stores, one increment overwrites the other and is lost." },
        ],
      },
      {
        title: "Fixing it: atomic increment or a lock",
        language: "java",
        code: `import java.util.concurrent.atomic.AtomicInteger;

private final AtomicInteger count = new AtomicInteger();
public void increment() { count.incrementAndGet(); }   // single atomic operation

// or
private int lockedCount = 0;
public synchronized void incrementLocked() { lockedCount++; }  // one thread at a time`,
      },
      {
        title: "Check-then-act race (Python)",
        language: "python",
        code: `import os

# Racy: another process can create the file between the check and the open
if not os.path.exists("report.lock"):
    open("report.lock", "w").close()

# Atomic: the OS checks and creates in one step, failing if it already exists
try:
    os.close(os.open("report.lock", os.O_CREAT | os.O_EXCL))
except FileExistsError:
    print("Someone else holds the lock")`,
        explanation:
          "The fix is to let one atomic operation do both the check and the act. Databases do the same with unique constraints, `INSERT ... ON CONFLICT`, or conditional updates.",
      },
    ],
    howItWorks: `
**Interleaving.** The scheduler can pause a thread between any two machine
instructions. For \`count++\` on two threads:

The bad interleaving is: thread A reads 5, thread B reads 5, A writes 6,
B writes 6. Two increments, one effect. This is a **lost update**.

**Data race vs race condition.** A *data race* is a specific low-level bug: two
threads access the same memory location, at least one writes, and there's no
synchronization between them. In C, C++ and Go that's undefined or unspecified
behavior. A *race condition* is the broader logic bug where timing changes the
outcome; it can happen even with no data race (for example, two atomic
operations used in a check-then-act sequence).

**Memory visibility and reordering.** CPUs keep values in per-core caches and
store buffers, and both compilers and CPUs reorder instructions when a single
thread can't tell the difference. Another thread *can* tell. Without a
synchronization point, thread B may never see thread A's write to a \`done\`
flag, or may see the flag before the data it was supposed to guard.

**Happens-before.** Language memory models (Java, C++, Go) define which writes
are guaranteed visible to which reads. Releasing a lock happens-before the next
acquire of the same lock; a write to a Java \`volatile\` or a C++ \`atomic\`
happens-before a read that sees it. If you use these tools correctly, you get
sequentially consistent behavior for your program.

**Ways to avoid races:** don't share (each thread owns its data), share only
immutable data, pass messages (channels, queues, actors), or protect shared
mutable state with locks or atomics.
    `.trim(),
    diagram: `
 Time   Thread A            Thread B            count
 ----   --------            --------            -----
  1     read count (5)                            5
  2                         read count (5)        5
  3     add 1 -> 6                                5
  4                         add 1 -> 6            5
  5     write 6                                   6
  6                         write 6               6   <- one update lost

 Concurrency (1 core):  A A B B A B A   (interleaved)
 Parallelism (2 cores): A A A A A A A
                        B B B B B B B   (simultaneous)
    `.trim(),
    whyItExists: `
Concurrency lets programs use multiple cores and stay responsive while waiting
on slow I/O. As soon as concurrent tasks share mutable data, though, the
programmer has to reason about every possible interleaving, and hardware
optimizations like caches and reordering make the real set of possibilities
larger than intuition suggests. Race conditions are the price; synchronization
and memory models are the tools for paying it.
    `.trim(),
    whenToUse: `
Think about races whenever two or more of these share mutable data:
- threads in one process (thread pools, parallel loops, web request handlers),
- async tasks that interleave at \`await\` points,
- processes or services touching the same file, database row or cache key.

Reach for **immutable data or message passing** first, **atomics** for single
counters and flags, and **locks** for invariants spanning several fields.
    `.trim(),
    whenNotToUse: `
- Don't introduce concurrency for work that's fast enough sequentially; the
  correctness cost is real.
- Don't protect data that isn't shared. Thread-local or request-local data needs
  no synchronization.
- Don't use \`volatile\` or atomics as a general substitute for locks; they make
  single operations safe, not multi-step invariants.
    `.trim(),
    commonMistakes: [
      "Assuming `x++`, `x += 1` or `list.append` in a check-then-act sequence is atomic because it's one line of source code.",
      "Testing concurrent code a few times, seeing it pass, and concluding it's correct. Races may appear only under load or on different hardware.",
      "Thinking single-threaded async code (Node.js, asyncio) can't race. Any `await` between a read and a write lets other tasks run in between.",
      "Using a plain boolean flag to signal another thread without `volatile`/atomic/locking, so the other thread may never see the change.",
      "Making each method thread-safe but calling two of them in sequence (`if (!map.containsKey(k)) map.put(k, v)`) and assuming the combination is safe.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the lost-update counter with 2, 4 and 8 threads and record the final counts. Then fix it with an atomic counter and confirm the result is always correct." },
      { difficulty: "Medium", prompt: "Write an async Python or JavaScript function that reads a balance, awaits a short sleep, and writes balance - amount. Run two withdrawals concurrently and show the race, then fix it with an `asyncio.Lock` or by removing the await between read and write." },
      { difficulty: "Hard", prompt: "Write a Go program with an intentional data race on a shared map or counter, run it with `go run -race`, and interpret the report. Then fix it once with a mutex and once by confining the data to a single goroutine that receives updates over a channel." },
    ],
    interviewQuestions: [
      { question: "What is the difference between concurrency and parallelism?", answer: "Concurrency is structuring a program as multiple tasks whose execution overlaps in time, possibly by interleaving on one core. Parallelism is running multiple computations at literally the same instant on multiple cores. Concurrency is about dealing with many things; parallelism is about doing many things at once." },
      { question: "What is a race condition?", answer: "A bug where the program's correctness depends on the relative timing of operations in concurrent tasks. Examples are lost updates on a shared counter and check-then-act sequences where state changes between the check and the act." },
      { question: "What is the difference between a data race and a race condition?", answer: "A data race is unsynchronized concurrent access to the same memory location where at least one access is a write; it's a memory-model violation and undefined behavior in C/C++. A race condition is a higher-level logic error about ordering. You can have a race condition with no data race, such as two individually atomic calls used in a non-atomic sequence." },
      { question: "Why isn't `count++` thread-safe?", answer: "It's a read-modify-write: load, add, store. Two threads can both load the same value and both store value+1, losing an update. Use an atomic increment or a lock." },
      { question: "What is a check-then-act race, and how do you fix it?", answer: "Checking a condition and then acting on it in separate steps, so another task can change the condition in between (lazy initialization, 'create if not exists', double-booking). Fix by making check and act a single atomic operation: a lock around both, compare-and-swap, `putIfAbsent`, `O_EXCL`, or a database unique constraint or conditional update." },
      { question: "What is a memory visibility problem?", answer: "One thread's write isn't seen by another thread, or is seen in a different order, because of CPU caches, store buffers, and compiler or CPU reordering. Without a happens-before relationship (locks, volatile, atomics, channel operations), the reader has no guarantee of seeing the write." },
      { question: "Can single-threaded JavaScript have race conditions?", answer: "Yes. There are no data races because only one callback runs at a time, but logical races happen whenever an async operation spans an `await`: two requests read the same state, both await, and both write based on stale values. The same applies to responses arriving out of order." },
      { question: "What strategies avoid race conditions without locks?", answer: "Don't share state (confinement to one thread), share only immutable data, use message passing (channels, actors, queues), use atomic operations and CAS, or push atomicity into the database with transactions and constraints." },
      { question: "How would you find a race condition that only shows up in production?", answer: "Use race detectors (Go `-race`, ThreadSanitizer) in CI and load tests, add logging with timestamps and thread IDs around the suspect state, write stress tests that run the code many times with random delays, and review code for shared mutable state accessed without synchronization. Look for check-then-act and read-modify-write patterns." },
      { question: "What does 'happens-before' mean in a memory model?", answer: "It's a partial ordering guaranteeing that if action A happens-before action B, B sees A's effects. It's established by program order within a thread and by synchronization between threads: unlock before lock of the same mutex, a volatile/atomic write before a read that observes it, a channel send before the matching receive, thread start and join." },
    ],
    prerequisites: ["processes-and-threads", "mutability-and-immutability"],
    relatedTopics: ["locks-and-deadlocks", "processes-and-threads", "async-and-event-driven-programming", "mutability-and-immutability", "distributed-locks-and-fencing"],
    keywords: ["concurrency", "parallelism", "race condition", "data race", "atomicity", "check-then-act", "lost update", "memory visibility", "happens-before", "volatile", "thread safety"],
  },
  {
    id: "locks-and-deadlocks",
    title: "Locks and Deadlocks",
    level: "advanced",
    description: "Tools that make threads take turns on shared data, and the ways they can get stuck forever.",
    explanation: `
A **lock** makes a section of code run by only one thread at a time. A thread
**acquires** the lock before touching shared data and **releases** it after.
Any other thread that tries to acquire it waits. The code between acquire and
release is the **critical section**.

Common kinds:

- **Mutex** (mutual exclusion): one holder at a time.
- **Semaphore**: a counter allowing up to N holders, used to limit concurrency
  (for example, at most 10 open database connections).
- **Read-write lock**: many readers at once, or one writer alone. Good for data
  that is read far more than it is written.

Locks introduce their own failure modes. A **deadlock** happens when threads
wait on each other in a cycle, so none can ever proceed. **Livelock** is when
threads keep reacting to each other and changing state, but none makes progress.
**Starvation** is when a thread waits indefinitely because others keep getting
the lock first.

For simple shared values, **atomic operations** such as **compare-and-swap
(CAS)** avoid locks altogether. Data structures built only on atomics are called
**lock-free**.
    `.trim(),
    analogy:
      "A mutex is a single-occupancy bathroom key. A semaphore is a parking lot with 10 spaces and a counter at the gate. A deadlock is two drivers on a one-lane bridge, each waiting for the other to back up. Livelock is two people in a corridor who keep stepping aside in the same direction.",
    examples: [
      {
        title: "Classic deadlock: two locks taken in opposite order (Python)",
        language: "python",
        code: `import threading

account_lock_a = threading.Lock()
account_lock_b = threading.Lock()

def transfer_a_to_b():
    with account_lock_a:
        with account_lock_b:      # waits for B...
            pass

def transfer_b_to_a():
    with account_lock_b:
        with account_lock_a:      # ...while this waits for A: deadlock
            pass`,
        walkthrough: [
          { code: "with account_lock_a:", explanation: "Thread 1 acquires lock A." },
          { code: "with account_lock_b:  (in transfer_b_to_a)", explanation: "Meanwhile thread 2 acquires lock B." },
          { code: "with account_lock_b:  (in transfer_a_to_b)", explanation: "Thread 1 now needs B, which thread 2 holds, so it waits." },
          { code: "with account_lock_a:  (in transfer_b_to_a)", explanation: "Thread 2 needs A, which thread 1 holds. Each waits for the other forever." },
        ],
      },
      {
        title: "Fix: always acquire locks in one global order",
        language: "python",
        code: `def transfer(source, target, amount):
    first, second = sorted([source, target], key=lambda account: account.id)
    with first.lock:
        with second.lock:
            source.balance -= amount
            target.balance += amount`,
        explanation:
          "Every thread locks the lower id first, so a cycle of waiting is impossible. This breaks the circular-wait condition.",
      },
      {
        title: "Compare-and-swap loop (Java)",
        language: "java",
        code: `AtomicInteger maxSeen = new AtomicInteger(Integer.MIN_VALUE);

void record(int value) {
    int current;
    do {
        current = maxSeen.get();
        if (value <= current) return;
    } while (!maxSeen.compareAndSet(current, value));  // retry if someone changed it
}`,
        explanation:
          "CAS writes the new value only if the variable still holds the value we read. If another thread changed it in between, CAS fails and we retry with the fresh value. No thread ever blocks.",
      },
    ],
    howItWorks: `
**How a mutex works.** Under the hood, a mutex is an atomic flag. Acquiring tries
an atomic CAS from "free" to "held". If that fails, the thread may spin briefly,
then ask the OS to sleep it (Linux futexes do this) until the holder releases.
Acquire and release also act as memory barriers, so writes made inside the
critical section are visible to the next thread that takes the lock.

**Semaphores** keep a count. \`acquire\` decrements it and blocks at zero;
\`release\` increments it and wakes a waiter. A semaphore with count 1 behaves
like a mutex but has no notion of an owner.

**The four Coffman conditions.** A deadlock can only happen if all four hold:
1. **Mutual exclusion**: a resource can be held by only one thread.
2. **Hold and wait**: a thread holds one resource while waiting for another.
3. **No preemption**: resources can't be forcibly taken away.
4. **Circular wait**: a cycle of threads each waiting on the next.

Break any one and deadlock is impossible. In practice: impose a **global lock
order** (breaks circular wait), acquire all locks at once or use \`tryLock\`
with a timeout and back off (breaks hold and wait), or keep critical sections
small and never call unknown code while holding a lock.

**Livelock** often comes from naive retry-on-conflict: both threads back off and
retry at the same moment, forever. Randomized backoff fixes it.
**Starvation** comes from unfair locks or priority scheduling; fair locks
(FIFO) trade throughput for guaranteed progress. **Priority inversion** is a
related problem: a low-priority thread holding a lock blocks a high-priority one.

**Lock-free programming.** CAS-based algorithms guarantee that *some* thread
always makes progress, even if others are paused. They avoid deadlock but are
hard to get right (the **ABA problem**: a value changes from A to B and back to
A, so CAS wrongly succeeds). Use existing lock-free structures from your
standard library rather than writing your own.
    `.trim(),
    diagram: `
 Deadlock (circular wait):

   Thread 1 --holds--> [Lock A]
      ^                    |
      |                 wanted by
   wanted by               v
   [Lock B] <--holds-- Thread 2

 Read-write lock:
   readers:  R R R R  (together)   |  writer: W (alone)
   a writer waits until all readers leave; readers wait while W holds it
    `.trim(),
    whyItExists: `
Threads that share mutable state need a way to make multi-step updates appear
atomic to everyone else. Hardware only provides atomicity for single words, so
locks build larger atomic sections on top of those primitives. Deadlocks,
livelock and starvation aren't separate features; they're the failure modes
that come with any mechanism that makes threads wait.
    `.trim(),
    whenToUse: `
- **Mutex** to protect an invariant across several fields (a balance and a
  transaction log, a map and its size).
- **Read-write lock** for read-heavy shared data like configuration or caches,
  after measuring that the mutex is actually contended.
- **Semaphore** to cap concurrent access to a limited resource: connections,
  file handles, outbound API calls.
- **Atomics/CAS** for single counters, flags, and reference swaps.
    `.trim(),
    whenNotToUse: `
- Don't lock data that isn't shared; confine it to one thread instead.
- Don't hold a lock while doing I/O, sleeping, or calling callbacks you don't
  control. That's how you get contention and surprise deadlocks.
- Don't reach for read-write locks by default; they cost more than a mutex and
  only pay off when reads dominate and critical sections are long.
- Don't write your own lock-free data structures in production unless you're an
  expert with a strong reason; use the standard library's concurrent collections.
- For locks across machines, a local mutex is useless; you need a distributed
  lock with fencing tokens, or better, a design that avoids one.
    `.trim(),
    commonMistakes: [
      "Acquiring the same pair of locks in different orders in different code paths, creating a deadlock that only appears under load.",
      "Forgetting to release a lock when an exception is thrown. Use `with`, `try/finally`, `defer`, or RAII guards so release always happens.",
      "Holding a lock during slow work (network calls, disk I/O), serializing the whole program behind it.",
      "Re-acquiring a non-reentrant mutex in the same thread (for example, a locked method calling another locked method) and deadlocking on yourself.",
      "Protecting writes with a lock but reading the same data without it, which still allows torn or stale reads.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use a semaphore to limit a pool of 20 worker threads so that at most 3 of them are inside a simulated 'download' function at any moment. Log entries and exits to prove the limit holds." },
      { difficulty: "Medium", prompt: "Implement the dining philosophers problem with 5 threads and 5 locks. Show that the naive version deadlocks, then fix it two different ways (lock ordering, and a semaphore allowing only 4 philosophers to sit)." },
      { difficulty: "Hard", prompt: "Implement a lock-free stack using compare-and-swap on the head pointer (Java `AtomicReference` or C++ `std::atomic`). Explain the ABA problem as it applies to your stack and how a tagged pointer or garbage collection avoids it." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a mutex and a semaphore?", answer: "A mutex allows one holder and has ownership: the thread that locked it must unlock it. A semaphore holds a count, allows up to N concurrent holders, and has no owner, so any thread can release. Semaphores are for limiting concurrency or signalling; mutexes are for mutual exclusion." },
      { question: "What are the four conditions for deadlock?", answer: "The Coffman conditions: mutual exclusion, hold and wait, no preemption, and circular wait. All four must hold simultaneously; preventing any one of them prevents deadlock." },
      { question: "How do you prevent deadlocks in practice?", answer: "Acquire locks in a consistent global order, hold as few locks as possible for as short a time as possible, never call external code while holding a lock, use tryLock with timeouts and back off, or redesign to avoid shared locks (message passing, single-owner data)." },
      { question: "What is the difference between deadlock, livelock and starvation?", answer: "Deadlock: threads are blocked waiting on each other and nothing changes. Livelock: threads are active and keep changing state in response to each other, but none progresses. Starvation: the system progresses, but one thread never gets the resource because others keep winning." },
      { question: "When is a read-write lock better than a mutex?", answer: "When reads vastly outnumber writes and read critical sections are long enough that letting them run in parallel matters. For short critical sections or write-heavy data, the extra bookkeeping makes it slower than a plain mutex, and writer starvation is a risk with some implementations." },
      { question: "What is compare-and-swap?", answer: "An atomic CPU instruction: 'if this memory location still holds expected, set it to new and report success; otherwise report failure'. It's the building block for atomics, lock-free data structures, and the fast path of mutexes. Typical use is a retry loop: read, compute, CAS, retry on failure." },
      { question: "What is the ABA problem?", answer: "A thread reads value A, gets paused, another thread changes it to B and then back to A, and the first thread's CAS succeeds even though the state changed in between. In a lock-free stack this can corrupt the structure. Fixes include version-tagged pointers, hazard pointers, or relying on a GC that won't reuse a node's memory while it's referenced." },
      { question: "What is a reentrant lock?", answer: "A lock the same thread can acquire multiple times without deadlocking itself; it keeps a hold count and is released when the count returns to zero. Java's `synchronized` and `ReentrantLock` and Python's `RLock` are reentrant; Python's `Lock` and Go's `sync.Mutex` are not." },
      { question: "What is priority inversion?", answer: "A high-priority thread waits on a lock held by a low-priority thread, while medium-priority threads preempt the low-priority one, so the high-priority thread is effectively blocked by unrelated work. Priority inheritance temporarily raises the lock holder's priority to fix it. It famously affected the Mars Pathfinder lander." },
      { question: "Is lock-free always faster than using locks?", answer: "No. Lock-free algorithms avoid blocking and deadlock, but under heavy contention CAS retries waste CPU and cache-line bouncing hurts. An uncontended mutex is very cheap. Lock-free shines when threads must not block (real-time, signal handlers) or contention is moderate; measure before choosing." },
    ],
    prerequisites: ["concurrency-and-race-conditions", "processes-and-threads"],
    relatedTopics: ["concurrency-and-race-conditions", "processes-and-threads", "distributed-locks-and-fencing", "async-and-event-driven-programming"],
    keywords: ["lock", "mutex", "semaphore", "read-write lock", "deadlock", "coffman conditions", "livelock", "starvation", "lock ordering", "compare and swap", "cas", "lock-free", "atomic", "aba problem"],
  },
  {
    id: "async-and-event-driven-programming",
    title: "Async and Event-Driven Programming",
    level: "advanced",
    description: "Handling many slow operations at once by reacting to events instead of blocking while you wait.",
    explanation: `
Most programs spend a lot of time waiting: for a network response, a disk read,
a database query, a user click. With **blocking I/O**, the thread that asked
simply stops until the answer arrives. To serve 10,000 clients that way, you
need 10,000 threads.

**Non-blocking I/O** starts the operation and returns immediately. The program
gets notified later when the result is ready. An **event loop** sits at the
centre: it waits for any of many events (data arrived, timer fired, connection
opened), then runs the code registered for that event, then waits again. One
thread can juggle thousands of connections this way.

The way programmers write this code has evolved:

1. **Callbacks**: pass a function to call when the operation completes. Simple,
   but nesting gets deep and error handling scatters.
2. **Promises / futures**: an object representing a result that will arrive
   later, which you can chain and combine.
3. **async/await**: syntax that lets you write promise-based code top to bottom,
   as if it were blocking, while the function actually suspends at each
   \`await\` and frees the thread.

Under async/await sit **coroutines**: functions that can pause partway through
and resume later with their local state intact.

Async helps with **I/O-bound** work (lots of waiting). It does nothing for
**CPU-bound** work; a long computation still occupies the thread and blocks
every other task on the loop.
    `.trim(),
    analogy:
      "A blocking waiter takes one table's order, walks to the kitchen and stands there until the food is ready. An event-driven waiter hands the order to the kitchen, serves other tables, and goes back when the kitchen rings the bell. One waiter can handle a whole restaurant, unless one table asks them to personally cook a five-course meal.",
    examples: [
      {
        title: "Callbacks to promises to async/await (JavaScript)",
        language: "javascript",
        code: `// 1. Callbacks: nesting grows with each step
readFile("user.json", (error, userText) => {
  if (error) return handle(error);
  fetchOrders(JSON.parse(userText).id, (error, orders) => {
    if (error) return handle(error);
    render(orders);
  });
});

// 2. Promises: a flat chain with one error handler
readFileAsync("user.json")
  .then((userText) => fetchOrdersAsync(JSON.parse(userText).id))
  .then(render)
  .catch(handle);

// 3. async/await: reads like sequential code
async function showOrders() {
  try {
    const userText = await readFileAsync("user.json");
    const orders = await fetchOrdersAsync(JSON.parse(userText).id);
    render(orders);
  } catch (error) {
    handle(error);
  }
}`,
        walkthrough: [
          { code: "readFile(\"user.json\", (error, userText) => { ... })", explanation: "Starts the read and returns at once. The callback runs later, when the event loop sees the read is done." },
          { code: ".then((userText) => fetchOrdersAsync(...))", explanation: "Returning a promise from .then makes the chain wait for it before the next step." },
          { code: ".catch(handle);", explanation: "One handler catches a failure from any step above it." },
          { code: "const userText = await readFileAsync(\"user.json\");", explanation: "Suspends showOrders until the promise settles. The thread is free to run other callbacks meanwhile." },
        ],
      },
      {
        title: "Concurrency on one thread: 3 requests in ~1 second, not 3 (Python)",
        language: "python",
        code: `import asyncio
import time

async def fetch(name):
    await asyncio.sleep(1)   # stands in for a network call
    return name

async def main():
    started = time.perf_counter()
    results = await asyncio.gather(fetch("a"), fetch("b"), fetch("c"))
    print(results, round(time.perf_counter() - started, 1))  # ['a', 'b', 'c'] 1.0

asyncio.run(main())`,
        explanation:
          "All three coroutines wait at the same time. Replace `await asyncio.sleep(1)` with `time.sleep(1)` (a blocking call) and the total becomes 3 seconds, because the loop can't run anything else while blocked.",
      },
    ],
    howItWorks: `
**The OS side.** Non-blocking sockets plus a readiness API (\`epoll\` on Linux,
\`kqueue\` on BSD/macOS, IOCP on Windows, \`io_uring\` for newer Linux) let one
thread ask "tell me which of these 10,000 sockets has data". The event loop
calls that API, gets a list of ready events, and dispatches each to its handler.

**The loop.** Roughly:
1. Run any ready callbacks or resumable tasks.
2. Ask the OS which I/O is ready (waiting until something is, or until the next
   timer is due).
3. Queue the handlers for ready I/O and expired timers, and repeat.

Node.js uses libuv for this, with a thread pool for operations the OS can't do
asynchronously (some file system calls, DNS lookups, crypto).

**Coroutines.** An \`async\` function compiles to a state machine (or a
suspendable frame). Each \`await\` is a point where it saves its locals and
returns control to the loop. When the awaited future completes, the loop resumes
the coroutine from that point. This is **cooperative** scheduling: a task only
gives up the thread at an \`await\`.

**Why CPU-bound work hurts.** Nothing preempts a running callback. A 2-second
JSON parse or image resize stalls every other request on that loop for 2 seconds.
Move such work to a worker thread, process pool, or separate service.

**Function colouring.** In most languages, async functions can only be awaited
from other async functions, so async tends to spread up the call stack. Go and
Java's virtual threads take a different route: blocking-style code on cheap
threads, with the runtime doing the non-blocking I/O underneath.
    `.trim(),
    diagram: `
 Blocking (thread per request):     Event loop (one thread):

 T1: [work][ wait.......][work]      loop: [A work][B work][C work] -> poll
 T2: [work][ wait.......][work]            ...I/O for A,B,C in flight...
 T3: [work][ wait.......][work]      loop: [A resume][C resume][B resume]

        +------------------------------------+
        |              Event loop            |
        |  run ready tasks -> poll OS for    |
        |  ready I/O + timers -> queue their |
        |  handlers -> repeat                |
        +------------------------------------+
              ^                     |
     I/O done |                     | start non-blocking I/O
              |                     v
        [ epoll / kqueue / IOCP / thread pool ]
    `.trim(),
    whyItExists: `
Thread-per-connection servers ran into the "C10K problem": each OS thread costs
memory and scheduling overhead, so tens of thousands of mostly idle connections
became expensive. Event-driven designs (nginx, Node.js, Redis) showed that one
thread can serve huge numbers of connections when it never blocks. Callbacks
made that possible; promises and async/await made it readable. UIs have the same
need: the UI thread must never block, or the app freezes.
    `.trim(),
    whenToUse: `
- Servers and clients with many concurrent, mostly idle connections: web
  servers, proxies, chat, websockets.
- Code that fans out to several I/O calls and can run them concurrently
  (several API calls at once instead of one after another).
- UI programming (browsers, mobile, desktop), where the main thread must stay
  responsive.
- Pipelines driven by external events: message consumers, file watchers, timers.
    `.trim(),
    whenNotToUse: `
- CPU-bound work (number crunching, image processing, compression): use threads,
  processes or Web Workers for real parallelism.
- Simple scripts or low-concurrency services, where blocking code is easier to
  write, read and debug.
- When a library you depend on only offers blocking calls; wrapping them in
  async without a thread pool still blocks the loop.
- In Go or Java 21+, plain blocking code on goroutines or virtual threads often
  gives the same scalability without async syntax.
    `.trim(),
    commonMistakes: [
      "Calling a blocking function (`time.sleep`, synchronous file or HTTP calls, heavy loops) inside async code and freezing the whole event loop.",
      "Awaiting independent operations one after another instead of starting them together with `Promise.all` / `asyncio.gather`.",
      "Forgetting to `await` a promise or coroutine, so errors vanish and code continues before the work finishes.",
      "Assuming async code is free of races because it's single-threaded. State can change at every `await`.",
      "Starting unbounded numbers of concurrent requests (thousands of `fetch` calls at once) and overwhelming the downstream service; limit concurrency with a semaphore or pool.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that fetches 5 URLs (or simulated delays) sequentially with await, then rewrite it to run them concurrently. Measure and compare the total time." },
      { difficulty: "Medium", prompt: "Take a callback-based function such as Node's `fs.readFile` or a `setTimeout` delay and wrap it in a promise yourself, then use it with async/await, including error handling." },
      { difficulty: "Hard", prompt: "Build a tiny event loop in Python using generators: tasks `yield` a sleep duration, and the loop keeps a priority queue of (wake_time, task), always resuming the earliest. Run three tasks that print interleaved output." },
    ],
    interviewQuestions: [
      { question: "What is the difference between blocking and non-blocking I/O?", answer: "Blocking I/O suspends the calling thread until the operation completes. Non-blocking I/O returns immediately, either with data if ready or an indication that it isn't, and the program is notified later through readiness or completion events. Non-blocking lets one thread manage many operations." },
      { question: "What is an event loop?", answer: "A loop that repeatedly waits for events (I/O readiness, timers, messages) and dispatches the callback or resumes the task associated with each one. It provides concurrency on a single thread, as long as no handler blocks or runs long." },
      { question: "How does async/await relate to promises and coroutines?", answer: "async/await is syntax over promises (JS) or futures/awaitables (Python, C#, Rust). An async function is a coroutine compiled into a state machine; each await suspends it until the awaited future completes, then the event loop resumes it. It's the same model as promise chains, written sequentially." },
      { question: "When does async improve performance, and when doesn't it?", answer: "It improves throughput for I/O-bound work, where tasks mostly wait, by overlapping the waits without many threads. It doesn't help CPU-bound work, because computation still occupies the thread and blocks the loop; use parallel threads or processes for that." },
      { question: "What happens if you call a blocking function inside an async handler?", answer: "The event loop thread is blocked for the duration, so no other tasks, timers or I/O handlers run. Latency rises for every request sharing that loop. Run blocking code in a thread pool (`run_in_executor`, `worker_threads`) or use an async-native library." },
      { question: "What is callback hell, and how do promises fix it?", answer: "Deeply nested callbacks where each async step's continuation is passed into the previous one, with error handling repeated at every level. Promises flatten the nesting into chains, propagate errors to a single handler, and let you compose operations (all, race, any)." },
      { question: "What is the difference between concurrency with async and parallelism with threads?", answer: "Async interleaves many tasks on one thread, switching only at await points (cooperative). Threads can run simultaneously on multiple cores and are preempted by the OS. Async gives concurrency for waiting; threads or processes give parallelism for computing." },
      { question: "What is 'function colouring'?", answer: "In languages with async/await, async functions can only be awaited from other async functions, so the code splits into two colours and making one deep function async forces changes all the way up. Go and Java virtual threads avoid it by letting ordinary blocking code run on cheap threads." },
      { question: "How do you limit concurrency in async code?", answer: "Use a semaphore (`asyncio.Semaphore`, a p-limit style helper) around the operation, a fixed-size worker pool reading from a queue, or batching. This protects downstream services and avoids exhausting sockets or memory." },
      { question: "How does Node.js handle file I/O if the OS doesn't support truly async file operations?", answer: "libuv runs those operations on a small internal thread pool (4 threads by default, configurable via UV_THREADPOOL_SIZE) and posts the completion back to the event loop. Network I/O uses the OS readiness APIs (epoll, kqueue, IOCP) directly." },
    ],
    prerequisites: ["processes-and-threads", "concurrency-and-race-conditions", "functions-and-parameters"],
    relatedTopics: ["event-loop", "promises", "async-await", "processes-and-threads", "concurrency-and-race-conditions", "queues"],
    keywords: ["async", "await", "event loop", "non-blocking", "callbacks", "promises", "futures", "coroutines", "epoll", "io-bound", "cpu-bound", "asyncio", "libuv"],
  },
  {
    id: "how-compilers-work",
    title: "How Compilers Work",
    level: "advanced",
    description: "The pipeline that turns source code text into something a machine can run.",
    explanation: `
A **compiler** translates a program from one language (your source code) into
another (machine code, bytecode, or even another high-level language). It does
this in stages, each turning one representation into a slightly lower-level one:

1. **Lexing** splits raw text into **tokens**: keywords, names, numbers,
   operators.
2. **Parsing** checks the tokens follow the grammar and builds an **abstract
   syntax tree (AST)**, a tree showing the program's structure.
3. **Semantic analysis** checks meaning: are names declared, do types match,
   is \`return\` inside a function?
4. The AST is lowered to an **intermediate representation (IR)**, a simple,
   machine-independent form that's easy to analyze.
5. **Optimization** rewrites the IR to run faster or smaller without changing
   behaviour.
6. **Code generation** turns IR into machine instructions for a specific CPU,
   choosing registers and instruction sequences.
7. **Linking** combines compiled files and libraries into one executable,
   resolving references between them.

An **interpreter** runs the program directly instead of producing an
executable, usually by walking the AST or executing bytecode. A **JIT
(just-in-time) compiler** combines both: it starts interpreting, watches which
code runs often, and compiles that hot code to machine code while the program
runs.
    `.trim(),
    analogy:
      "Translating a book: first you split it into words (lexing), then work out each sentence's grammar (parsing), check it makes sense (semantic analysis), write a rough literal translation (IR), polish the wording (optimization), then typeset it for a specific printer (code generation) and bind the chapters into one volume (linking). An interpreter is a live translator reading aloud sentence by sentence; a JIT is one who starts reading aloud, then writes down translations of passages that keep coming up.",
    examples: [
      {
        title: "One line through the pipeline",
        language: "text",
        code: `Source:   total = price * 2 + tax;

Tokens:   IDENT(total) EQUALS IDENT(price) STAR NUMBER(2) PLUS IDENT(tax) SEMICOLON

AST:          Assign
             /      \\
         total      Add
                   /    \\
               Multiply  tax
               /     \\
           price      2

IR (three-address code):
          t1 = price * 2
          t2 = t1 + tax
          total = t2

Optimized: t1 = price << 1      (strength reduction, valid for integers)
          total = t1 + tax

x86-64:   mov  eax, [price]
          shl  eax, 1
          add  eax, [tax]
          mov  [total], eax`,
        walkthrough: [
          { code: "Tokens: IDENT(total) EQUALS ...", explanation: "The lexer drops whitespace and classifies each piece of text." },
          { code: "AST: Assign(total, Add(Multiply(price, 2), tax))", explanation: "The parser applies precedence rules: * binds tighter than +, so Multiply sits lower in the tree." },
          { code: "t1 = price * 2", explanation: "IR breaks expressions into simple steps with temporaries, which is easy to analyze and optimize." },
          { code: "t1 = price << 1", explanation: "An optimization pass replaces a multiply by 2 with a cheaper shift." },
          { code: "mov eax, [price] ...", explanation: "Code generation picks real registers and CPU instructions." },
        ],
      },
      {
        title: "A tiny tree-walking interpreter (Python)",
        language: "python",
        code: `def evaluate(node, variables):
    kind = node[0]
    if kind == "num":
        return node[1]
    if kind == "var":
        return variables[node[1]]
    left = evaluate(node[1], variables)
    right = evaluate(node[2], variables)
    if kind == "add":
        return left + right
    if kind == "mul":
        return left * right
    raise ValueError(f"unknown node {kind}")

tree = ("add", ("mul", ("var", "price"), ("num", 2)), ("var", "tax"))
print(evaluate(tree, {"price": 10, "tax": 3}))   # 23`,
        explanation:
          "This skips code generation entirely: it executes the AST directly. Real interpreters like CPython compile to bytecode first because a flat instruction list is faster to execute than recursively walking a tree.",
      },
    ],
    howItWorks: `
**Lexer.** Usually a finite-state machine (often described with regular
expressions). It reads characters and emits tokens with their positions, so
later errors can point at the right line.

**Parser.** Uses a grammar to build the tree. Hand-written **recursive descent**
parsers (one function per grammar rule) are common in production compilers
(GCC, Clang, Go, V8) because they give good error messages. Generated parsers
(LR, LALR via yacc/bison) are the other classic approach. Syntax errors are
reported here.

**Semantic analysis.** Walks the AST with a **symbol table** that maps names to
declarations in each scope, resolves which variable each name refers to, and
performs **type checking**. Type errors and undeclared names come from here.

**IR.** Compilers lower the AST to an IR such as three-address code or **SSA**
(static single assignment, where every variable is assigned exactly once). SSA
makes data flow explicit, which makes many optimizations simple. LLVM IR is a
widely used SSA IR shared by Clang, Rust, Swift and others.

**Optimization.** Typical passes: constant folding (\`3 * 4\` → \`12\`), dead
code elimination, common subexpression elimination, inlining, loop-invariant
code motion, and vectorization. Passes must preserve observable behaviour as
the language spec defines it, which is why undefined behaviour in C gives the
optimizer so much freedom.

**Code generation.** Instruction selection maps IR to CPU instructions,
**register allocation** decides which values live in the CPU's few registers
versus memory, and instruction scheduling orders them for the pipeline.

**Linking.** Each source file becomes an object file with unresolved symbols
("I call \`printf\` but don't define it"). The linker merges object files and
libraries, resolves symbols to addresses, and writes the executable. Static
linking copies library code in; dynamic linking leaves references resolved at
load time.

**JITs.** V8 (JavaScript), HotSpot (Java) and others start by interpreting
bytecode while profiling. Hot functions are compiled with optimizations based on
observed types (\"this argument is always an integer\"). If an assumption later
breaks, they **deoptimize** back to the interpreter.
    `.trim(),
    diagram: `
 source text
     |  lexer
     v
 tokens
     |  parser
     v
 AST  --semantic analysis (symbols, types)-->  annotated AST
     |  lowering
     v
 IR  --optimization passes-->  optimized IR
     |  code generation
     v
 object files (.o)  +  libraries
     |  linker
     v
 executable

 Interpreter: AST/bytecode --> execute directly
 JIT:         bytecode --> interpret + profile --> hot code --> machine code
    `.trim(),
    whyItExists: `
CPUs only understand their own machine instructions, and writing those by hand
is slow and error-prone. Compilers let people write in languages built for
humans while still producing fast native code. The staged design exists because
each stage is a manageable problem on its own, and a shared IR lets many source
languages reuse the same optimizer and many CPU back ends.
    `.trim(),
    whenToUse: `
Knowing the pipeline pays off when you:
- read compiler error messages and need to know which stage produced them,
- write parsers for config formats, query languages, or DSLs,
- build linters, formatters, code mods, or bundlers, which all work on ASTs
  (Babel, ESLint, Prettier, TypeScript),
- reason about performance: inlining, why a JIT deoptimized, why undefined
  behaviour "changed" your program,
- debug linker errors like "undefined reference" or duplicate symbols.
    `.trim(),
    whenNotToUse: `
- Don't write a full compiler or parser when a data format (JSON, YAML) or an
  existing parser library will do.
- Don't parse real languages with regular expressions; nested structure needs a
  real parser.
- Don't hand-optimize code in ways the compiler already does (replacing \`* 2\`
  with \`<< 1\`); write clear code and profile.
    `.trim(),
    commonMistakes: [
      "Thinking 'compiled vs interpreted' is a property of the language. It's a property of the implementation; Python has CPython (bytecode interpreter) and PyPy (JIT), and Java is compiled to bytecode then JIT-compiled.",
      "Confusing compile errors with linker errors. 'Undefined reference to foo' means the code compiled but no object file or library provided `foo`.",
      "Assuming the compiler executes your C code exactly as written. With optimizations on, it can reorder, remove, or merge operations, and undefined behaviour lets it assume impossible cases never happen.",
      "Trying to parse nested or recursive syntax with regex instead of writing a small recursive-descent parser.",
      "Believing interpreted code is always slow. A modern JIT can match or beat ahead-of-time compiled code in hot loops because it optimizes for observed runtime types.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "By hand, write the tokens and draw the AST for `if (count > 10) { total = total + count * 2; }`." },
      { difficulty: "Medium", prompt: "Write a lexer and recursive-descent parser for arithmetic expressions with +, -, *, / and parentheses that respects precedence, builds an AST, and evaluates it. Report syntax errors with the column number." },
      { difficulty: "Hard", prompt: "Extend your expression language with variables and `let` statements, then add a constant-folding pass over the AST and a compiler that emits instructions for a small stack-based virtual machine you also write. Compare its speed to the tree-walking evaluator." },
    ],
    interviewQuestions: [
      { question: "What are the main phases of a compiler?", answer: "Lexing (text to tokens), parsing (tokens to AST), semantic analysis (name resolution, type checking), lowering to IR, optimization, code generation (instruction selection, register allocation), and linking (combining object files and libraries into an executable)." },
      { question: "What is the difference between a compiler and an interpreter?", answer: "A compiler translates the whole program ahead of time into another form (usually machine code) that runs later. An interpreter executes the program directly, typically from an AST or bytecode. Many systems mix both: compile to bytecode, then interpret or JIT it." },
      { question: "What is an AST, and why do tools use it?", answer: "An abstract syntax tree represents a program's structure with nodes for constructs (calls, assignments, operators) and without incidental syntax like parentheses and semicolons. Compilers, linters, formatters, and refactoring tools work on ASTs because structure is far easier to analyze and transform than raw text." },
      { question: "What is a JIT compiler, and what are its trade-offs?", answer: "It compiles code to machine code at runtime, usually only hot paths, using profiling data such as observed types. Benefits: speculative optimizations an AOT compiler can't make, and portable bytecode. Costs: warm-up time, memory for the compiler and code cache, and deoptimization when speculative assumptions fail." },
      { question: "What is SSA form?", answer: "Static Single Assignment: an IR where each variable is assigned exactly once, with phi functions merging values where control flow joins. It makes def-use chains explicit, which simplifies optimizations like constant propagation, dead code elimination, and register allocation." },
      { question: "What does a linker do?", answer: "It takes object files with unresolved symbols plus libraries, resolves each symbol to its definition, lays out code and data sections, patches addresses (relocation), and produces an executable or shared library. Dynamic linking defers some resolution to load or first-call time." },
      { question: "Give examples of common compiler optimizations.", answer: "Constant folding and propagation, dead code elimination, inlining, common subexpression elimination, loop-invariant code motion, loop unrolling, strength reduction, tail-call optimization, and auto-vectorization." },
      { question: "Why does undefined behaviour in C matter to the optimizer?", answer: "The compiler may assume undefined behaviour never happens, such as signed overflow or dereferencing null. That lets it remove checks or reorder code based on those assumptions, so a program with UB can behave very differently at -O2 than at -O0." },
      { question: "Where do type errors versus syntax errors come from?", answer: "Syntax errors come from the parser: the token sequence doesn't match the grammar. Type errors come from semantic analysis: the code is grammatically valid but violates typing rules, such as adding a string to a struct or calling a function with the wrong arguments." },
      { question: "What is bytecode, and why do runtimes like the JVM and CPython use it?", answer: "Bytecode is a compact, platform-independent instruction set for a virtual machine. It's quicker to execute than walking an AST, can be cached to skip re-parsing, ships across platforms unchanged, and gives a JIT a convenient input to profile and compile." },
    ],
    prerequisites: ["how-code-runs", "type-systems"],
    relatedTopics: ["how-code-runs", "type-systems", "regular-expressions", "recursion", "programming-paradigms"],
    keywords: ["compiler", "interpreter", "jit", "lexer", "tokenizer", "parser", "ast", "abstract syntax tree", "semantic analysis", "ir", "ssa", "llvm", "optimization", "code generation", "linker", "bytecode"],
  },
  {
    id: "bitwise-operations",
    title: "Bitwise Operations",
    level: "advanced",
    description: "Working directly with the individual bits of an integer: masks, flags, shifts and classic tricks.",
    explanation: `
Integers are stored as binary: a row of bits, each 0 or 1. **Bitwise
operators** work on those bits one position at a time:

- **AND** (\`&\`): 1 only if both bits are 1. Used to **test** or **clear** bits.
- **OR** (\`|\`): 1 if either bit is 1. Used to **set** bits.
- **XOR** (\`^\`): 1 if the bits differ. Used to **toggle** bits.
- **NOT** (\`~\`): flips every bit.
- **Left shift** (\`<<\`): moves bits left, filling with 0. \`x << n\` is
  \`x * 2^n\` while it doesn't overflow.
- **Right shift** (\`>>\`): moves bits right. \`x >> n\` is \`x / 2^n\`
  rounded toward negative infinity for signed values on most platforms.

A **mask** is a number with 1s in the positions you care about. Combined with
AND, OR and XOR it lets you read or change specific bits. This is how
**flags** work: many on/off settings packed into one integer, like Unix file
permissions.

Negative integers are stored using **two's complement**: to negate a number,
flip all its bits and add 1. This makes addition work the same way for positive
and negative numbers.
    `.trim(),
    analogy:
      "Think of a row of light switches. A mask is a stencil laid over the switches. OR with the stencil turns on the switches it exposes, AND turns off everything it doesn't expose, and XOR flips the exposed ones. Shifting slides the whole row of switch positions left or right.",
    examples: [
      {
        title: "Flags with masks (C)",
        language: "c",
        code: `#define FLAG_READ    (1u << 0)   /* 0b001 */
#define FLAG_WRITE   (1u << 1)   /* 0b010 */
#define FLAG_EXECUTE (1u << 2)   /* 0b100 */

unsigned int permissions = 0;
permissions |= FLAG_READ | FLAG_WRITE;     /* set:    0b011 */
permissions &= ~FLAG_WRITE;                /* clear:  0b001 */
permissions ^= FLAG_EXECUTE;               /* toggle: 0b101 */

if (permissions & FLAG_EXECUTE) {          /* test: non-zero means set */
    puts("can execute");
}`,
        walkthrough: [
          { code: "#define FLAG_WRITE (1u << 1)", explanation: "Shifting 1 left by 1 gives a mask with only bit 1 set (binary 010)." },
          { code: "permissions |= FLAG_READ | FLAG_WRITE;", explanation: "OR turns on bits 0 and 1 and leaves every other bit as it was." },
          { code: "permissions &= ~FLAG_WRITE;", explanation: "~FLAG_WRITE is all 1s except bit 1. AND with it clears only that bit." },
          { code: "permissions ^= FLAG_EXECUTE;", explanation: "XOR flips bit 2: off becomes on, on becomes off." },
          { code: "if (permissions & FLAG_EXECUTE)", explanation: "AND with the mask isolates bit 2. The result is non-zero exactly when the bit is set." },
        ],
      },
      {
        title: "Classic tricks (Python)",
        language: "python",
        code: `def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0     # a power of two has exactly one 1 bit

def count_set_bits(n):                      # Kernighan's method, for n >= 0
    count = 0
    while n:
        n &= n - 1                          # clears the lowest set bit
        count += 1
    return count

def lowest_set_bit(n):
    return n & -n                           # two's complement isolates it

a, b = 6, 9
a ^= b; b ^= a; a ^= b                      # XOR swap: a=9, b=6 (curiosity, not practice)

print(is_power_of_two(64), count_set_bits(0b1011), lowest_set_bit(12))  # True 3 4`,
        explanation:
          "`n - 1` flips the lowest 1 bit to 0 and every 0 below it to 1, so `n & (n - 1)` removes the lowest set bit. Modern languages also have built-ins: `int.bit_count()` in Python 3.10+, `Integer.bitCount` in Java, `__builtin_popcount` in GCC/Clang.",
      },
    ],
    howItWorks: `
**Bit positions.** In an 8-bit value, bit 0 is the least significant (worth 1)
and bit 7 the most significant (worth 128). \`1 << k\` builds a mask with only
bit k set.

**Two's complement.** For an n-bit signed integer, the top bit has weight
\`-2^(n-1)\` instead of \`+2^(n-1)\`. So in 8 bits, \`11111111\` is -1 and
\`10000000\` is -128. Negation is \`~x + 1\`. This gives one zero, an asymmetric
range (-128 to 127), and lets the CPU use the same adder circuit for signed and
unsigned values.

**Shifts.**
- Left shift multiplies by powers of two but discards bits shifted off the top.
  In C, shifting a signed value into or past the sign bit, or shifting by a count
  greater than or equal to the bit width, is undefined behaviour.
- Right shift on unsigned values fills with 0 (**logical** shift). On signed
  values most platforms copy the sign bit (**arithmetic** shift), so -8 >> 1 is
  -4. Java and JavaScript have \`>>>\` for an explicit logical right shift.

**Language quirks.** JavaScript converts operands of bitwise operators to 32-bit
signed integers, so \`2 ** 32 | 0\` is 0. Python integers have unlimited size,
so \`~5\` is -6 and there's no overflow; mask with \`& 0xFFFFFFFF\` to emulate a
fixed width.

**Precedence.** In C-family languages \`&\`, \`^\` and \`|\` bind more loosely
than \`==\`, so \`x & 1 == 0\` means \`x & (1 == 0)\`. Use parentheses.
    `.trim(),
    diagram: `
        bit:  7 6 5 4 3 2 1 0
 x      =     0 0 1 0 1 1 0 0   (44)
 mask   =     0 0 0 0 1 0 0 0   (1 << 3)

 x & mask  =  0 0 0 0 1 0 0 0   test bit 3  -> non-zero, so it's set
 x | 0x01  =  0 0 1 0 1 1 0 1   set bit 0
 x & ~mask =  0 0 1 0 0 1 0 0   clear bit 3
 x ^ mask  =  0 0 1 0 0 1 0 0   toggle bit 3
 x << 1    =  0 1 0 1 1 0 0 0   (88)
 x >> 2    =  0 0 0 0 1 0 1 1   (11)

 Two's complement, 8-bit:  5 = 00000101
                          ~5 = 11111010
                       ~5 + 1 = 11111011 = -5
    `.trim(),
    whyItExists: `
Hardware works in bits, and bitwise instructions are among the cheapest a CPU
has. They let you pack many booleans into one word, read and write hardware
registers and binary file formats, and implement hashing, compression,
cryptography and graphics efficiently. Two's complement exists because it makes
signed arithmetic use the same circuits as unsigned arithmetic.
    `.trim(),
    whenToUse: `
- Flags and permission sets (file modes, feature toggles, options passed to
  system calls).
- Parsing and writing binary formats and network protocols (headers, checksums,
  packed fields).
- Embedded and driver code that reads or writes hardware registers.
- Compact data structures: bitsets, Bloom filters, chess bitboards.
- Hashing, random number generators, and algorithm problems over subsets
  (iterating all subsets of n items as the numbers 0 to 2^n - 1).
    `.trim(),
    whenNotToUse: `
- Don't replace \`* 2\` or \`/ 4\` with shifts for speed; compilers already do
  this, and the shift version is less clear (and wrong for negative division
  in many languages).
- Don't use the XOR swap in real code; a temporary variable is clearer and as
  fast, and XOR swap zeroes the value if both names refer to the same location.
- Don't pack flags into an int in high-level code when an enum set, a list of
  booleans or a small object would be more readable and the space doesn't matter.
    `.trim(),
    commonMistakes: [
      "Forgetting precedence: `if (flags & MASK == MASK)` parses as `flags & (MASK == MASK)`. Write `(flags & MASK) == MASK`.",
      "Confusing logical and bitwise operators: `&&` vs `&`, `||` vs `|`, and `!` vs `~`.",
      "Shifting a 32-bit value by 32 or more bits, or shifting `1` (a signed int) into the sign bit in C; both are undefined. Use `1u` or `1ull` for high bits.",
      "Forgetting that JavaScript bitwise operators truncate numbers to 32-bit signed integers.",
      "Assuming right shift of a negative number is the same as division: -7 >> 1 is -4 (rounds toward negative infinity), while -7 / 2 in C or Java is -3.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write functions `set_bit(n, k)`, `clear_bit(n, k)`, `toggle_bit(n, k)` and `is_bit_set(n, k)`, and test them on several values." },
      { difficulty: "Medium", prompt: "Given an array where every number appears twice except one, find the single number in O(n) time and O(1) space using XOR. Then explain why it works." },
      { difficulty: "Hard", prompt: "Print every subset of a list of n items by iterating the integers 0 to 2^n - 1 and using bit k to decide whether item k is included. Then write a function that returns the next larger integer with the same number of set bits (Gosper's hack)." },
    ],
    interviewQuestions: [
      { question: "How do you check if a number is a power of two?", answer: "`n > 0 && (n & (n - 1)) == 0`. A power of two has exactly one set bit; subtracting 1 clears it and sets all lower bits, so the AND is zero only for powers of two." },
      { question: "How do you set, clear, toggle and test bit k?", answer: "Set: `n | (1 << k)`. Clear: `n & ~(1 << k)`. Toggle: `n ^ (1 << k)`. Test: `(n >> k) & 1` or `(n & (1 << k)) != 0`." },
      { question: "What is two's complement and why is it used?", answer: "A signed integer encoding where the top bit has negative weight; -x is `~x + 1`. It has a single zero, makes addition and subtraction identical to unsigned arithmetic at the bit level, and so needs no special hardware for signed numbers." },
      { question: "What is the difference between logical and arithmetic right shift?", answer: "Logical shift fills vacated high bits with 0 and is used for unsigned values. Arithmetic shift copies the sign bit, preserving the sign of negative numbers. Java and JavaScript use `>>` for arithmetic and `>>>` for logical." },
      { question: "How do you count the set bits in an integer?", answer: "Kernighan's loop: repeat `n &= n - 1` and count iterations, which runs once per set bit. In practice use the CPU's popcount via built-ins such as `__builtin_popcount`, `Integer.bitCount`, or Python's `int.bit_count()`." },
      { question: "How does XOR help find the one non-duplicated number in an array?", answer: "XOR is associative and commutative, `x ^ x = 0` and `x ^ 0 = x`. XORing all elements cancels every pair and leaves the single unpaired value, in O(n) time and O(1) space." },
      { question: "What does `n & -n` compute?", answer: "The lowest set bit of n as a value. In two's complement, -n is ~n + 1, which flips all bits above the lowest set bit and keeps that bit, so AND leaves only it. Fenwick trees use this." },
      { question: "Why should you avoid the XOR swap trick?", answer: "It's less readable, usually no faster than using a temporary (compilers optimize swaps well, and the XORs create a dependency chain), and if both operands are the same memory location it zeroes the value instead of swapping." },
      { question: "Why might `x & 1 == 0` give the wrong result in C or JavaScript?", answer: "Equality binds tighter than bitwise AND, so it parses as `x & (1 == 0)`, which is `x & 0` (or `x & false`), always 0. Write `(x & 1) == 0`." },
      { question: "How would you store a set of 1 million booleans compactly, and what are the trade-offs?", answer: "A bitset: an array of 64-bit words, bit i in word i/64 at position i%64, using about 125 KB instead of roughly 1 MB of bytes. Operations are fast word-wide ANDs and ORs. The trade-off is slightly more complex indexing, and concurrent updates to bits in the same word need atomic operations." },
    ],
    prerequisites: ["binary-and-number-systems", "data-types-and-values"],
    relatedTopics: ["binary-and-number-systems", "data-types-and-values", "floating-point-numbers", "big-o"],
    keywords: ["bitwise", "and", "or", "xor", "not", "shift", "mask", "flags", "two's complement", "power of two", "popcount", "bit manipulation", "bitset"],
  },
  // @@NEXT@@
];
