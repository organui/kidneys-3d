import {
  Canvas,
  events,
  useFrame,
  useThree,
  type CanvasProps,
} from "@react-three/fiber";
import { AlertTriangle, Box, RotateCcw } from "lucide-react";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import manifest from "../public/models/manifest.json";
import { sceneIdsForNode } from "./anatomy-adapter";
import { byId, structures, type StructureId, type ViewName } from "./anatomy";
import {
  createCameraNavigation,
  type CameraNavigation,
  type ViewerHandle,
} from "./camera-navigation";
import { visibleSceneHits } from "./scene-picking";

export type { ViewerHandle } from "./camera-navigation";

const viewerEvents: NonNullable<CanvasProps["events"]> = (store) => ({
  ...events(store),
  filter: visibleSceneHits,
});

type ViewerProps = {
  selectedId: string | null;
  visibility: Readonly<Record<string, boolean>>;
  onSelect: (id: StructureId) => void;
  onReady: (ready: boolean) => void;
  onFreeView: () => void;
  controlsRef: RefObject<ViewerHandle | null>;
};

class GraphicsBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function disposeModel(model: Group) {
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function CameraRig({
  controlsRef,
  onFreeView,
  radius,
}: Pick<ViewerProps, "controlsRef" | "onFreeView"> & { radius: number }) {
  const { camera, gl, invalidate, size } = useThree();
  const orbitRef = useRef<OrbitControls | null>(null);
  const navigationRef = useRef<CameraNavigation | null>(null);
  const latestFreeView = useRef(onFreeView);
  latestFreeView.current = onFreeView;

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    orbitRef.current = controls;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      controls.enableDamping = !reducedMotion.matches;
    };
    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
    controls.enablePan = false;
    controls.minDistance = radius * 1.15;
    controls.maxDistance = radius * 5.5;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.75;
    let interacting = false;
    const change = () => {
      if (interacting) latestFreeView.current();
      invalidate();
    };
    const start = () => {
      interacting = true;
    };
    const end = () => {
      interacting = false;
    };
    controls.addEventListener("change", change);
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);

    const navigation = createCameraNavigation(
      camera as PerspectiveCamera,
      controls,
      radius,
      invalidate,
      () => latestFreeView.current(),
    );
    navigationRef.current = navigation;
    controlsRef.current = {
      ...navigation,
      preset(view: ViewName) {
        interacting = false;
        navigation.preset(view);
      },
    };
    return () => {
      controlsRef.current = null;
      navigationRef.current = null;
      orbitRef.current = null;
      reducedMotion.removeEventListener("change", updateMotion);
      controls.removeEventListener("change", change);
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
      controls.dispose();
    };
  }, [camera, controlsRef, gl, invalidate, radius]);

  useEffect(() => {
    navigationRef.current?.resize(size.width, size.height);
  }, [camera, controlsRef, gl, invalidate, radius, size.height, size.width]);

  useFrame(() => orbitRef.current?.update());
  return null;
}

function Model({
  model,
  selectedId,
  visibility,
  onSelect,
}: Pick<ViewerProps, "selectedId" | "visibility" | "onSelect"> & {
  model: Group;
}) {
  const { invalidate } = useThree();
  const highlighted = useMemo(
    () => new Set(sceneIdsForNode(selectedId)),
    [selectedId],
  );

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const id = (object.userData.structureId || object.name) as StructureId;
      const structure = byId[id];
      if (!structure) return;
      object.visible = visibility[id] !== false;
      const material = object.material as MeshStandardMaterial;
      material.color.set(structure.color);
      material.emissive.set(highlighted.has(id) ? "#f0aa79" : "#000000");
      material.emissiveIntensity = highlighted.has(id) ? 0.34 : 0;
      material.roughness = 0.66;
    });
    invalidate();
  }, [highlighted, invalidate, model, visibility]);

  return (
    <primitive
      object={model}
      onClick={(event: {
        stopPropagation: () => void;
        object: Mesh;
        delta: number;
      }) => {
        event.stopPropagation();
        if (event.delta > 4) return;
        const id = (event.object.userData.structureId ||
          event.object.name) as StructureId;
        if (byId[id]) onSelect(id);
      }}
    />
  );
}

export default function Viewer(props: ViewerProps) {
  const [model, setModel] = useState<Group | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [graphicsFailed, setGraphicsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const readyCallback = useRef(props.onReady);
  readyCallback.current = props.onReady;

  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    let loaded: Group | null = null;
    setModel(null);
    setError(null);
    setProgress(0);
    readyCallback.current(false);

    async function load() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}models/kidneys.glb`,
          {
            signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30000)]),
          },
        );
        if (!response.ok)
          throw new Error(
            `The model request returned HTTP ${response.status}.`,
          );
        const total =
          Number(response.headers.get("content-length")) ||
          manifest.runtime.bytes;
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (!disposed)
              setProgress(Math.min(95, Math.round((received / total) * 95)));
          }
        }
        const bytes = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        if (
          bytes.length < 12 ||
          new DataView(bytes.buffer).getUint32(0, true) !== 0x46546c67
        )
          throw new Error("The model file is missing or is not a valid GLB.");
        loaded = (await new GLTFLoader().parseAsync(bytes.buffer, "")).scene;
        const ids = new Set<string>();
        loaded.traverse((object) => {
          if (object instanceof Mesh)
            ids.add(object.userData.structureId || object.name);
        });
        if (structures.some(({ id }) => !ids.has(id)))
          throw new Error(
            "The model does not contain every expected structure.",
          );
        if (disposed) return disposeModel(loaded);
        setProgress(100);
        setModel(loaded);
      } catch (caught) {
        if (!disposed && !abort.signal.aborted)
          setError(
            caught instanceof Error
              ? caught.message
              : "The model could not be decoded.",
          );
      }
    }
    void load();
    return () => {
      disposed = true;
      abort.abort();
      if (loaded) disposeModel(loaded);
    };
  }, [attempt]);

  const radius = useMemo(
    () =>
      model
        ? new Box3().setFromObject(model).getSize(new Vector3()).length() / 2
        : 4,
    [model],
  );
  const retry = () => {
    setGraphicsFailed(false);
    setAttempt((value) => value + 1);
  };
  const fallback = (
    <div className="stage-message" role="alert">
      <AlertTriangle size={24} />
      <h2>3D view unavailable</h2>
      <p>
        WebGL could not start. The complete anatomy tree and descriptions remain
        available.
      </p>
      <button className="primary-action" onClick={retry}>
        <RotateCcw size={15} /> Try again
      </button>
    </div>
  );

  return (
    <div
      className="canvas-wrap"
      role="region"
      aria-label="Interactive kidneys model"
      aria-describedby="model-instructions"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const controls = props.controlsRef.current;
        if (
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "+",
            "=",
            "-",
          ].includes(event.key)
        )
          event.preventDefault();
        if (event.key === "ArrowLeft") controls?.rotate(-0.2);
        if (event.key === "ArrowRight") controls?.rotate(0.2);
        if (event.key === "ArrowUp") controls?.rotate(0, -0.2);
        if (event.key === "ArrowDown") controls?.rotate(0, 0.2);
        if (event.key === "+" || event.key === "=") controls?.zoom(0.85);
        if (event.key === "-") controls?.zoom(1.18);
      }}
    >
      {error ? (
        <div className="stage-message" role="alert">
          <AlertTriangle size={24} />
          <h2>The anatomy model couldn’t load</h2>
          <p>{error} Use the anatomy panel while you retry.</p>
          <button className="primary-action" onClick={retry}>
            <RotateCcw size={15} /> Retry model
          </button>
        </div>
      ) : !model ? (
        <div className="stage-message" role="status">
          <Box size={26} />
          <span className="eyebrow">PREPARING THE MODEL</span>
          <h2>Bringing the anatomy into view.</h2>
          <progress
            value={progress}
            max={100}
            aria-label="Loading kidneys model"
          />
          <p>{progress}% · Anatomy text is already available</p>
        </div>
      ) : graphicsFailed ? (
        fallback
      ) : (
        <GraphicsBoundary
          fallback={fallback}
          onFailure={() => {
            setGraphicsFailed(true);
            props.onReady(false);
          }}
        >
          <Canvas
            key={attempt}
            events={viewerEvents}
            frameloop="demand"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 12], fov: 34, near: 0.05, far: 100 }}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                "webglcontextlost",
                (event) => {
                  event.preventDefault();
                  setGraphicsFailed(true);
                  readyCallback.current(false);
                },
                { once: true },
              );
              readyCallback.current(true);
            }}
          >
            <ambientLight intensity={0.9} />
            <hemisphereLight args={["#fff8eb", "#8d8075", 1.5]} />
            <directionalLight
              position={[-4, 6, 7]}
              intensity={2.5}
              color="#fff2df"
            />
            <directionalLight
              position={[5, 0, -4]}
              intensity={1.5}
              color="#dde8f1"
            />
            <Model
              model={model}
              selectedId={props.selectedId}
              visibility={props.visibility}
              onSelect={props.onSelect}
            />
            <CameraRig
              controlsRef={props.controlsRef}
              onFreeView={props.onFreeView}
              radius={radius}
            />
          </Canvas>
        </GraphicsBoundary>
      )}
    </div>
  );
}
