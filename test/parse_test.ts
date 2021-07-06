import { sb2blocks } from "../parse.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

Deno.test("codeblock", () => {
  const result = sb2blocks("project", "title", [{
    text: "code:script.js",
    id: "xxxx",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }, {
    text: " console.log('Hello, Scrapbox!')",
    id: "zzzz",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }]);
  assertEquals(result, [{
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "<https://scrapbox.io/api/code/project/title/script.js|script.js>\n```\nconsole.log('Hello, Scrapbox!')\n```",
      verbatim: true,
    },
  }]);
});

Deno.test("tableblock", () => {
  const result = sb2blocks("project", "title", [{
    text: "table:my_table",
    id: "xxxx",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }, {
    text: " foo\tbar\tbaz",
    id: "rrrr",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }, {
    text: " hoge\thuga",
    id: "zzzz",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }, {
    text: " あいう\tえお",
    id: "wwww",
    userId: "yyyy",
    updated: 0,
    created: 0,
  }]);
  assertEquals(result, [{
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "<https://scrapbox.io/api/table/project/title/my_table.csv|my_table>\nfoo　bar　baz\nhoge　huga\nあいう　えお\n",
      verbatim: true,
    },
  }]);
});
