import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Focus,
  Info,
  Menu,
  Minus,
  PanelRightClose,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { AnatomyTree, visibilityState } from "./components/ui/anatomy-tree";
import {
  allStructureIds,
  isolateNode,
  normalizeVisibility,
  revealNode,
  sceneIdsForNode,
  visibleCount,
} from "./anatomy-adapter";
import {
  anatomyTree,
  byId,
  referenceUrl,
  structures,
  tour,
  type ViewName,
} from "./anatomy";
import Viewer, { type ViewerHandle } from "./Viewer";

const groupCopy: Record<string, { name: string; description: string }> = {
  "group-kidneys": {
    name: "Kidneys",
    description:
      "The paired kidney surface meshes are anatomical structures. Their grouping here reflects the pair, not a larger enclosing tissue.",
  },
  "group-urinary-tract": {
    name: "Urinary tract · represented",
    description:
      "An interface grouping for the two represented ureters. The bladder and urethra are not included in this release.",
  },
  "group-arterial-supply": {
    name: "Arterial supply · represented",
    description:
      "An interface grouping for the represented left and right renal artery elements. It is not anatomical containment within kidney tissue.",
  },
};

const views: ViewName[] = [
  "Anterior",
  "Posterior",
  "Patient left",
  "Patient right",
];

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<ViewName | "Custom view">("Anterior");
  const [ready, setReady] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const controls = useRef<ViewerHandle | null>(null);
  const about = useRef<HTMLDialogElement>(null);
  const selectedLeaves = useMemo(
    () => sceneIdsForNode(selectedId),
    [selectedId],
  );
  const selectedNode = useMemo(
    () =>
      anatomyTree
        .flatMap((root) => [root, ...(root.children ?? [])])
        .find(({ id }) => id === selectedId),
    [selectedId],
  );
  const selected =
    selectedId && selectedId in byId
      ? byId[selectedId as keyof typeof byId]
      : null;
  const selectedGroup = selectedId ? groupCopy[selectedId] : null;
  const selectedVisibility = selectedNode
    ? visibilityState(selectedNode, visibility)
    : true;

  function choose(id: string) {
    setSelectedId(id);
    const hidden = sceneIdsForNode(id).every(
      (leaf) => visibility[leaf] === false,
    );
    const structure = id in byId ? byId[id as keyof typeof byId] : null;
    setAnnouncement(
      `${structure?.name ?? groupCopy[id]?.name ?? id} selected${hidden ? " and currently hidden" : ""}.`,
    );
  }

  function restore() {
    setVisibility({});
    setAnnouncement(
      `All ${structures.length} represented structures restored.`,
    );
  }

  function reset() {
    setSelectedId(null);
    setVisibility({});
    setTourStep(null);
    setTreeVersion((version) => version + 1);
    controls.current?.preset("Anterior");
    setView("Anterior");
    setAnnouncement(
      "Explorer reset. All structures visible in the anterior view.",
    );
  }

  function setPreset(next: ViewName) {
    controls.current?.preset(next);
    setView(next);
  }

  function startTour(index: number) {
    const step = tour[index];
    setTourStep(index);
    setSelectedId(step.nodeId);
    setVisibility(step.isolate ? isolateNode(step.nodeId) : {});
    setPreset(step.view);
    setPanelOpen(true);
    setAnnouncement(`Tour step ${index + 1} of ${tour.length}: ${step.title}.`);
  }

  function toggleSelected() {
    if (!selectedId || !selectedNode) return;
    const show = selectedVisibility !== true;
    const next = normalizeVisibility(visibility);
    for (const id of selectedLeaves) next[id] = show;
    setVisibility(next);
    setAnnouncement(
      `${selected?.name ?? selectedGroup?.name} ${show ? "shown" : "hidden"}.`,
    );
  }

  return (
    <>
      <a
        href="#anatomy-panel"
        className="skip-link"
        onClick={() => setPanelOpen(true)}
      >
        Skip to anatomy text
      </a>
      <header className="site-header">
        <a href="./" className="brand" aria-label="OrganUI Kidneys home">
          <span className="brand-mark" aria-hidden="true">
            ◖◗
          </span>
          <span>
            Organ<span className="brand-light">UI</span>
          </span>
          <span className="brand-divider">/</span>
          <span className="brand-product">Kidneys</span>
        </a>
        <nav aria-label="Project">
          <button
            className="quiet-button about-button"
            aria-label="About this model"
            onClick={() => about.current?.showModal()}
          >
            <Info size={15} /> <span>About this model</span>
          </button>
          <button
            className="panel-toggle"
            aria-label={
              panelOpen ? "Close anatomy panel" : "Open anatomy panel"
            }
            aria-expanded={panelOpen}
            aria-controls="anatomy-panel"
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelOpen ? <PanelRightClose size={17} /> : <Menu size={17} />}
            <span>Anatomy</span>
          </button>
        </nav>
      </header>

      <main className={`explorer ${panelOpen ? "panel-open" : ""}`}>
        <section className="stage" aria-labelledby="page-title">
          <h1 id="page-title" className="sr-only">
            Kidney anatomy explorer
          </h1>
          <Viewer
            selectedId={selectedId}
            visibility={visibility}
            onSelect={(id) => {
              choose(id);
              setPanelOpen(true);
            }}
            onReady={setReady}
            onFreeView={() => setView("Custom view")}
            controlsRef={controls}
          />
          <div className="scene-status">
            <span className={`status-dot ${ready ? "" : "pending"}`} />
            {ready
              ? `${visibleCount(visibility)} of ${structures.length} structures visible`
              : "Anatomy text always available"}
            {visibleCount(visibility) < structures.length ? (
              <button onClick={restore}>Restore all</button>
            ) : null}
          </div>

          {selectedId ? (
            <div className="selection-chip">
              {selected ? (
                <span
                  className="color-dot"
                  style={{ background: selected.color }}
                />
              ) : null}
              <button onClick={() => setPanelOpen(true)}>
                {selected?.name ?? selectedGroup?.name}
              </button>
              {selectedVisibility === false ? (
                <EyeOff size={13} />
              ) : (
                <Check size={13} />
              )}
              <button
                aria-label="Clear selection"
                onClick={() => setSelectedId(null)}
              >
                <X size={14} />
              </button>
            </div>
          ) : null}

          {visibleCount(visibility) === 0 ? (
            <div className="empty-scene">
              <EyeOff size={23} />
              <p>Every represented structure is hidden.</p>
              <button className="primary-action" onClick={restore}>
                Restore all structures
              </button>
            </div>
          ) : null}

          <div className="camera-bar" aria-label="Camera controls">
            <details className="view-picker">
              <summary>
                {view}
                <ChevronDown size={14} />
              </summary>
              <div className="view-options">
                {views.map((option) => (
                  <button
                    key={option}
                    aria-current={view === option ? "true" : undefined}
                    onClick={() => setPreset(option)}
                  >
                    {option}
                    {view === option ? <Check size={13} /> : null}
                  </button>
                ))}
              </div>
            </details>
            <div
              className="camera-actions"
              role="group"
              aria-label="Zoom and reset"
            >
              <button
                aria-label="Zoom in"
                title="Zoom in"
                disabled={!ready}
                onClick={() => controls.current?.zoom(0.85)}
              >
                <Plus size={17} />
              </button>
              <button
                aria-label="Zoom out"
                title="Zoom out"
                disabled={!ready}
                onClick={() => controls.current?.zoom(1.18)}
              >
                <Minus size={17} />
              </button>
              <button
                aria-label="Reset explorer"
                title="Reset explorer"
                onClick={reset}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <p id="model-instructions" className="sr-only">
            Drag to rotate and scroll or pinch to zoom. Focus this region and
            use arrow keys to rotate; plus and minus zoom.
          </p>
        </section>

        <aside
          id="anatomy-panel"
          className="anatomy-panel"
          aria-hidden={!panelOpen}
        >
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STRUCTURE EXPLORER</span>
              <h2>Anatomy</h2>
            </div>
            <button
              aria-label="Close anatomy panel"
              onClick={() => setPanelOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <section className="selection-card" aria-live="polite">
            {selectedId ? (
              <>
                <span className="eyebrow">
                  {selected?.group ?? "INTERFACE GROUP"}
                </span>
                <h3>{selected?.name ?? selectedGroup?.name}</h3>
                <p>{selected?.description ?? selectedGroup?.description}</p>
                {selected ? (
                  <p className="source-id">
                    BodyParts3D · {selected.fma} · patient{" "}
                    {selected.name.startsWith("Right") ? "right" : "left"}
                  </p>
                ) : null}
                <div className="structure-actions">
                  <button onClick={toggleSelected}>
                    {selectedVisibility === true ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                    {selectedVisibility === true ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => {
                      setVisibility(isolateNode(selectedId));
                      setAnnouncement(
                        `${selected?.name ?? selectedGroup?.name} isolated.`,
                      );
                    }}
                  >
                    <Focus size={14} /> Isolate
                  </button>
                  <button onClick={restore}>
                    <RotateCcw size={14} /> Restore
                  </button>
                </div>
                {selectedVisibility !== true ? (
                  <button
                    className="reveal-link"
                    onClick={() =>
                      setVisibility(revealNode(selectedId, visibility))
                    }
                  >
                    Reveal selected structure
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <span className="eyebrow">GET ORIENTED</span>
                <h3>Paired kidneys and connected paths</h3>
                <p>
                  Select a surface in 3D or a row below. The tree remains a
                  complete text alternative when 3D is unavailable.
                </p>
              </>
            )}
          </section>

          <AnatomyTree
            key={treeVersion}
            data={anatomyTree}
            selectedId={selectedId}
            onSelectionChange={choose}
            visibility={visibility}
            onVisibilityChange={(next) => {
              setVisibility(next);
              setAnnouncement(
                `${visibleCount(next)} of ${structures.length} structures visible.`,
              );
            }}
            defaultExpandedIds={[
              "group-kidneys",
              "group-urinary-tract",
              "group-arterial-supply",
            ]}
            label="Kidney explorer anatomy"
            className="registry-tree"
          />

          <section className="tour-card">
            <div className="tour-title">
              <BookOpen size={16} />
              <div>
                <span className="eyebrow">GUIDED TOUR</span>
                <h3>
                  {tourStep === null
                    ? "Explore represented anatomy"
                    : tour[tourStep].title}
                </h3>
              </div>
            </div>
            <p>
              {tourStep === null
                ? "Four short stops explain what the source geometry does—and does not—show."
                : tour[tourStep].text}
            </p>
            <div className="tour-controls">
              {tourStep === null ? (
                <button className="primary-action" onClick={() => startTour(0)}>
                  Start tour
                </button>
              ) : (
                <>
                  <button
                    aria-label="Previous tour stop"
                    disabled={tourStep === 0}
                    onClick={() => startTour(tourStep - 1)}
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <span>
                    {tourStep + 1} / {tour.length}
                  </span>
                  {tourStep < tour.length - 1 ? (
                    <button
                      aria-label="Next tour stop"
                      onClick={() => startTour(tourStep + 1)}
                    >
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTourStep(null);
                        restore();
                      }}
                    >
                      Finish
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </aside>
      </main>

      <footer>
        <span>Educational anatomy interface · not clinically validated</span>
        <a href={referenceUrl} target="_blank" rel="noreferrer">
          Anatomy reference
        </a>
      </footer>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <dialog
        ref={about}
        className="about-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">ABOUT THIS MODEL</span>
            <h2>Verified source, limited scope</h2>
          </div>
          <button
            aria-label="Close dialog"
            onClick={() => about.current?.close()}
          >
            <X size={18} />
          </button>
        </div>
        <p>
          This explorer uses selected BodyParts3D 4.0 PART-OF geometry: both
          kidney surfaces, both ureters, and source-mapped renal artery
          elements.
        </p>
        <p>
          It does not show internal renal anatomy, a cutaway, urine flow,
          surrounding organs, or patient-specific imaging. Colors are
          illustrative. Developer source and geometry checks are complete;
          independent anatomical expert review is not.
        </p>
        <p className="attribution">
          BodyParts3D, © The Database Center for Life Science, licensed under CC
          Attribution 4.0 International.
        </p>
        <a
          className="primary-action"
          href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"
          target="_blank"
          rel="noreferrer"
        >
          View source archive
        </a>
      </dialog>
    </>
  );
}
