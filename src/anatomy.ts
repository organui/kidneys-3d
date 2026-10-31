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
  note: string;
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
      "One of the two bean-shaped organs that filter blood and make urine. It sits a little lower than the left kidney because the liver lies above it.",
    note: "One surface mesh. The cortex, medulla and renal pelvis inside it are not separate structures.",
  },
  {
    id: "left-kidney",
    name: "Left kidney",
    sourceName: "left kidney",
    fma: "FMA7205",
    color: "#b56256",
    group: "Kidneys",
    description:
      "Lies against the back wall of the abdomen beside the spine, a little higher than the right kidney. Its vessels and ureter leave from the hilum on its inner border.",
    note: "One surface mesh. The cortex, medulla and renal pelvis inside it are not separate structures.",
  },
  {
    id: "right-ureter",
    name: "Right ureter",
    sourceName: "right ureter",
    fma: "FMA15571",
    color: "#d09b73",
    group: "Urinary tract",
    description:
      "A narrow muscular tube, about 25 to 30 cm long, that carries urine from the right kidney down to the bladder by waves of contraction.",
    note: "Shown down to where the source ends it, just above the bladder. The bladder is shown in the bladder explorer.",
  },
  {
    id: "left-ureter",
    name: "Left ureter",
    sourceName: "left ureter",
    fma: "FMA15572",
    color: "#dcad86",
    group: "Urinary tract",
    description:
      "Carries urine from the left kidney to the bladder. It runs down over the psoas muscle and crosses into the pelvis near the split of the common iliac artery.",
    note: "Shown down to where the source ends it, just above the bladder. The bladder is shown in the bladder explorer.",
  },
  {
    id: "right-renal-artery",
    name: "Right renal artery",
    sourceName: "right renal artery",
    fma: "FMA14752",
    color: "#bd514c",
    group: "Arterial supply",
    description:
      "Carries blood from the aorta to the right kidney. It is longer than the left artery and passes behind the inferior vena cava.",
    note: "The aorta it branches from is not included, so the two arteries meet at the midline. Its branches are grouped with the trunk.",
  },
  {
    id: "left-renal-artery",
    name: "Left renal artery",
    sourceName: "left renal artery",
    fma: "FMA14753",
    color: "#cf6960",
    group: "Arterial supply",
    description:
      "Carries blood from the aorta to the left kidney. It is shorter than the right artery because the aorta lies left of the midline.",
    note: "The aorta it branches from is not included, so the two arteries meet at the midline. Its branches are grouped with the trunk.",
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
    label: "Urinary tract",
    children: [
      { id: "right-ureter", label: "Right ureter" },
      { id: "left-ureter", label: "Left ureter" },
    ],
  },
  {
    id: "group-arterial-supply",
    label: "Renal arteries",
    children: [
      { id: "right-renal-artery", label: "Right renal artery" },
      { id: "left-renal-artery", label: "Left renal artery" },
    ],
  },
] as const;

export const referenceUrl =
  "https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works";

export type ViewName =
  "Anterior" | "Posterior" | "Left lateral" | "Right lateral";

export const tour = [
  {
    title: "Paired position",
    nodeId: "group-kidneys",
    view: "Anterior" as ViewName,
    isolate: false,
    text: "Compare the two kidneys from the front. The patient’s right kidney appears on your left and sits a little lower, below the liver.",
  },
  {
    title: "Posterior relationship",
    nodeId: "group-kidneys",
    view: "Posterior" as ViewName,
    isolate: true,
    text: "From behind, the hilum on each kidney’s inner border faces the spine. The kidneys rest against the muscles of the back wall of the abdomen.",
  },
  {
    title: "Ureter paths",
    nodeId: "group-urinary-tract",
    view: "Anterior" as ViewName,
    isolate: true,
    text: "Follow each ureter down from the kidney. Stones most often lodge where it leaves the kidney, where it crosses into the pelvis, and where it enters the bladder.",
  },
  {
    title: "Arterial supply",
    nodeId: "group-arterial-supply",
    view: "Anterior" as ViewName,
    isolate: true,
    text: "Each renal artery enters its kidney at the hilum. The kidneys receive about a fifth of the blood the heart pumps.",
  },
] as const;
