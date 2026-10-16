# Anatomy-tree registry integration

This app consumes the real public OrganUI registry item and keeps the installed source in version control. Runtime and ordinary setup do not contact the registry.

## Exact installation

The current installed source is the `anatomy-tree` item from OrganUI PR #12 (branch commit `d6b36d0`, not yet merged), reinstalled on 2026-10-16. `organui.com` and `ui.shadcn.com` are blocked in the build sandbox, so the built registry item from that commit was served locally and installed with the same CLI:

```sh
REGISTRY_URL=http://127.0.0.1:4411 bunx shadcn@4.21.0 add http://127.0.0.1:4411/anatomy-tree.json -y -o
```

After PR #12 merges, re-run the install against `https://organui.com/r/anatomy-tree.json` and confirm the checksums below still match; until then this install is from an unmerged commit, not the public registry.

| Artifact                                     | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Served `anatomy-tree.json`                   | `32fbc477ece5f02ac135dbf0a5b4c059c37fc2ca9abc8982641b55c080cc9b30` |
| Embedded source (`files[0].content`)         | `cb0ebd637b64a9813ba1139560315024b315580ad04e5df6eca3b3d1bb4844c0` |
| Tracked `src/components/ui/anatomy-tree.tsx` | `dc14798adfbdcaef505cbe05e2ca92a6a3aae6164465d06e8d4d99cd415efab2` |

The first install (2026-09-26, `bunx shadcn@4.21.0 add https://organui.com/r/anatomy-tree.json -y`, served JSON `de73f92f…14a7`, installed file `bf82b428…7117`) came from the public registry; this reinstall replaces it.

The registry declares `@base-ui/react@^1.8.0`; `package.json` pins the exact version `1.8.0`, and the text `bun.lock` resolves that version. The project uses React 19.2.8, TypeScript 7.0.2, Vite 8.3.0, Tailwind CSS 4.1.18, and shadcn’s Base UI consumer shape.

## Installed-source differences

The shadcn CLI removes the published `"use client"` directive for this Vite target; that is the only difference between the embedded source and the tracked file. The installed file is excluded from project-format passes (`.prettierignore`) so its checksum stays stable, and it is never edited by hand.

At the first install the CLI created `@/components/ui/anatomy-tree.tsx` literally because the TypeScript config did not yet declare the `@/*` path; the `@/* -> src/*` TypeScript and Vite aliases now exist, so the reinstall wrote straight to `src/components/ui/anatomy-tree.tsx`.

## API used

The component receives:

- `data`: unique hierarchy IDs;
- `selectedId` and `onSelectionChange`: controlled selection;
- `visibility` and `onVisibilityChange`: a controlled map keyed by **leaf** IDs;
- `defaultExpandedIds`: initial disclosure state;
- per-node `color`: each leaf carries its structure colour, the same value the 3D mesh uses, shown as a decorative swatch before the label;
- per-node `selectable: false` on the three `group-*` rows: clicking or pressing Enter on a grouping expands or collapses it instead of selecting it, and the row carries no `aria-selected`;
- `label` and `className`: accessible naming and theme composition.

Missing entries in `visibility` mean visible. Parent actions operate on descendant leaves. The component derives `true`, `false`, or `"mixed"` for parent rows. Expansion and search remain internal to the reusable component. When `selectedId` changes to a row that is not shown, such as after a 3D pick inside a collapsed group, the component expands that row's ancestors and scrolls it into view once.

## Application adapter

Scene-specific logic lives in `src/anatomy-adapter.ts`, not in the registry component.

| Tree ID                 | Scene leaves / GLB nodes                  | Meaning                                                |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `group-kidneys`         | `right-kidney`, `left-kidney`             | Interface grouping for the paired organs               |
| `group-urinary-tract`   | `right-ureter`, `left-ureter`             | Interface grouping for represented urinary-tract paths |
| `group-arterial-supply` | `right-renal-artery`, `left-renal-artery` | Interface grouping for represented arterial geometry   |

The latter two groupings do not claim anatomical containment inside kidney tissue. Every leaf ID matches exactly one GLB node `extras.structureId` and one stable application structure ID.

The adapter provides:

- `treeData`: the hierarchy passed to the tree, with leaf colours from `src/anatomy.ts` and `selectable: false` on interface groups;
- `sceneIdsForNode` for leaf and group highlighting;
- `normalizeVisibility` for the component’s “missing means visible” contract;
- `isolateNode` and `revealNode` for actions outside the tree;
- mapping validation that rejects missing, unknown, or duplicate leaves.

Tree selection of a leaf sets the app’s controlled `selectedId`; the renderer highlights every mapped scene leaf. Groups are not selectable from the tree, but guided-tour steps still select a group programmatically, so the selection card, chip, isolate and highlight work for groups as before. Mesh picking writes a leaf ID back to the same controlled state; the tree reveals that row itself. A hidden selection stays selected and receives a clear reveal action. Search and disclosure do not own or mutate visibility. Isolate, tour, restore, and reset all write the same visibility object.

The canvas event filter excludes intersections with hidden objects or descendants of hidden ancestors. Three.js raycasting can still intersect invisible geometry, so hiding a mesh alone is insufficient: filtering before event dispatch prevents hidden foreground anatomy from selecting itself or blocking visible surfaces behind it. Hidden structures remain selectable through the text tree.

Reset increments the tree instance key to clear its internal search/disclosure state along with application selection, visibility, tour, and camera state. That remount is kept because search is internal; revealing a selection needs no remount. The component remains unchanged.

## Theme setup

`src/styles.css` imports Tailwind CSS 4 and defines shadcn-compatible background, foreground, muted, accent, border, and ring variables. The registry component uses only those token utilities plus its own structural classes. App-specific panel and 3D styles are separate. Base UI provides the component’s button primitive.

## Friction and follow-up

No generic registry bug prevented integration. Earlier observations now resolved by PR #12: groupings can be made expand-only (`selectable`), leaf swatches no longer need app CSS (`color`), and an outside selection inside a collapsed group is revealed by the component. Remaining notes for another consumer:

1. Configure the `@/*` alias before installing URL items whose registry path resolves through `@`.
2. Search and expansion are intentionally internal. A consumer that needs a programmatic search/disclosure reset can remount the component, as this app does on Reset.
3. Visibility must govern both rendering and scene picking. The consumer owns that filtering; it is independent of the registry tree's visibility state contract.
4. This install comes from unmerged PR #12 served locally; re-verify against `organui.com` once it merges.
