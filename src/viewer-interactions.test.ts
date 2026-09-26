import { NodeIO } from "@gltf-transform/core";
import { describe, expect, it, vi } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Vector3,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCameraNavigation } from "./camera-navigation";
import { visibleSceneHits } from "./scene-picking";

function setupCamera(width = 1280, height = 520) {
  const camera = new PerspectiveCamera(34, width / height, 0.05, 100);
  camera.position.set(0, 0, 12);
  // No DOM listeners are needed to exercise the real orbit/camera math.
  const controls = new OrbitControls(camera);
  controls.minDistance = 4 * 1.15;
  const onFreeView = vi.fn();
  const navigation = createCameraNavigation(
    camera,
    controls,
    4,
    vi.fn(),
    onFreeView,
  );
  navigation.resize(width, height);
  return { camera, controls, navigation, onFreeView };
}

describe("camera layout changes", () => {
  it("preserves a posterior preset and user zoom through panel and mobile resizes", () => {
    const { camera, controls, navigation, onFreeView } = setupCamera();
    navigation.preset("Posterior");
    navigation.zoom(0.72);
    const orientation = camera.quaternion.clone();

    for (const [width, height] of [
      [890, 520],
      [390, 626],
      [1280, 520],
    ]) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      navigation.resize(width, height);
      const fitted = setupCamera(width, height);
      expect(camera.position.z).toBeLessThan(0);
      expect(camera.quaternion.angleTo(orientation)).toBeLessThan(1e-6);
      expect(
        controls.getDistance() / fitted.controls.getDistance(),
      ).toBeCloseTo(0.72);
      expect(controls.target.toArray()).toEqual([0, 0, 0]);
    }
    expect(onFreeView).not.toHaveBeenCalled();
  });

  it("preserves a custom orbit and target without emitting a new user rotation", () => {
    const { camera, controls, navigation, onFreeView } = setupCamera();
    navigation.rotate(0.6, -0.3);
    navigation.zoom(0.85);
    const target = new Vector3(0.2, 0.1, 0);
    camera.position.add(target);
    controls.target.copy(target);
    controls.update();
    const direction = camera.position.clone().sub(target).normalize();
    const orientation = camera.quaternion.clone();
    navigation.resize(390, 626);
    expect(
      camera.position.clone().sub(target).normalize().distanceTo(direction),
    ).toBeLessThan(1e-6);
    expect(camera.quaternion.angleTo(orientation)).toBeLessThan(1e-6);
    expect(controls.target.equals(target)).toBe(true);
    expect(onFreeView).toHaveBeenCalledTimes(1);
  });

  it("resets to the fitted anterior view for the current viewport", () => {
    const { camera, controls, navigation } = setupCamera();
    navigation.preset("Posterior");
    navigation.zoom(0.7);
    navigation.resize(390, 626);
    navigation.preset("Anterior");
    const fitted = setupCamera(390, 626);
    expect(camera.position.distanceTo(fitted.camera.position)).toBeLessThan(
      1e-6,
    );
    expect(controls.getDistance()).toBeLessThanOrEqual(controls.maxDistance);
  });

  it("places each lateral camera on the named patient's side of the actual model", async () => {
    const model = await new NodeIO().read("public/models/kidneys.glb");
    const { camera, navigation } = setupCamera();
    for (const [view, id] of [
      ["Patient left", "left-kidney"],
      ["Patient right", "right-kidney"],
    ] as const) {
      const node = model
        .getRoot()
        .listNodes()
        .find((candidate) => candidate.getName() === id)!;
      const position = node
        .getMesh()!
        .listPrimitives()[0]
        .getAttribute("POSITION")!;
      const centerX = (position.getMin([])[0] + position.getMax([])[0]) / 2;
      navigation.preset(view);
      expect(camera.position.x * centerX).toBeGreaterThan(0);
      expect(Math.abs(camera.position.z)).toBeLessThan(1e-6);
    }
  });
});

describe("scene visibility and picking", () => {
  it("lets a visible surface receive a ray through hidden foreground geometry", () => {
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const front = new Mesh(geometry, material);
    const back = new Mesh(geometry, material);
    front.position.z = 2;
    front.visible = false;
    const scene = new Group().add(front, back);
    scene.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
    const hits = ray.intersectObject(scene, true);
    expect(hits[0].object).toBe(front);
    expect(visibleSceneHits(hits)[0].object).toBe(back);
    back.visible = false;
    expect(visibleSceneHits(hits)).toEqual([]);
    front.visible = true;
    expect(visibleSceneHits(hits)[0].object).toBe(front);
    geometry.dispose();
    material.dispose();
  });

  it("also excludes descendants of a hidden parent", () => {
    const child = new Group();
    const parent = new Group().add(child);
    parent.visible = false;
    expect(visibleSceneHits([{ object: child }])).toEqual([]);
  });
});
