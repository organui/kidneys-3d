# OrganUI Kidneys: first release and registry integration

## Purpose and repository boundary

Build the fifth standalone OrganUI organ explorer, following Heart, Liver, Lungs, and Brain. This release also serves as a real consumer of OrganUI's first public registry component.

- Repository: `organui/kidneys-3d`.
- Public title: **OrganUI Kidneys**.
- Keep the application runnable from a fresh checkout without the OrganUI monorepo or any sibling folder.
- Use Bun, TypeScript, React, Vite, and Three.js/React Three Fiber as appropriate. Check compatible dependency versions and the current registry component requirements before setup.
- Deliver a polished local explorer, verified installation and interaction behavior, model provenance, screenshots, and a practical guide to the registry integration.

The website, final brand, and common runtime-package architecture are separate work. Keep this application small and focused; do not extract a generic viewer platform or redesign sibling explorers.

## Use the actual public registry

- [Live anatomy-tree documentation](https://organui.com/docs/anatomy-tree)
- [Registry catalog](https://organui.com/r/registry.json)
- [Installable anatomy-tree item](https://organui.com/r/anatomy-tree.json)
- Registry implementation was introduced by [OrganUI PR #2](https://github.com/organui/organui/pull/2), which is merged.

The public item was retrieved successfully on 26 September 2026. It is a `registry:ui` item containing one source file and declaring `@base-ui/react@^1.8.0` as its dependency, with no registry dependencies at that check.

- Retrieved JSON SHA-256: `de73f92f420b7539c4ffe0187f914036f1a1c4a90061a35927ef2d67545314a7`.
- Embedded source SHA-256: `6d7ffded6e93f4f398d7dbd35c74c87a991d9524195b8813b508fbea9ef2ae8c`.

Recheck the endpoint at installation time and record the actual artifact consumed if it has changed. Set up a supported React/shadcn consumer configuration, then use the shadcn CLI to install the public item URL. A local source copy from the monorepo does not satisfy this requirement. Inspect generated changes rather than running destructive initialization over an existing application. Use Bun and retain the resulting lockfile and installed source so a checkout does not depend on a live registry at runtime.

The current documented component consumes a hierarchy with globally unique IDs and supports controlled selection plus a visibility map keyed by leaf IDs. Missing leaf entries are visible; parent actions affect their descendant leaves; mixed parents become fully visible. Expansion and search are internal component state. Verify the actual API before integration.

Build an explicit adapter between the application's anatomical IDs, scene meshes, and tree nodes. Keep all relevant state in sync:

- Selecting a tree row highlights the corresponding scene structure or mapped group.
- Selecting a visible scene mesh updates the tree's controlled selection.
- Tree visibility affects scene leaves, including descendants of filtered or collapsed groups.
- Isolate, restore, and reset update the same visibility state and derived parent states.
- Search and panel collapse do not unexpectedly change model visibility or selection.
- Hidden selection and reveal behavior have clear, documented semantics.

Group names may be useful interface groupings without being anatomical containment relationships. For example, associated vessels or a ureter should not be presented as internal kidney tissue merely to create a deeper tree. Make this distinction clear in labels and documentation.

Prefer the published component without behavioral edits. Local styling or adaptation is permitted when necessary and documented. If a general defect is found, preserve a minimal reproduction and address it through a narrowly scoped upstream PR from an isolated monorepo worktree. Do not silently rewrite the component and call that successful registry reuse. Do not merge upstream changes or modify shared source checkouts.

Write `docs/REGISTRY_INTEGRATION.md` with actual installation commands, artifact provenance, data/mesh mappings, callback wiring, theme setup, behavior decisions, and any friction or follow-up fixes. The guide should help another developer repeat the integration.

## Anatomy assets and scope

Start with real redistributable source geometry. The BodyParts3D PART-OF catalog includes both kidneys, ureters, and renal arteries; this is evidence of candidate concepts, not independently verified meshes. In the catalog check preceding this task, searches did not establish usable renal cortex or pelvis geometry. Do not promise internal structures, cutaways, or microscopic anatomy before inspection.

Primary source candidates:

- [Official BodyParts3D archive downloads](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [PART-OF structure catalog](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_parts_list_e.txt)
- [PART-OF compound mappings](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_element_parts.txt)
- [PART-OF relationships](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_inclusion_relation_list.txt)
- [Official archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)

Inspect the applicable element mappings and actual geometry before defining scope. A useful initial release may include bilateral kidney surfaces and selected associated arteries, veins, or ureters where their geometry, alignment, and licensing are verified. Include only what produces a coherent anatomical presentation. Internal reveal is optional and must reflect represented anatomy; never fabricate interior layers to make a feature appear complete.

For every included asset, record source URL, source/version identifiers, applicable license, required attribution, checksums, modifications, and reproducible preparation steps. Source-specific licensing matters: the archive and older original-service downloads can carry different notices. Follow the terms of the exact downloaded asset and record discrepancies. Use ignored `.asset-cache/` for raw archives and intermediates, and keep practical runtime assets or a reproducible retrieval step in the checkout.

Preserve patient left/right and relative coordinates. Inspect frontal, posterior, and lateral views, verify displayed labels against source relationships, and avoid drawing parent compounds over their own constituent meshes. Colors used to distinguish structures must be described as illustrative where applicable.

## First-release experience

1. A composed overview of both kidneys and verified associated structures, with understandable loading feedback.
2. Rotate, zoom, reset, and compact named camera views; show Custom view after manual movement.
3. The installed registry anatomy tree in an initially collapsed panel, with useful search and synchronized selection/visibility.
4. A concise sourced description for the selected structure, with source attribution and review status available in the interface.
5. Reliable hide/isolate/restore actions; reset must recover from an empty or partially hidden scene.
6. A short guided exploration of actual represented anatomy. Preserve model alignment; add reveal or opacity controls only when genuinely useful and supported.
7. Keyboard-operable controls, mobile layouts, reduced-motion behavior, and clear missing-model/WebGL fallback states.

Use the current Heart application and screenshots as the primary visual reference: warm neutral full-height canvas, restrained typography, compact toolbar, simple OrganUI identity, and the model as the focus. Consult other organ implementations for engineering lessons, keeping their checkouts unchanged. Brand explorations remain proposals.

This is an educational interface demonstration. Do not imply diagnostic, physiological, or clinical validation. Nephron simulation, urine-flow simulation, disease overlays, patient-specific imaging, and surgical planning are outside this release. Record developer inspection and outstanding independent anatomical review separately.

## Acceptance and handoff

- Install and production-build independently with documented Bun commands and the frozen text lockfile.
- Confirm the public registry installation, preserve its provenance, and verify that no sibling files or private workspace imports are required.
- Verify runtime models, identifiers, mappings, laterality, attribution, and reproducible preparation.
- Test tree-to-scene and scene-to-tree selection; leaf, group, and mixed visibility; search with hidden/collapsed descendants; isolate/restore; named camera views; and reset.
- Inspect actual 3D rendering on desktop and mobile layouts in a browser, including keyboard/focus, loading/failure states, material console errors, and overflow. Distinguish viewport emulation from physical-device testing and automated accessibility checks from manual screen-reader testing.
- Run relevant type checks, build, model checks, and meaningful state/integration tests. Do not add tests that only restate implementation details.
- Update README, `docs/MODEL_PROVENANCE.md`, `docs/VERIFICATION.md`, and `docs/REGISTRY_INTEGRATION.md` with truthful results and screenshots.
- Work on a feature branch, commit and push the implementation, and open an unmerged PR against the starter repository's main branch for review. Attach every created PR to the focused Codex task.
- Public deployment, DNS changes, social posting, and merging are separate steps. Deliver a working local preview and the review PR; initialization alone is not completion.
