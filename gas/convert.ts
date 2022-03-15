import type { Page } from "../deps/scrapbox.ts";
import { sb2mrkdwn, SlackBlock } from "./parse.ts";

export const toBlocks = (
  project: string,
  title: string,
  lineBlocks: Page["lines"][],
): SlackBlock[] => {
  const id = lineBlocks.length > 0 ? lineBlocks[0][0].id : undefined;
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<https://scrapbox.io/${project}/${encodeURIComponent(title)}${
          id !== undefined ? `#${id}` : ""
        }|${title}>*`,
      },
    },
    ...lineBlocks.flatMap((lines) => [
      ...sb2mrkdwn(lines.map((line) => line.text).join("\n"), project),
      {
        type: "divider",
      } as const,
    ]),
  ];
};
