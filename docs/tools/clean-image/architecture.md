# Clean Image — architecture

```text
src/tools/clean-image/
├── CleanImagePage.tsx, hooks/useImageProcessor.ts   UI state machine: idle → analyzing → ready → sanitizing → completed
├── components/                          Presentational React components (metadata rendered as text only)
├── workers/                             image.worker.ts + promise client (cancel = terminate worker)
├── features/
│   ├── formats/      detect.ts + {jpeg,png,webp}.structure.ts   walk containers, classify each as metadata or image data
│   ├── metadata/     exif / xmp / iptc / icc / c2pa parsers, per-format scanners, classify.ts, metadata.service.ts
│   ├── sanitizer/    per-format sanitizers + minimal orientation EXIF builder
│   ├── validation/   metadata diff, image-data identity check, validation.service.ts
│   └── pipeline.ts   analyze → sanitize → re-analyze → validate (shared by worker and tests)
(byte helpers, CRC-32, inflate, hashing and AppError live in src/shared/lib)
└── config/limits.ts  size / pixel / decompression / value-length limits
```

## Key design decisions

- **One structure walker per format, shared by parser, sanitizer and validator.** `describe*()` decides whether a container is metadata, so the three stages can't disagree about which bytes are metadata.
- **Container removal, not re-encoding.** The sanitizer rebuilds the file from the original's kept byte ranges. Validation extracts the image-data containers from input and output and requires them to be byte-identical, which proves no recompression happened.
- **Fail closed.** If the output can't be re-parsed or changes format, it's discarded and the user sees an error. The original is never modified.
- **Classification ≠ detection.** Fields are labelled Privacy / Generator / Provenance. Only standardized explicit declarations (IPTC `DigitalSourceType`, C2PA) are reported as "Declared in file", and even these are described as unverified.
- **Hostile input.** Every offset is bounds-checked. EXIF IFD loops are tracked. Compressed chunks are inflated with an output cap. Pixel limits are enforced from the header before any decode or preview. Values are truncated and stripped of control characters, then rendered as React text, never as HTML.
- **No DOMParser in the worker**, so XMP is read by a small tolerant tokenizer.
