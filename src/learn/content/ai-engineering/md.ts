/** Join paragraphs with blank lines (the lesson markup separates blocks that way). */
export const md = (...paragraphs: string[]): string => paragraphs.join("\n\n");
