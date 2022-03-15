/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference types="https://raw.githubusercontent.com/takker99/deno-gas-types/main/mod.d.ts" />

import { Block, Line, Node, parse } from "../deps/scrapbox-parser.ts";

export interface Mrkdwn {
  type: "mrkdwn";
  text: string;
}
export interface PlainText {
  type: "plain_text";
  text: string;
}
export interface Section {
  type: "section";
  text: Mrkdwn;
}
export interface Context {
  type: "context";
  elements: SlackBlock[];
}
export interface Divider {
  type: "divider";
}
export interface Image {
  type: "image";
  image_url: string;
  alt_text: string;
}
export type SlackBlock =
  | Mrkdwn
  | PlainText
  | Section
  | Context
  | Image
  | Divider;

export const sb2mrkdwn = (text: string, project: string) => {
  const blocks = parse(text, { hasTitle: false });
  return blocks.flatMap((block) => {
    const data = convertSb2Md(block, project);
    return data ? [data] : [];
  });
};
const convertSb2Md = (
  block: Block,
  project: string,
): SlackBlock | undefined => {
  switch (block.type) {
    case "title":
      return; // タイトルは選択範囲に入らないので無視
    case "codeBlock":
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`${block.fileName}\`\n\`\`\`${block.content}\`\`\``,
        },
      };
    case "table":
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`table:${block.fileName}\``,
        },
      };
    case "line":
      return convertLine(block, project);
  }
};

const convertLine = (line: Line, project: string): SlackBlock => {
  const objects = line.nodes
    .flatMap((node) => convertNode(node, project));
  //console.log(objects);
  // 画像のみの行は大きく表示する。アイコンは除く
  if (
    objects.length === 1 &&
    objects[0] && objects[0].type === "image" &&
    !/^https:\/\/scrapbox\.io\/api\/pages\/.+\/.+\/icon$/.test(
      objects[0].image_url,
    )
  ) {
    return objects[0];
  }

  // elementsの上限を越えないように、mrkdwnを結合する
  const elements: SlackBlock[] = line.indent > 0
    ? [{
      type: "plain_text",
      text: `${"　".repeat(line.indent - 1)}●`,
    }]
    : []; // indentを反映する
  let chunk: Mrkdwn | undefined;
  for (const object of objects) {
    if (object.type !== "mrkdwn") {
      if (chunk) elements.push(chunk);
      chunk = undefined;
      elements.push(object);
      continue;
    }
    chunk = {
      type: "mrkdwn",
      text: `${chunk ? chunk.text : ""}${object.text}`,
    };
  }
  if (chunk) elements.push(chunk);
  if (elements.length === 0) {
    elements.push({
      type: "plain_text",
      text: " ", // 空文字列だとエラーになる
    });
  }

  return {
    type: "context",
    elements,
  };
};

const convertNode = (
  node: Node,
  project: string,
): SlackBlock[] => {
  switch (node.type) {
    case "quote": {
      const objects = node.nodes.flatMap((node) => convertNode(node, project));
      if (objects.length === 0) objects.push({ type: "plain_text", text: " " });
      switch (objects[0].type) {
        case "plain_text":
        case "mrkdwn":
          return [{
            type: "mrkdwn",
            text: `>${objects[0].text}`,
          }, ...objects.slice(1)];
        default:
          break;
      }
      return objects;
    }
    case "image":
    case "strongImage":
      return [{
        type: "image",
        image_url: node.src,
        alt_text: "image",
      }];
    case "icon":
    case "strongIcon": {
      const path = node.pathType === "relative"
        ? `/${project}/${node.path}`
        : node.path;
      return [{
        type: "image",
        image_url: `https://scrapbox.io/api/pages${path}/icon`,
        alt_text: node.path,
      }];
    }
    case "formula":
      return [{
        type: "mrkdwn",
        text: ` \`${node.formula}\` `,
      }];
    case "helpfeel":
      return [{
        type: "mrkdwn",
        text: ` \`? ${node.text}\` `,
      }];
    case "commandLine":
      return [{
        type: "mrkdwn",
        text: ` \`${node.symbol} ${node.text}\` `,
      }];
    case "code":
      return [{
        type: "mrkdwn",
        text: ` \`${node.text}\` `,
      }];
    case "decoration": {
      const hasStrong = node.decos.some((deco) => /\*-/.test(deco[0]));
      const hasItalic = node.decos.includes("/");
      const hasStrike = node.decos.includes("-");
      return node.nodes.flatMap((node) => convertNode(node, project))
        .map((object) => {
          if (
            object.type !== "plain_text" ||
            !/^\s*$/.test(object.text) ||
            !/^<https?:\/\/.+\|.+>$/.test(object.text)
          ) {
            return object;
          }
          let text = object.text;
          if (hasStrong) text = `*${text}*`;
          if (hasItalic) text = `_${text}_`;
          if (hasStrike) text = `~${text}~`;
          return {
            type: "mrkdwn",
            text: ` ${text} `,
          };
        });
    }
    case "strong":
      return node.nodes.flatMap((node) => convertNode(node, project))
        .map((object) => {
          if (
            object.type !== "plain_text" ||
            !/^\s*$/.test(object.text) ||
            !/^<https?:\/\/.+\|.+>$/.test(object.text)
          ) {
            return object;
          }
          return {
            type: "mrkdwn",
            text: `*${object.text}*`,
          };
        });
    case "googleMap":
      return [{
        type: "mrkdwn",
        text: `<${node.url}|${node.place}>`,
      }];
    case "link": {
      switch (node.pathType) {
        case "root":
          return [{
            type: "mrkdwn",
            text: `<https://scrapbox.io${node.href}|${node.href}>`,
          }];
        case "relative":
          return [{
            type: "mrkdwn",
            text: `<https://scrapbox.io/${project}/${node.href}|${node.href}>`,
          }];
        case "absolute":
          break;
      }
      return [{
        type: "mrkdwn",
        text: `<${node.href}|${node.content || node.href}>`,
      }];
    }
    case "hashTag":
      return [{
        type: "mrkdwn",
        text: `<https://scrapbox.io/${project}/${node.href}|#${node.href}>`,
      }];
    case "blank":
    case "plain":
      return [{
        type: "mrkdwn",
        text: node.text,
      }];
  }
};
