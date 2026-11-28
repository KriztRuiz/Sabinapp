import assert from "node:assert/strict";
import test from "node:test";
import { textMatchesSearch } from "../lib/search/local-search.ts";

test("busca nombres con términos de dos caracteres", () => {
  const name = "Taller de muestra QA 28N";

  for (const query of [name, "Taller de muestra", "Taller QA", "qa"]) {
    assert.equal(textMatchesSearch(name, query), true, query);
  }

  assert.equal(textMatchesSearch("Taller de muestra", "Taller QA"), false);
});
