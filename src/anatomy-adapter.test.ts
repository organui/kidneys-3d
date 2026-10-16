import { describe, expect, it } from "vitest";
import { anatomyIndex, leafIds } from "./components/ui/anatomy-tree";
import { byId, type StructureId } from "./anatomy";
import {
  isolateNode,
  normalizeVisibility,
  revealNode,
  sceneIdsForNode,
  treeData,
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

  it("colours every scene leaf like its mesh and makes groups expand-only", () => {
    const { nodes } = anatomyIndex(treeData);
    const leaves = treeData.flatMap(leafIds);
    expect(leaves).toHaveLength(6);
    for (const id of leaves) {
      const node = nodes.get(id)!;
      expect(node.color).toBe(byId[id as StructureId].color);
      expect(node.selectable).not.toBe(false);
    }
    const groups = [...nodes.values()].filter(({ id }) =>
      id.startsWith("group-"),
    );
    expect(groups.map(({ id }) => id)).toEqual([
      "group-kidneys",
      "group-urinary-tract",
      "group-arterial-supply",
    ]);
    for (const group of groups) {
      expect(group.selectable).toBe(false);
      expect(group.color).toBeUndefined();
    }
  });
});
