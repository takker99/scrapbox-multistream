import {
  Line,
  Node,
  parse,
  Title,
} from "https://cdn.skypack.dev/@progfay/scrapbox-parser@7.1.0?dts";
import type {
  Page,
} from "https://raw.githubusercontent.com/scrapbox-jp/types/0.0.5/mod.ts";

/** scrapbox syntax objects with metadata */
export type ParsedLine =
  & {
    id: string;
    updated: number;
  }
  & (Title | Line | {
    type: "table";
    fileName: string;
    indent: number;
    cell?: Node[][];
  } | {
    type: "codeBlock";
    fileName: string;
    indent: number;
    text?: string;
  });

/** Get parsed lines updated after a specified time.
 *
 * @param project the target project
 * @param lines source
 * @param after a specified time
 */
export function getModifiedBlocks(
  project: string,
  page: Page,
  after: number,
) {
  const blocks = parse(page.lines.map((line) => line.text).join("\n"), {
    hasTitle: true,
  });
  const lineMetadata = page.lines.map(({ id, updated }) => ({ id, updated }));

  let counter = 0;
  const parsedLines = blocks.flatMap((block): ParsedLine[] => {
    switch (block.type) {
      case "title":
        return [{
          ...lineMetadata[counter++],
          ...block,
        }];
      case "table":
        return [
          {
            ...lineMetadata[counter++],
            type: block.type,
            fileName: block.fileName,
            indent: block.indent,
          },
          ...block.cells.map((cell) => ({
            ...lineMetadata[counter++],
            type: block.type,
            fileName: block.fileName,
            indent: block.indent,
            cell,
          })),
        ];
      case "codeBlock":
        return [
          {
            ...lineMetadata[counter++],
            type: block.type,
            fileName: block.fileName,
            indent: block.indent,
          },
          ...block.content.split("\n").map((line) => ({
            ...lineMetadata[counter++],
            type: block.type,
            fileName: block.fileName,
            indent: block.indent,
            text: line,
          })),
        ];
      case "line":
        return [{
          ...lineMetadata[counter++],
          ...block,
        }];
    }
  });

  // 隣接する行ごとに分ける
  const chunks = parsedLines.reduce((acc, cur, i) => {
    if (cur.updated < after) return acc;
    if (i === 0 || parsedLines[i - 1].updated < after) return [...acc, [cur]];
    acc.at(-1)!.push(cur);
    return acc;
  }, [] as ParsedLine[][]);

  return { project, title: page.title, chunks };
}
