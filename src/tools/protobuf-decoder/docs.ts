import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    "Paste the message bytes as **hex** (spaces, `0x` and `:` are fine), **Base64** or **Base64URL**, or use **Open binary file**. Leave **Input format** on *Auto-detect* or choose one if a short string is ambiguous.",
    "Tick **gRPC frame(s)** if the bytes start with the 5-byte gRPC header (a flag byte and a 4-byte length); every frame in the input is decoded.",
    "Read the **Fields** tree: each row shows the field number, the wire type, the byte range (`@start–end`) and the most likely value. Lines starting with *also* are other readings of the same bytes. Nested messages open and close.",
    "**Copy as text** copies an indented dump of the tree.",
  ],
  howItWorks:
    "Without a `.proto` file the wire format only tells us each field’s number and one of four wire types, so the decoder reads those and offers likely interpretations. **Varints** are shown as unsigned numbers, with the signed 64-bit, zigzag (`sint`) and `bool` readings when they apply. **Fixed64** and **fixed32** values are shown as integers and as `double` / `float`. **Length-delimited** fields are tried as a nested message first (it must use exactly its bytes, contain at least one field and have sensible field numbers), then as valid UTF-8 text without control characters, and otherwise as bytes; the other readings, and packed repeated numbers, are listed under the value. Parsing uses `BigInt` so 64-bit values stay exact.",
  limits: [
    "Nesting is followed to 16 levels, and decoding stops after 50,000 fields. Text input can be about 10 MB; files up to 8 MB.",
    "Groups (wire types 3 and 4, long deprecated) aren’t supported and are reported as errors.",
    "Types are guesses: a string and a message can have identical bytes, and `int32`, `enum` and `bool` all look like varints. Check the alternatives or use the real `.proto` to be sure.",
    "Compressed gRPC frames are listed but not decompressed.",
    "On a truncated or malformed message, the fields read before the problem are still shown, together with the error and its byte offset.",
  ],
  privacy:
    "Your bytes are decoded in your browser and never uploaded or stored; a file you open stays in memory in this tab. **Share** puts typed input and options in the link’s `#` fragment, which browsers don’t send to servers (opened files are not included).",
  faqs: [
    { question: "Why does a field show several readings?", answer: "The wire format doesn’t say whether a varint is a signed number, an enum or a bool, or whether a length-delimited field is text or a message. All plausible readings are shown." },
    { question: "Can it decode gRPC-Web or Connect bodies?", answer: "Yes, if they are binary protobuf: tick **gRPC frame(s)**. A Base64 body (`application/grpc-web-text`) works with the Base64 format." },
    { question: "What does @8–11 mean?", answer: "The field occupies bytes 8 up to 11 of the input, counting from 0, including its tag." },
    { question: "Why a decode error on valid data?", answer: "Often the input isn’t raw protobuf (it may be JSON, compressed, or have a gRPC header: try that option), or it was cut off." },
  ],
};

export default docs;
