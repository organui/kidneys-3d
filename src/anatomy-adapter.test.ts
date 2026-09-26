import { describe, expect, it } from "vitest";
import {
  isolateNode,
  normalizeVisibility,
  revealNode,
  sceneIdsForNode,
} from "./anatomy-adapter";

describe("anatomy-to-scene adapter", () => {
  it("maps interface groups to their descendant scene leaves", () => {
    expect(sceneIdsForNode("group-kidneys")).toEqual([
      "right-kidney",
      "left-kidney",
    ]);
    expect(sceneIdsForNode("left-ureter")).toEqual(["left-ureter"]);
  });

  it("treats omitted leaf visibility as visible", () => {
    expect(normalizeVisibility({ "left-kidney": false })).toMatchObject({
      "left-kidney": false,
      "right-kidney": true,
      "right-ureter": true,
    });
  });

  it("isolates groups and reveals hidden descendants without changing others", () => {
    const isolated = isolateNode("group-urinary-tract");
    expect(isolated["right-ureter"]).toBe(true);
    expect(isolated["left-ureter"]).toBe(true);
    expect(isolated["right-kidney"]).toBe(false);

    const revealed = revealNode("group-kidneys", isolated);
    expect(revealed["right-kidney"]).toBe(true);
    expect(revealed["left-kidney"]).toBe(true);
    expect(revealed["right-renal-artery"]).toBe(false);
  });
});
