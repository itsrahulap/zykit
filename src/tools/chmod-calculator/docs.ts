import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Tick **Read**, **Write** and **Execute** for **Owner**, **Group** and **Others**, and any **Special bits** (setuid, setgid, sticky). Or type a mode into **Octal** (`755`, `0755`, `4755`) or **Symbolic** (`rwxr-xr-x`, or an `ls -l` string like `drwxrwxrwt`). All views stay in sync.',
    'Tick **It\'s a directory** when the mode is for a directory. It changes the `ls -l` type character and how `X` behaves in expressions.',
    'Copy the `ls -l` form, the `chmod` command in octal or symbolic form, or the **4-digit octal**. Warnings appear for risky modes such as `777`, world-writable files and setuid.',
    'Pick a **Preset** such as `644`, `755`, `600` or `1777`, or type a chmod expression under **Apply a symbolic mode** (for example `u+x,g-w,o=r` or `a+rX`) and press **Use this mode** to take the result.',
    'Enter a **umask** in the **umask calculator** to see the default mode of **New files** and **New directories**, and press **Use** to load one.',
  ],
  howItWorks:
    'A Unix mode is 12 bits: three bits (read 4, write 2, execute 1) each for owner, group and others, plus setuid (4000), setgid (2000) and sticky (1000). Octal is those bits written in base 8. In the symbolic form a special bit replaces the matching execute position: `s` or `t` when execute is also set, capital `S` or `T` when it isn’t. When you paste an `ls -l` string, the first character is read as the file type (`- d l c b p s`) and a trailing `.`, `+` or `@` (SELinux, ACL or extended attributes) is ignored.\n\n' +
    'Expressions follow POSIX and GNU `chmod` rules. Each comma-separated clause is `[ugoa][+-=][rwxXst]`, applied in order to the current mode. `X` adds execute only for a directory or when someone already has execute, permissions can be copied from another class (`o=g`, `go=u-w`), and `=` on a directory keeps its setgid bit, as GNU chmod does. A clause that is only digits replaces the whole mode.\n\n' +
    'The umask calculator removes the umask’s bits from `666` for files and `777` for directories. Everything is calculated instantly in your browser.',
  limits: [
    'Octal modes are 1 to 4 digits from 0 to 7, with an optional `0o` prefix. Symbolic input must be exactly 9 characters, or 10 (11 with a trailing `.`, `+` or `@`) for an `ls -l` string.',
    'In **Apply a symbolic mode**, a clause without `u`, `g`, `o` or `a` (such as `+x`) applies to everyone and is not reduced by the **umask** field, whereas real `chmod` would mask it with your shell’s umask.',
    'Copying from a class takes one class at a time (`o=g`, not `o=gu`) and can’t be mixed with `r`, `w` or `x` in the same operator; `t` only affects others, so `u+t` changes nothing.',
    'Only the permission bits are modelled. Owner and group, ACLs and extended attributes aren’t, and the result isn’t checked against any real file.',
  ],
  privacy:
    'Everything is calculated in your browser and nothing is uploaded or saved; the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts the mode, the directory setting, the expression and the umask in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'What is the difference between 755 and 644?',
      answer:
        '`755` (`rwxr-xr-x`) lets the owner read, write and execute, and everyone else read and execute; it suits programs and directories. `644` (`rw-r--r--`) has no execute bit and suits ordinary files.',
    },
    {
      question: 'What does a capital S or T mean in ls -l output?',
      answer:
        'The setuid, setgid or sticky bit is set but the matching execute bit isn’t. For setuid on a file that isn’t executable by its owner this has no effect, and the tool warns about it.',
    },
    {
      question: 'Why does a 4-digit mode like 4755 start with 4?',
      answer:
        'The first digit holds the special bits: 4 for setuid, 2 for setgid and 1 for sticky, added together. `4755` is `755` plus setuid, and `1777` is the usual mode for `/tmp`.',
    },
    {
      question: 'What does capital X do in a chmod expression?',
      answer:
        '`X` adds execute only if the target is a directory or someone already has execute. `a+rX` makes a tree readable without making ordinary files executable. Tick **It\'s a directory** to see the directory result.',
    },
    {
      question: 'Why is 777 a bad idea?',
      answer:
        'Every user on the system can change or replace the file. Use `755`, or `775` for a directory shared by a group. For shared writable directories, add the sticky bit (`1777`) so users can only delete their own files.',
    },
    {
      question: 'How does umask decide the default permissions?',
      answer:
        'New files start from `666` and new directories from `777`, and every bit set in the umask is removed. With the common `022`, files get `644` and directories `755`; with `077` only the owner has access.',
    },
  ],
};

export default docs;
