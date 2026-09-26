# Verification report

Verified locally on 2026-09-26.

## Story

The user opens a standalone explorer, loads a tracked BodyParts3D GLB, selects and controls the same stable anatomical leaves through either the 3D scene or published anatomy tree, and receives a consistent accessible text experience even when the model is unavailable.

## Automated checks

| Check                                                     | Result                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| `bun run typecheck`                                       | Pass                                                        |
| `bun run test`                                            | Pass: 2 files, 9 adapter/state, camera, and picking tests    |
| `bun run build`                                           | Pass: Vite production build                                 |
| `bun run verify:model`                                    | Pass: 6 mappings, 14,390 triangles, 380,208 bytes, checksum |
| `bun install --frozen-lockfile` in independent clean copy | Pass                                                        |
| Clean-copy typecheck/test/model verification/build        | Pass                                                        |

The production build reports a large-chunk advisory for the Three.js viewer bundle. It is a performance advisory, not a runtime or correctness failure.

Six viewer regression tests use real Three.js cameras, OrbitControls, ray intersections, and the tracked GLB: preset/zoom preservation through resizes, custom orbit/target preservation, reset framing, lateral camera alignment with model coordinates, hidden foreground picking, and hidden ancestor filtering.

## Browser checks

Tested against the local Vite app at desktop size and a 390×844 responsive viewport in the Codex in-app Chromium browser.

| Behavior                       | Result / evidence                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial state                  | Pass: warm neutral full-height stage, anatomy panel closed, six structures visible                                                                |
| Real geometry                  | Pass: both kidneys, ureters, and bilateral mapped renal artery geometry render in shared alignment                                                |
| Tree → scene                   | Pass: selecting Right kidney set the controlled row and scene highlight                                                                           |
| Scene → tree                   | Pass: clicking the patient-right kidney selected `Right kidney`, opened the panel, and marked the tree row selected                               |
| Leaf visibility                | Pass: hiding Right kidney produced 5/6 visible and retained hidden selection                                                                      |
| Mixed parent state             | Pass: Kidneys reported `aria-checked="mixed"` with one hidden descendant                                                                          |
| Filtered descendant            | Pass: search for `right kidney` preserved its hidden state and parent mixed state                                                                 |
| Group/keyboard visibility      | Pass: Space on filtered Urinary tract group hid both descendant leaves                                                                            |
| Isolate / restore              | Pass: leaf isolation produced 1/6 visible; restore returned 6/6                                                                                   |
| Reset                          | Pass: restored all leaves, cleared selection/tour/internal tree search, and returned to Anterior                                                  |
| Camera                         | Pass: keyboard rotation changed the label to Custom view; Posterior preset restored named state; zoom/reset controls enabled after load           |
| Camera across layout changes   | Pass: zoomed Posterior and custom keyboard orbit survived opening the desktop anatomy panel; Posterior orientation and relative zoom survived a 390×844 resize and return to desktop |
| Lateral presets                | Pass: clicking the foremost kidney in Patient left selected Left kidney; Patient right selected Right kidney |
| Hidden-surface picking         | Pass: after hiding Right kidney, clicking its former surface did not select it; clicking the exposed Right ureter selected that visible structure. Tree selection of the hidden kidney remained available, and showing it restored scene picking |
| Guided tour                    | Pass: shared selection, camera, and isolation state uses the same adapter/actions                                                                 |
| Mobile                         | Pass: 390×844 overview and bottom anatomy sheet; no document or panel horizontal overflow                                                         |
| Keyboard/focus                 | Pass: named header controls at mobile size, tree roving focus keys, Space visibility action, and focused-canvas arrow controls                    |
| Reduced motion                 | Pass by code inspection: orbit damping is disabled for `prefers-reduced-motion`; CSS transitions/animation durations are removed                  |
| Missing model                  | Pass: temporarily removed GLB produced the designed alert/retry state while anatomy access remained available; file restored and reload recovered |
| WebGL unavailable/context lost | Fallback and context-loss listener implemented; not force-disabled in this browser session                                                        |
| Console                        | No application errors. React Three Fiber emitted the upstream `THREE.Clock` deprecation warning                                                   |

Screenshots:

These screenshots document the initial explorer layout. The camera and picking follow-up was verified separately in the production preview; no replacement screenshots were needed for these behavior changes.

- `docs/screenshots/desktop.jpg`
- `docs/screenshots/anatomy.jpg`
- `docs/screenshots/mobile.jpg`
- `docs/screenshots/mobile-anatomy.jpg`

## React-quality review

Reviewed after implementation using the React best-practices checklist. Stable data and lookup maps are module-level; scene highlighting uses a memoized leaf set; frequently changing camera state remains inside Three/OrbitControls rather than React; callbacks that need current values use refs; global media listeners and controls are cleaned up; no data-fetch waterfall exists; and heavy geometry is a static runtime asset rather than React state serialization.

## Limits

- Responsive viewport emulation is not physical-phone testing.
- Keyboard paths and semantic output were inspected, but no manual VoiceOver, NVDA, JAWS, or TalkBack session was completed.
- No independent clinical anatomy expert reviewed the selected source subset or descriptions.
- WebGL context-loss handling was reviewed in code but not forced through a browser/driver failure mode.
- The upstream Three.js clock deprecation warning remains until React Three Fiber updates its internal timing API.
