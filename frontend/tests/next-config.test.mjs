import test from "node:test";
import assert from "node:assert/strict";

import nextConfig from "../next.config.ts";

test("next config keeps standalone output for docker runner", () => {
  assert.equal(nextConfig.output, "standalone");
});
