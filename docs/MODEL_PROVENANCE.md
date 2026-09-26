# Model provenance and preparation

## Exact source and license

The runtime model is a curated subset of **BodyParts3D 4.0** from the official [LSDB archive download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html). Inputs were retrieved on 2026-09-26 from the PART-OF geometry and mapping files. The archive label “polygon reduction rate = 99%” is the source’s reduction label, not an OrganUI anatomical-accuracy claim.

The official [license page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) grants Creative Commons Attribution 4.0 International and specifies this credit:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

A byte snapshot of that page is tracked at `docs/model-source/archive-license.html.txt` (SHA-256 `2be32135ae9b7c39ef7e4052b9998161e258c2b941cfe2f599ac944cabbe73b7`). It is provenance text, not served HTML. The MIT code license does not cover the model.

## Inspected scope and mapping

The official PART-OF catalog and OBJ archive provided aligned geometry for the six chosen concepts:

| Display structure  | FMA concept | Source elements                        |
| ------------------ | ----------- | -------------------------------------- |
| Right kidney       | FMA7204     | FJ3147                                 |
| Left kidney        | FMA7205     | FJ3145                                 |
| Right ureter       | FMA15571    | FJ3146                                 |
| Left ureter        | FMA15572    | FJ3144                                 |
| Right renal artery | FMA14752    | FJ2038, FJ3576, FJ3581, FJ3582, FJ3584 |
| Left renal artery  | FMA14753    | FJ2046, FJ3467, FJ3476, FJ3481         |

The full row selection is tracked in `docs/model-source/selected-mappings.tsv`. Each original OBJ checksum, size, vertex count, and triangle count is recorded in `public/models/manifest.json`.

The renal artery concept includes its mapped source elements as one selectable object per side. No element is assigned to more than one structure. Both kidneys and ureters are independent source meshes. Browser inspection confirmed their relative fit and the expected anterior-view convention: patient right is on the viewer’s left and the right kidney sits slightly lower.

Omitted after inspection: internal kidney anatomy, renal pelvis geometry, renal veins, aorta, inferior vena cava, bladder, urethra, surrounding organs, connective tissue, and body context. The model does not imply these structures are absent in a body; they are outside this selection. Ureter ends and arterial extents reflect source/selection boundaries. Colors are illustrative.

## Pinned inputs

| Input                                | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `partof_BP3D_4.0_obj_99.zip`         | `9fbc713fffeee924a5a657d9813d84d7eb957bded63adb854931dd5e3eb61c97` |
| `partof_element_parts.txt`           | `3f5f6df1028eb122b30de77c711597b6bb8e5541658e5985859fd228adbf88ea` |
| `partof_parts_list_e.txt`            | `9224080557053e6f1322f1e13ab27f0ecde0db19bb3b505f0631afad230eeebd` |
| `partof_inclusion_relation_list.txt` | `1b40738270931e3c1d955ce34e0fce0d8d10d8c5ad543463e40b4b4c0243007c` |

The exact URLs are stored in `scripts/model-inputs.json`. Preparation refuses changed upstream content before conversion.

## Reproduce the runtime

```sh
bun install --frozen-lockfile
bun run prepare:model
bun run verify:model
```

Preparation:

1. verifies each official input checksum;
2. resolves each chosen FMA concept through the PART-OF mapping table;
3. extracts only mapped OBJ elements and triangulates their existing polygon faces;
4. rejects missing elements and duplicate ownership;
5. centers the complete selection on its shared source bounds;
6. transforms source `(x,y,z)` to display `(x,z,-y)` and uniformly scales by `0.025`;
7. recomputes normals, assigns illustrative materials, and merges mapped elements per selectable concept;
8. writes stable structure/FMA extras to each GLB node and emits the manifest.

The transform preserves patient left/right and all relative positions. Centering and uniform display scaling do not reshape anatomy and are not measurement calibration. There is no sculpting, synthetic anatomy, additional decimation, texture generation, or physiological animation.

The tracked runtime `public/models/kidneys.glb` is 380,208 bytes with SHA-256 `124f92d7c110071f18b0b765dc5ada53ec845fa9ce6981cd684e6ec6a60dd3c0`. It contains six nodes and 14,390 triangles.

## Text sources and review status

Concise structure descriptions use the US National Institute of Diabetes and Digestive and Kidney Diseases’ [urinary tract overview](https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works) and the source geometry/catalog itself. The laterality note is consistent with the US National Cancer Institute SEER [kidney anatomy overview](https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html).

Completed: source license review, identifier/mapping checks, per-element geometry checks, runtime checksum and topology verification, laterality inspection, and desktop/mobile visual inspection. Not completed: independent clinical anatomy review, diagnostic validation, physiological validation, or patient-specific comparison.
