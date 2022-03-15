/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference types="https://raw.githubusercontent.com/takker99/deno-gas-types/main/mod.d.ts" />

import { lightFormat } from "../deps/date-fns.ts";
import type {
  NotFoundError,
  NotMemberError,
  Page,
  PageList,
} from "../deps/scrapbox.ts";

export interface Title {
  project: string;
  title: string;
}
export interface GetPagesInit {
  sid: string;
}
export function* getPages(pages: Title[], { sid }: GetPagesInit) {
  console.log(`[getPages()] Start fetching ${pages.length} scrapbox pages...`);

  // 10件ずつ取得する
  const count = Math.floor(pages.length / 10) + 1;
  for (let i = 0; i < count; i++) {
    console.log(`[getPages()] ${i * 10}/${pages.length}`);
    const responses = UrlFetchApp.fetchAll(
      pages
        .slice(i * 10, (i + 1) * 10)
        .map(({ project, title }) => ({
          url: `https://scrapbox.io/api/pages/${project}/${
            encodeURIComponent(title)
          }`,
          headers: { Cookie: `connect.sid=${sid}` },
          muteHttpExceptions: true,
        })),
    );

    const pages_ = pages.slice(i * 10, (i + 1) * 10);
    const jsons = responses.map((response, j) => ({
      ...JSON.parse(response.getContentText()),
      project: pages_[j].project,
      title: pages_[j].title,
    }));
    yield jsons as ((Page | NotFoundError | NotMemberError) & Title)[];
  }
  console.log("[getPages()] Finish fetching.");
}

export interface GetModifiedTitlesOptions {
  from: Date;
  sid: string;
}

/** 各projectで最大1000件まで取得する
 *
 * 一日に1000件以上ページが更新されるなんてことは無いだろうからこれで大丈夫だとは思うが…………
 *
 * もしそういう状況が起きるのであれば、skipパラメータを使う
 */
export function* getModifiedTitles(
  projects: string[],
  { from, sid }: GetModifiedTitlesOptions,
) {
  console.log(
    `Start searching ${projects.length} scrapbox projects for pages which are updated from ${
      lightFormat(from, "yyyy-MM-dd HH:mm:ss")
    }: `,
    projects,
  );
  for (const project of projects) {
    const data = getList(project, { sid, skip: 0 });
    if ("name" in data) {
      console.error(`Error at "/${project}": ${data.name} ${data.message}`);
      continue;
    }
    const updates: number[] = [];
    for (const page of data.pages) {
      if (page.updated <= from.getTime() / 1000) continue;
      updates.push(page.updated);
      yield { project, title: page.title, updated: page.updated };
    }
    if (updates.length < 2) continue;
    console.log({
      project,
      from: lightFormat(
        new Date(
          updates.length > 0 ? Math.min(...updates) * 1000 : from.getTime(),
        ),
        "yyyy-MM-dd HH:mm:ss",
      ),
    });
  }
  console.log(`Finish fetching.`);
}

interface GetListInit {
  sid: string;
  skip: number;
}
const getList = (project: string, { sid, skip }: GetListInit) => {
  const response = UrlFetchApp.fetch(
    `https://scrapbox.io/api/pages/${project}?limit=1000&skip=${skip}`,
    {
      headers: { Cookie: `connect.sid=${sid}` },
      muteHttpExceptions: true,
    },
  );
  return JSON.parse(
    response.getContentText(),
  ) as (PageList | NotFoundError | NotMemberError);
};
