# Anatomy-tree registry integration

This app consumes the real public OrganUI registry item and keeps the installed source in version control. Runtime and ordinary setup do not contact the registry.

## Exact installation

The item was retrieved and installed on 2026-09-26:

```sh
bunx shadcn@4.21.0 add https://organui.com/r/anatomy-tree.json -y
```

Provenance at install time:

| Artifact                       | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Downloaded `anatomy-tree.json` | `de73f92f420b7539c4ffe0187f914036f1a1c4a90061a35927ef2d67545314a7` |
| Embedded published source      | `6d7ffded6e93f4f398d7dbd35c74c87a991d9524195b8813b508fbea9ef2ae8c` |
| Tracked installed file         | `bf82b4286414f8db4b74a1e279ee7cda709ce04d544dcfb531f81cff75c27117` |

The registry declared `@base-ui/react@^1.8.0`; this checkout pins `@base-ui/react` 1.8.0. The project uses React 19.2.8, TypeScript 7.0.2, Vite 8.3.0, Tailwind CSS 4.1.18, and shadcn’s Base UI consumer shape.

## Installed-source differences

The CLI created `@/components/ui/anatomy-tree.tsx` literally because the initial TypeScript config did not yet declare the `@/*` path. The file was moved to `src/components/ui/anatomy-tree.tsx`, then the normal `@/* -> src/*` TypeScript and Vite aliases were added. This is a consumer-setup issue, not a registry defect.

The shadcn CLI removed the published `"use client"` directive for this Vite target. The project formatter then normalized trailing commas. No component behavior, markup, API, state, or styling classes were changed. The installed file is excluded from future project-format passes so its tracked checksum is stable.

## API used

The component receives:

- `data`: unique hierarchy IDs;
- `selectedId` and `onSelectionChange`: controlled selection;
- `visibility` and `onVisibilityChange`: a controlled map keyed by **leaf** IDs;
- `defaultExpandedIds`: initial disclosure state;
- `label` and `className`: accessible naming and theme composition.

Missing entries in `visibility` mean visible. Parent actions operate on descendant leaves. The component derives `true`, `false`, or `"mixed"` for parent rows. Expansion and search remain internal to the reusable component.

## Application adapter

Scene-specific logic lives in `src/anatomy-adapter.ts`, not in the registry component.

| Tree ID                 | Scene leaves / GLB nodes                  | Meaning                                                |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `group-kidneys`         | `right-kidney`, `left-kidney`             | Interface grouping for the paired organs               |
| `group-urinary-tract`   | `right-ureter`, `left-ureter`             | Interface grouping for represented urinary-tract paths |
| `group-arterial-supply` | `right-renal-artery`, `left-renal-artery` | Interface grouping for represented arterial geometry   |

The latter two groupings do not claim anatomical containment inside kidney tissue. Every leaf ID matches exactly one GLB node `extras.structureId` and one stable application structure ID.

The adapter provides:

- `sceneIdsForNode` for leaf and group highlighting;
- `normalizeVisibility` for the component’s “missing means visible” contract;
- `isolateNode` and `revealNode` for actions outside the tree;
- mapping validation that rejects missing, unknown, or duplicate leaves.

Tree selection sets the app’s controlled `selectedId`; the renderer highlights every mapped scene leaf. Mesh picking writes a leaf ID back to the same controlled state and opens the anatomy panel. A hidden selection stays selected and receives a clear reveal action. Search and disclosure do not own or mutate visibility. Isolate, tour, restore, and reset all write the same visibility object.

The canvas event filter excludes intersections with hidden objects or descendants of hidden ancestors. Three.js raycasting can still intersect invisible geometry, so hiding a mesh alone is insufficient: filtering before event dispatch prevents hidden foreground anatomy from selecting itself or blocking visible surfaces behind it. Hidden structures remain selectable through the text tree.

Reset increments the tree instance key to clear its internal search/disclosure state along with application selection, visibility, tour, and camera state. The component remains unchanged.

## Theme setup

`src/styles.css` imports Tailwind CSS 4 and defines shadcn-compatible background, foreground, muted, accent, border, and ring variables. The registry component uses only those token utilities plus its own structural classes. App-specific panel and 3D styles are separate. Base UI provides the component’s button primitive.

## Friction and follow-up

No generic registry bug prevented integration, so no upstream worktree or PR was needed. Three integration observations are worth carrying to another consumer:

1. Configure the `@/*` alias before installing URL items whose registry path resolves through `@`.
2. Search and expansion are intentionally internal. A consumer that needs programmatic search/disclosure reset can remount the component; a future API could expose those states, but this app did not fork the component to add them.
3. Visibility must govern both rendering and scene picking. The consumer owns that filtering; it is independent of the registry tree's visibility state contract.
