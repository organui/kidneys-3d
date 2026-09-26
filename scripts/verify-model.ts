import { createHash } from "node:crypto";
import { NodeIO } from "@gltf-transform/core";
import manifest from "../public/models/manifest.json";
import { structures } from "../src/anatomy";

const bytes = new Uint8Array(
  await Bun.file("public/models/kidneys.glb").arrayBuffer(),
);
const actualHash = createHash("sha256").update(bytes).digest("hex");
if (actualHash !== manifest.runtime.sha256)
  throw new Error("Runtime model checksum mismatch");

const document = await new NodeIO().readBinary(bytes);
const nodes = document.getRoot().listNodes();
if (nodes.length !== structures.length)
  throw new Error(
    `Expected ${structures.length} structure nodes, received ${nodes.length}`,
  );

let triangles = 0;
for (const structure of structures) {
  const node = nodes.find((candidate) => candidate.getName() === structure.id);
  if (!node || node.getExtras().fma !== structure.fma)
    throw new Error(`Missing or mismatched structure ${structure.id}`);
  const primitives = node.getMesh()?.listPrimitives() ?? [];
  if (!primitives.length) throw new Error(`No geometry for ${structure.id}`);
  for (const primitive of primitives) {
    const positions = primitive.getAttribute("POSITION")?.getArray();
    const indices = primitive.getIndices()?.getArray();
    if (
      !positions?.length ||
      !indices?.length ||
      !Array.from(positions).every(Number.isFinite)
    )
      throw new Error(`Invalid geometry for ${structure.id}`);
    if (
      Array.from(indices).some(
        (index) => index < 0 || index >= positions.length / 3,
      )
    )
      throw new Error(`Out-of-range face index for ${structure.id}`);
    triangles += indices.length / 3;
  }
}

console.log(
  `Verified ${nodes.length} structure mappings, ${triangles.toLocaleString()} triangles, ${bytes.length.toLocaleString()} bytes, and runtime SHA-256.`,
);
