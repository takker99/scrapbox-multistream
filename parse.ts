import {
  CodeBlock,
  parse,
} from "https://esm.sh/@progfay/scrapbox-parser@7.1.0";
import type { Line } from "./types.ts";
import { jsxslack } from "https://esm.sh/jsx-slack";
import { toLc } from "./utils.ts";

export function sb2blocks(project: string, title: string, lines: Line[]) {
  const blocks = parse(lines.map((line) => line.text).join("\n"), {
    hasTitle: false,
  });
  return blocks.map((block) => {
    switch (block.type) {
      case "title":
        break;
      case "codeBlock":
        return convertCodeBlock(project, title, block);
      case "table":
      case "line":
    }
  });
}

function convertCodeBlock(
  project: string,
  title: string,
  { fileName, content }: CodeBlock,
) {
  return jsxslack`
    <Section>
      <a href="https://scrapbox.io/api/code/${project}/${toLc(title)}/${
    toLc(fileName)
  }">${fileName}</a><br />
      <pre>${content}</pre>
    </Section>
  `;
}
