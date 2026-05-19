const decorativeLinePattern = /^[\s§•·*\-–—|]+$/;

function cleanLine(line: string): string {
  return line
    .replace(/^[\s§•·*]+/, "")
    .replace(/^[\-–—]\s+/, "")
    .replace(/[\s§•·*]+$/, "")
    // Remove common icon/symbol placeholders (ï, §, •, etc.)
    .replace(/[ï§•·]/g, "")
    // Remove icon placeholders like " # ", " H ", etc. that appear before contact info
    .replace(/\s+[#H§ï]\s+/g, " | ")
    // Clean up spacing around separators
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTextBlock(text: string): string {
  const cleanedLines: string[] = [];

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = cleanLine(rawLine);

    if (!line || decorativeLinePattern.test(line)) {
      continue;
    }

    if (cleanedLines[cleanedLines.length - 1] === line) {
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").trim();
}