import {
  PageList,
  PageSummary,
} from "https://raw.githubusercontent.com/scrapbox-jp/types/0.0.5/mod.ts";

/** Get pages of a project
 *
 * @param project the target project
 */
export async function getPages(
  project: string,
  skip?: number,
): Promise<PageList> {
  const res = await fetch(
    `https://scrapbox.io/api/pages/${project}?sort=updated&limit=1000&skip=${skip ??
      0}`,
  );
  if (!res.ok) {
    throw Error(`Network error occured. Status code is ${res.status}`);
  }
  return await res.json();
}

/** Get pages updated after a specified time
 *
 * @param project the target project
 * @param updated what time getting pages updated after
 */
export async function getModifiedPages(project: string, updated: number) {
  const pages = [] as PageSummary[];
  let skip = 0;
  while (true) {
    const pageList = await getPages(project, skip);
    const additinalPages = pageList.pages.filter((page) =>
      page.updated < updated
    );
    pages.push(...additinalPages);
    if (additinalPages.length < pageList.pages.length) break;
    skip += 1000;
  }
  return pages;
}
