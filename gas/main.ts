/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference types="https://raw.githubusercontent.com/takker99/deno-gas-types/main/mod.d.ts" />

import { postToSlack } from "./postToSlack.ts";
import { toBlocks } from "./convert.ts";
import { getModifiedTitles, getPages } from "./fetch.ts";
import type { Page } from "../deps/scrapbox.ts";
import { lightFormat } from "../deps/date-fns.ts";

interface Project {
  webhook: string;
  project: string;
  include?: RegExp;
  exclude?: RegExp;
}

declare const global: Record<string, CallableFunction>;
global.subscribe = (settings: Project[]) => {
  const lastUpdated = getUpdated();
  const sid = getSid();
  if (sid === null) {
    throw Error("Please set cookie.sid");
  }
  const updatedTitleList = [...getModifiedTitles(
    [...new Set(settings.map(({ project }) => project))],
    {
      from: lastUpdated,
      sid,
    },
  )];
  // 最終更新日時を更新する
  setUpdated(
    Math.max(
      ...updatedTitleList.map(({ updated }) => updated),
      lastUpdated.getTime() / 1000,
    ),
  );
  console.log(
    `Fetch updates until ${lightFormat(getUpdated(), "yyyy-MM-dd HH:mm:ss")}`,
  );

  const list: { url: string; blocks: SlackBlock[]; description: string }[] = [];
  for (const jsons of getPages(updatedTitleList, { sid })) {
    const pageDataList = jsons
      .flatMap((json) => {
        if ("name" in json) {
          console.error(
            `Failed to fetch "/${json.project}/${json.title}"\n\tname: ${json.name}\n\tmessage: ${json.message}`,
          );
          return [];
        }
        return [{
          project: json.project,
          title: json.title,
          lineBlocks: getModifiedLines(
            json.lines,
            lastUpdated.getTime() / 1000,
          ),
        }];
      });
    // 送り先を振り分ける
    const params = settings.flatMap(({ webhook, project, include, exclude }) =>
      pageDataList.flatMap(({ project: project_, title, lineBlocks }) => {
        if (project_ !== project) return [];
        const lines = lineBlocks.flat();
        if (include && !lines.some(({ text }) => include.test(text))) return [];
        if (exclude && lines.some(({ text }) => exclude.test(text))) return [];
        // データを変換しておく
        return [{
          url: webhook,
          blocks: toBlocks(project, title, lineBlocks),
          description: lines.slice(0, 5).map((line) => line.text).join("\n"),
        }];
      })
    );
    list.push(...params);
  }
  // データを整形してpostする
  postToSlack(list);
};

const getModifiedLines = (lines: Page["lines"], from: number) => {
  const result = [];
  let chunk = [];

  // 更新された行を、連続した部分ごとに分割する
  for (const line of lines) {
    if (line.updated <= from) {
      if (chunk.length === 0) continue;
      result.push([...chunk]);
      chunk = [];
      continue;
    }
    chunk.push(line);
  }
  if (chunk.length > 0) result.push([...chunk]);
  return result;
};

const getUpdated = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = parseFloat(scriptProperties.getProperty("LAST_UPDATED") ?? "0");
  return !isNaN(value) ? new Date(value * 1000) : yesterday();
};
const setUpdated = (...times: number[]) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty("LAST_UPDATED", `${Math.max(...times)}`);
};
const getSid = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty("CONNECT_SID");
};

const yesterday = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now;
};
