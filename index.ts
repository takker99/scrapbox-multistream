import {
  getUnixTime,
  lightFormat,
} from "https://deno.land/x/date_fns@v2.15.0/index.js";
import type { Line, ProjectResponse } from "./types.ts";
import { jsxslack } from "https://esm.sh/jsx-slack";


async function getModifiedPages(
  project: string,
  from: Date,
): Promise<{ project: string; title: string; updated: Date }[]> {
  console.log(
    `[/${project}]Start searching for pages which are updated from ${
      lightFormat(from, "yyyy-MM-dd")
    }`,
  );
  const res = await fetch(
    `https://scrapbox.io/api/pages/${project}?limit=1000`,
  );
  const { pages } = (await res.json()) as ProjectResponse;
  console.log(`[/${project}]Finish searching`);
  return pages.flatMap(({ title, updated }) =>
    updated > getUnixTime(from)
      ? [{ project, title, updated: new Date(updated) }]
      : []
  );
}

function getModifiedLines(lines: Line[], from: Date) {
  const result = [];
  let chunk = [];

  // 更新された行を、連続した部分ごとに分割する
  for (const line of lines) {
    if (line.updated > getUnixTime(from)) {
      chunk.push(line);
      continue;
    }
    if (chunk.length === 0) continue;
    result.push(chunk);
    chunk = [];
    continue;
  }
  if (chunk.length > 0) result.push(chunk);
  return result;
}

function convertLinesToBlocks(
  project: string,
  title: string,
  lineBlocks: Line[][],
) {
  return jsxslack`
    <Blocks>
      <Section>
        <b>
          <a href="https://scrapbox.io/${project}/${title}#${lineBlocks[0][0].id}">
            ${title}
          </a>
        </b>
      </Section>
      <Divider />
    </Blocks>`;
}
