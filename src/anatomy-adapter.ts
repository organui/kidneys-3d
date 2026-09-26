import {
  anatomyIndex,
  leafIds,
  type AnatomyNode,
} from "./components/ui/anatomy-tree";
import { anatomyTree, structures, type StructureId } from "./anatomy";

const structureIds = new Set<string>(structures.map(({ id }) => id));
const { nodes, parents } = anatomyIndex(anatomyTree);

export const allStructureIds = structures.map(({ id }) => id);

export function sceneIdsForNode(id: string | null): StructureId[] {
  if (!id) return [];
  const node = nodes.get(id);
  if (!node) return [];
  return leafIds(node).filter((leaf): leaf is StructureId =>
    structureIds.has(leaf),
  );
}

export function selectedPath(id: string | null): string[] {
  if (!id || !nodes.has(id)) return [];
  const path = [id];
  let parent = parents.get(id);
  while (parent) {
    path.push(parent);
    parent = parents.get(parent);
  }
  return path;
}

export function normalizeVisibility(
  visibility: Readonly<Record<string, boolean>>,
): Record<StructureId, boolean> {
  return Object.fromEntries(
    allStructureIds.map((id) => [id, visibility[id] !== false]),
  ) as Record<StructureId, boolean>;
}

export function isolateNode(id: string): Record<StructureId, boolean> {
  const included = new Set(sceneIdsForNode(id));
  return Object.fromEntries(
    allStructureIds.map((structureId) => [
      structureId,
      included.has(structureId),
    ]),
  ) as Record<StructureId, boolean>;
}

export function revealNode(
  id: string,
  current: Readonly<Record<string, boolean>>,
): Record<StructureId, boolean> {
  const next = normalizeVisibility(current);
  for (const structureId of sceneIdsForNode(id)) next[structureId] = true;
  return next;
}

export function visibleCount(
  visibility: Readonly<Record<string, boolean>>,
): number {
  return allStructureIds.filter((id) => visibility[id] !== false).length;
}

export function assertAnatomyMapping(
  data: readonly AnatomyNode[] = anatomyTree,
) {
  const leaves = data.flatMap(leafIds);
  const duplicates = leaves.filter((id, index) => leaves.indexOf(id) !== index);
  const missing = structures
    .filter(({ id }) => !leaves.includes(id))
    .map(({ id }) => id);
  const unknown = leaves.filter((id) => !structureIds.has(id));
  if (duplicates.length || missing.length || unknown.length)
    throw new Error(
      `Invalid anatomy mapping: duplicates=${duplicates.join(",")} missing=${missing.join(",")} unknown=${unknown.join(",")}`,
    );
}

assertAnatomyMapping();
