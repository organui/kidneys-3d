import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { unzipSync, strFromU8 } from "fflate";
import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import { structures } from "../src/anatomy";
import inputs from "./model-inputs.json";

const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

await Promise.all([
  mkdir(".asset-cache", { recursive: true }),
  mkdir("public/models", { recursive: true }),
  mkdir("docs/model-source", { recursive: true }),
]);

for (const input of inputs) {
  const target = Bun.file(`.asset-cache/${input.file}`);
  if (!(await target.exists())) {
    const response = await fetch(input.url);
    if (!response.ok) throw new Error(`${input.file}: HTTP ${response.status}`);
    await Bun.write(target, response);
  }
  const actual = sha256(new Uint8Array(await target.arrayBuffer()));
  if (actual !== input.sha256)
    throw new Error(
      `Checksum mismatch for ${input.file}; expected ${input.sha256}, received ${actual}`,
    );
}

const archive = unzipSync(
  new Uint8Array(
    await Bun.file(".asset-cache/partof_BP3D_4.0_obj_99.zip").arrayBuffer(),
  ),
);
const mappingRows = (
  await Bun.file(".asset-cache/partof_element_parts.txt").text()
)
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split("\t"));

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
const usedElements = new Set<string>();

const prepared = structures.map((structure) => {
  const elementIds = mappingRows
    .filter(([fma]) => fma === structure.fma)
    .map(([, , id]) => id);
  if (!elementIds.length)
    throw new Error(`No source mapping for ${structure.fma}`);
  const positions: number[] = [];
  const indices: number[] = [];
  const sources = elementIds.map((element) => {
    if (usedElements.has(element))
      throw new Error(`Source element assigned twice: ${element}`);
    usedElements.add(element);
    const bytes = archive[`partof_BP3D_4.0_obj_99/${element}.obj`];
    if (!bytes) throw new Error(`Missing source OBJ ${element}`);
    const offset = positions.length / 3;
    let vertices = 0;
    let triangles = 0;
    for (const line of strFromU8(bytes).split(/\r?\n/)) {
      const tokens = line.trim().split(/\s+/);
      if (tokens[0] === "v") {
        const point = tokens.slice(1, 4).map(Number);
        if (point.length !== 3 || !point.every(Number.isFinite))
          throw new Error(`Invalid vertex in ${element}`);
        point.forEach((value, axis) => {
          min[axis] = Math.min(min[axis], value);
          max[axis] = Math.max(max[axis], value);
        });
        positions.push(...point);
        vertices++;
      }
      if (tokens[0] === "f") {
        const face = tokens.slice(1).map((token) => {
          const index = Number(token.split("/")[0]);
          return offset + (index > 0 ? index - 1 : vertices + index);
        });
        for (let index = 1; index < face.length - 1; index++) {
          indices.push(face[0], face[index], face[index + 1]);
          triangles++;
        }
      }
    }
    return {
      element,
      bytes: bytes.length,
      sha256: sha256(bytes),
      vertices,
      triangles,
    };
  });
  return { structure, positions, indices, sources };
});

const center = min.map((value, axis) => (value + max[axis]) / 2);
const scale = 0.025;
const document = new Document();
document.getRoot().getAsset().copyright =
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International";
const scene = document.createScene("OrganUI Kidneys — BodyParts3D 4.0");
const buffer = document.createBuffer();

for (const { structure, positions, indices } of prepared) {
  const transformed = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    transformed[index] = (positions[index] - center[0]) * scale;
    transformed[index + 1] = (positions[index + 2] - center[2]) * scale;
    transformed[index + 2] = -(positions[index + 1] - center[1]) * scale;
  }
  const geometry = new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(transformed, 3))
    .setIndex(indices);
  geometry.computeVertexNormals();
  const color = new Color(structure.color);
  const material = document
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.72)
    .setMetallicFactor(0)
    .setDoubleSided(true);
  const primitive = document
    .createPrimitive()
    .setAttribute(
      "POSITION",
      document
        .createAccessor()
        .setType("VEC3")
        .setArray(transformed)
        .setBuffer(buffer),
    )
    .setAttribute(
      "NORMAL",
      document
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(geometry.getAttribute("normal").array))
        .setBuffer(buffer),
    )
    .setIndices(
      document
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint32Array(indices))
        .setBuffer(buffer),
    )
    .setMaterial(material);
  scene.addChild(
    document
      .createNode(structure.id)
      .setMesh(document.createMesh(structure.id).addPrimitive(primitive))
      .setExtras({ structureId: structure.id, fma: structure.fma }),
  );
  geometry.dispose();
}

const runtime = await new NodeIO().writeBinary(document);
await Bun.write("public/models/kidneys.glb", runtime);

const manifest = {
  dataset: "BodyParts3D",
  version: "4.0",
  variant: "PART-OF geometry archive, polygon reduction rate 99%",
  retrieved: "2026-09-26",
  license: "CC-BY-4.0",
  licenseUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  credit: document.getRoot().getAsset().copyright,
  inputs,
  transform: {
    sourceBoundsMm: { min, max },
    centerMm: center,
    scale,
    axes: "[x, z, -y]",
  },
  runtime: {
    file: "kidneys.glb",
    bytes: runtime.byteLength,
    sha256: sha256(runtime),
  },
  structures: prepared.map(({ structure, sources }) => ({
    id: structure.id,
    fma: structure.fma,
    sourceName: structure.sourceName,
    sources,
  })),
};
await Bun.write(
  "public/models/manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await Bun.write(
  "docs/model-source/selected-mappings.tsv",
  `concept id\tname\telement file id\n${structures
    .flatMap((structure) =>
      mappingRows
        .filter(([fma]) => fma === structure.fma)
        .map((row) => row.join("\t")),
    )
    .join("\n")}\n`,
);
console.log(
  `Prepared ${structures.length} structures from ${usedElements.size} source meshes: ${runtime.byteLength.toLocaleString()} bytes, SHA-256 ${sha256(runtime)}`,
);
