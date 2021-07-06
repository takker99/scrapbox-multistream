import {
  CodeBlock,
  parse,
  Table,
} from "https://esm.sh/@progfay/scrapbox-parser@7.1.0";
import type { Line } from "./types.ts";
import { jsxslack, Section } from "https://esm.sh/jsx-slack";
import { toLc } from "./utils.ts";

export function sb2blocks(project: string, title: string, lines: Line[]) {
  const blocks = parse(lines.map((line) => line.text).join("\n"), {
    hasTitle: false,
  });
  return blocks.map((block) => {
    switch (block.type) {
      case "title":
        return jsxslack`${block.text}`;
      case "codeBlock":
        return convertCodeBlock(project, title, block);
      case "table":
        return convertTableBlock(project, title, block);
      case "line":
        return jsxslack``;
    }
  });
}

function convertCodeBlock(
  project: string,
  title: string,
  { fileName, content }: CodeBlock,
): typeof Section {
  return jsxslack`
    <Section>
      <a href="https://scrapbox.io/api/code/${project}/${toLc(title)}/${
    toLc(fileName)
  }">${fileName}</a><br />
      <pre>${content}</pre>
    </Section>
  `;
}

function convertTableBlock(
  project: string,
  title: string,
  { fileName, cells }: Table,
): typeof Section {
  return jsxslack`
    <Section>
      <a href="https://scrapbox.io/api/table/${project}/${toLc(title)}/${
    toLc(fileName)
  }.csv">${fileName}</a><br />
    ${cells.map(cell => jsxslack`${cell.map(row => row.map(node=>node.raw).join('')).join('　')}<br />`)}
    </Section>
  `;
}
