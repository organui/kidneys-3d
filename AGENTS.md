# OrganUI Kidneys development

Read `docs/BUILD_BRIEF.md` before implementation.

- Build in this standalone repository, with its own dependencies, text Bun lockfile, application, runtime assets, and Git history. Do not depend on neighboring checkouts.
- Install anatomy-tree through the published OrganUI registry using the shadcn CLI. Do not copy the component from a local workspace or replace it with a new tree implementation.
- Keep the registry component reusable. Put scene-specific mappings and integration state in application code. Record the retrieved artifact, installation command, checksum, and any intentional local edits.
- Follow relevant shadcn, React, browser, and verification skills. Use a compatible Vite/React/TypeScript/Three.js stack with Bun, Base UI, and the stylesheet setup required by the component.
- Match the current Heart explorer's warm neutral canvas, restrained typography, compact controls, and initially collapsed Anatomy panel. Sibling applications and brand proposals are reference material; do not modify them or adopt an unapproved brand direction.
- Inspect real anatomy geometry and source mappings before defining selectable structures or a hierarchy. UI groups must not imply unsupported anatomical part-of relationships.
- Preserve patient laterality and relative alignment. Do not fabricate renal cortex, medulla, nephrons, cavities, branches, or cut surfaces absent from the source.
- Check exact source redistribution terms and preserve provenance and attribution separately from the code license. Document the actual content-review scope without claiming clinical validation.
- Keep selection and visibility synchronized between the scene, registry tree, isolate/restore actions, guided views, and reset. Use stable IDs and avoid overlapping compound and leaf geometry.
- Support keyboard interaction, mobile layouts, reduced motion, loading feedback, missing models, and unavailable WebGL. Keep anatomy information available without relying on the canvas.
- Verify an independent clean install, production build, model mappings, and meaningful interaction behavior in an actual browser. Report physical-device and screen-reader coverage honestly.
- Use free local ports and leave other tasks' services running. Keep generated artifacts and large raw downloads out of ordinary Git history.
- If a real registry defect is found, document it with a reproduction. Prepare any necessary upstream fix in a separate isolated monorepo worktree and unmerged PR; preserve all existing checkouts and unrelated work.
- Keep documentation truthful about what is implemented, tested, published, and still pending.
