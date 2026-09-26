import type { AnatomyNode } from "./components/ui/anatomy-tree";

export type StructureId =
  | "right-kidney"
  | "left-kidney"
  | "right-ureter"
  | "left-ureter"
  | "right-renal-artery"
  | "left-renal-artery";

export type Structure = {
  id: StructureId;
  name: string;
  sourceName: string;
  fma: string;
  color: string;
  group: "Kidneys" | "Urinary tract" | "Arterial supply";
  description: string;
};

export const structures: readonly Structure[] = [
  {
    id: "right-kidney",
    name: "Right kidney",
    sourceName: "right kidney",
    fma: "FMA7204",
    color: "#9f4e45",
    group: "Kidneys",
    description:
      "The patient’s right kidney is one of the paired organs that filter blood and produce urine. In this source body it sits slightly lower than the left kidney.",
  },
  {
    id: "left-kidney",
    name: "Left kidney",
    sourceName: "left kidney",
    fma: "FMA7205",
    color: "#b56256",
    group: "Kidneys",
    description:
      "The patient’s left kidney is shown in its source alignment beside the spine. This surface mesh does not expose cortex, medulla, or the renal pelvis.",
  },
  {
    id: "right-ureter",
    name: "Right ureter",
    sourceName: "right ureter",
    fma: "FMA15571",
    color: "#d09b73",
    group: "Urinary tract",
    description:
      "The right ureter is the narrow muscular tube that carries urine from the right kidney toward the bladder. The bladder is outside this release’s represented scope.",
  },
  {
    id: "left-ureter",
    name: "Left ureter",
    sourceName: "left ureter",
    fma: "FMA15572",
    color: "#dcad86",
    group: "Urinary tract",
    description:
      "The left ureter descends from the left kidney toward the bladder. Its lower end is truncated here because the bladder is not included in the selected geometry.",
  },
  {
    id: "right-renal-artery",
    name: "Right renal artery",
    sourceName: "right renal artery",
    fma: "FMA14752",
    color: "#bd514c",
    group: "Arterial supply",
    description:
      "The right renal artery supplies the right kidney. The source concept combines its represented trunk and mapped branches into one selectable scene object.",
  },
  {
    id: "left-renal-artery",
    name: "Left renal artery",
    sourceName: "left renal artery",
    fma: "FMA14753",
    color: "#cf6960",
    group: "Arterial supply",
    description:
      "The left renal artery supplies the left kidney. Color is illustrative and is used to distinguish the arterial meshes from adjacent surfaces.",
  },
] as const;

export const byId = Object.fromEntries(
  structures.map((structure) => [structure.id, structure]),
) as Record<StructureId, Structure>;

export const anatomyTree: readonly AnatomyNode[] = [
  {
    id: "group-kidneys",
    label: "Kidneys",
    children: [
      { id: "right-kidney", label: "Right kidney" },
      { id: "left-kidney", label: "Left kidney" },
    ],
  },
  {
    id: "group-urinary-tract",
    label: "Urinary tract · represented",
    children: [
      { id: "right-ureter", label: "Right ureter" },
      { id: "left-ureter", label: "Left ureter" },
    ],
  },
  {
    id: "group-arterial-supply",
    label: "Arterial supply · represented",
    children: [
      { id: "right-renal-artery", label: "Right renal artery" },
      { id: "left-renal-artery", label: "Left renal artery" },
    ],
  },
] as const;

export const referenceUrl =
  "https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works";

export type ViewName =
  "Anterior" | "Posterior" | "Patient left" | "Patient right";

export const tour = [
  {
    title: "Paired position",
    nodeId: "group-kidneys",
    view: "Anterior" as ViewName,
    isolate: false,
    text: "Compare the paired kidney surfaces. Patient right appears on your left in the anterior view and sits slightly lower in this source body.",
  },
  {
    title: "Posterior relationship",
    nodeId: "group-kidneys",
    view: "Posterior" as ViewName,
    isolate: true,
    text: "From behind, the medial indentations face inward. Internal kidney structures are not represented by these surface meshes.",
  },
  {
    title: "Ureter paths",
    nodeId: "group-urinary-tract",
    view: "Anterior" as ViewName,
    isolate: true,
    text: "Follow the paired ureters downward. Their paths continue toward a bladder that is intentionally outside this model selection.",
  },
  {
    title: "Arterial supply",
    nodeId: "group-arterial-supply",
    view: "Anterior" as ViewName,
    isolate: true,
    text: "The represented renal artery elements approach the medial side of each kidney. They are grouped for the interface, not presented as kidney tissue.",
  },
] as const;
