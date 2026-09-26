import type { Object3D } from "three";

export function visibleSceneHits<T extends { object: Object3D }>(
  hits: T[],
): T[] {
  return hits.filter(({ object }) => {
    for (
      let current: Object3D | null = object;
      current;
      current = current.parent
    ) {
      if (!current.visible) return false;
    }
    return true;
  });
}
