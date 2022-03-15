import { SlackBlock } from "./parse.ts";

const MAX_BLOCK_NUM = 50;
export const postToSlack = (
  params: { url: string; blocks: SlackBlock[]; description: string }[],
) => {
  // blocksが長いときは分割する
  const temp: { url: string; blocks: SlackBlock[]; description: string }[] = [];
  for (const { blocks, ...rest } of params) {
    if (blocks.length > MAX_BLOCK_NUM) {
      temp.push({
        blocks: blocks.slice(0, MAX_BLOCK_NUM - 1),
        ...rest,
      }, {
        blocks: blocks.slice(MAX_BLOCK_NUM - 1),
        ...rest,
      });
    }
    temp.push({ blocks, ...rest });
  }

  //100件ずつPOSTする
  const chunk = 100;
  const count = Math.floor(temp.length / chunk) + 1;
  for (let i = 0; i < count; i++) {
    try {
      UrlFetchApp.fetchAll(
        temp
          .slice(i * chunk, (i + 1) * chunk)
          .map(({ url, blocks, description }) => ({
            url,
            method: "post",
            headers: { "Content-Type": "application/json" },
            payload: JSON.stringify({ text: description, blocks }),
          })),
      );
    } catch (e) {
      console.error(e);
    }
  }
};
