type DiffOperation =
  | { type: "equal"; line: string }
  | { type: "delete"; line: string }
  | { type: "insert"; line: string };

export function createUnifiedDiff(
  oldFileName: string,
  newFileName: string,
  oldContent: string,
  newContent: string
): string {
  const oldLines = splitLines(oldContent);
  const newLines = splitLines(newContent);
  const operations = diffLines(oldLines, newLines);

  if (operations.every((operation) => operation.type === "equal")) {
    return `--- ${oldFileName}\n+++ ${newFileName}\n`;
  }

  const body = operations
    .map((operation) => {
      if (operation.type === "equal") {
        return ` ${operation.line}`;
      }

      if (operation.type === "delete") {
        return `-${operation.line}`;
      }

      return `+${operation.line}`;
    })
    .join("\n");

  return [
    `--- ${oldFileName}`,
    `+++ ${newFileName}`,
    `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    body
  ].join("\n");
}

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return [];
  }

  const trimmed = content.endsWith("\n") ? content.slice(0, -1) : content;
  return trimmed.split(/\r?\n/);
}

function diffLines(oldLines: string[], newLines: string[]): DiffOperation[] {
  const matrix: number[][] = Array.from({ length: oldLines.length + 1 }, () =>
    Array.from({ length: newLines.length + 1 }, () => 0)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      matrix[oldIndex]![newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? matrix[oldIndex + 1]![newIndex + 1]! + 1
          : Math.max(matrix[oldIndex + 1]![newIndex]!, matrix[oldIndex]![newIndex + 1]!);
    }
  }

  const operations: DiffOperation[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      operations.push({ type: "equal", line: oldLines[oldIndex]! });
      oldIndex += 1;
      newIndex += 1;
    } else if (matrix[oldIndex + 1]![newIndex]! >= matrix[oldIndex]![newIndex + 1]!) {
      operations.push({ type: "delete", line: oldLines[oldIndex]! });
      oldIndex += 1;
    } else {
      operations.push({ type: "insert", line: newLines[newIndex]! });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    operations.push({ type: "delete", line: oldLines[oldIndex]! });
    oldIndex += 1;
  }

  while (newIndex < newLines.length) {
    operations.push({ type: "insert", line: newLines[newIndex]! });
    newIndex += 1;
  }

  return operations;
}
