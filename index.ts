import { parse } from "https://esm.sh/@progfay/scrapbox-parser@7.1.0";
import {
  getUnixTime,
  lightFormat,
} from "https://deno.land/x/date_fns@v2.15.0/index.js";
import type { ProjectResponse } from "./types.ts";

const toLc = (title: string) =>
  title.toLowerCase().replaceAll(" ", "_").replaceAll("/", "%2F");

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
  return pages.flatMap(({ title, updated }) =>
    updated > getUnixTime(from)
      ? [{ project, title, updated: new Date(updated) }]
      : []
  );
}
