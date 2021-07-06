import { toLc } from "../src/utils.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

Deno.test("toLc", () => {
  assertEquals(toLc("title"), "title");
  assertEquals(toLc("Title"), "title");
  assertEquals(toLc("sample title"), "sample_title");
  assertEquals(toLc("Sample Title"), "sample_title");
  assertEquals(toLc("app/index.js"), "app%2Findex.js");
});
