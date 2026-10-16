import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    "Paste the bytes as **hex** (spaces, `0x` and `:` are fine), **Base64** or **Base64URL**, or use **Open binary file**. Leave **Input format** on *Auto-detect*, or pick one if a short string is ambiguous.",
    "Tick **gRPC frame(s)** if the bytes start with the 5-byte gRPC header (a flag byte and a 4-byte length). Every frame is decoded.",
    "Read the **Fields** tree. Each row shows the field number, wire type, byte range (`@start–end`) and most likely value. Lines starting with *also* are other readings of the same bytes. Nested messages open and close.",
    "**Copy as text** copies an indented dump of the tree.",
  ],
  howItWorks:
    "Without a `.proto` file, the wire format only gives each field’s number and one of four wire types. The decoder reads those and offers likely interpretations.\n\n" +
    "- **Varints**: shown as unsigned numbers, plus signed 64-bit, zigzag (`sint`) and `bool` readings when they apply.\n" +
    "- **Fixed64** and **fixed32**: shown as integers and as `double` / `float`.\n" +
    "- **Length-delimited**: tried first as a nested message (it must use exactly its bytes, contain at least one field and have sensible field numbers), then as valid UTF-8 text without control characters, otherwise as bytes.\n\n" +
    "Other readings, and packed repeated numbers, are listed under the value. Parsing uses `BigInt`, so 64-bit values stay exact.",
  limits: [
    "Nesting is followed to 16 levels, and decoding stops after 50,000 fields. Text input can be about 10 MB; files up to 8 MB.",
    "Groups (wire types 3 and 4, long deprecated) aren’t supported and are reported as errors.",
    "Types are guesses: a string and a message can have identical bytes, and `int32`, `enum` and `bool` all look like varints. Check the alternatives, or use the real `.proto` to be sure.",
    "Compressed gRPC frames are listed but not decompressed.",
    "On a truncated or malformed message, the fields read before the problem are still shown, with the error and its byte offset.",
  ],
  privacy:
    "Your bytes are decoded in your browser and never uploaded or stored. An opened file stays in memory in this tab. **Share** puts typed input and options in the link’s `#` fragment, which browsers don’t send to servers (opened files are not included).",
  faqs: [
    { question: "Why does a field show several readings?", answer: "The wire format doesn’t say whether a varint is a signed number, an enum or a bool, or whether a length-delimited field is text or a message. So all plausible readings are shown." },
    { question: "Can it decode gRPC-Web or Connect bodies?", answer: "Yes, if they are binary protobuf: tick **gRPC frame(s)**. A Base64 body (`application/grpc-web-text`) works with the Base64 format." },
    { question: "What does @8–11 mean?", answer: "The field, including its tag, occupies bytes 8 to 11 of the input, counting from 0." },
    { question: "Why a decode error on valid data?", answer: "Often the input isn’t raw protobuf (it may be JSON, compressed, or have a gRPC header: try that option), or it was cut off." },
  ],
};

export default docs;
