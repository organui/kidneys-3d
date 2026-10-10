import { PerspectiveCamera, Spherical, Vector3 } from "three";
import { fitDistance, framingCenter } from "./framing";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ViewName } from "./anatomy";

export type ViewerHandle = {
  preset: (view: ViewName) => void;
  zoom: (factor: number) => void;
  rotate: (horizontal: number, vertical?: number) => void;
};

export type CameraNavigation = ViewerHandle & {
  resize: (width: number, height: number) => void;
};

export function createCameraNavigation(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  points: Vector3[],
  invalidate: () => void,
  onFreeView: () => void,
): CameraNavigation {
  const center = framingCenter(points);
  let aspect = camera.aspect;
  let anteriorFit = 0;
  const clampDistance = (distance: number) =>
    Math.min(controls.maxDistance, Math.max(controls.minDistance, distance));

  const fit = (direction: Vector3) =>
    clampDistance(fitDistance(points, center, direction, camera.fov, aspect));

  function directionFor(view: ViewName) {
    // The source model places patient left on +X and patient right on -X.
    return new Vector3(
      ...((view === "Posterior"
        ? [0, 0, -1]
        : view === "Patient left"
          ? [1, 0, 0]
          : view === "Patient right"
            ? [-1, 0, 0]
            : [0, 0, 1]) as [number, number, number]),
    );
  }

  function preset(view: ViewName) {
    const direction = directionFor(view);
    controls.target.copy(center);
    camera.position.copy(direction).multiplyScalar(fit(direction)).add(center);
    camera.lookAt(controls.target);
    controls.update();
    invalidate();
  }

  return {
    preset,
    resize(width, height) {
      aspect = Math.max(0.3, width / Math.max(height, 1));
      const previousFit = anteriorFit;
      // Narrow viewports need enough room for the full model and zooming out.
      controls.maxDistance = Math.max(
        controls.maxDistance,
        fitDistance(
          points,
          center,
          directionFor("Anterior"),
          camera.fov,
          aspect,
        ) * 2,
      );
      anteriorFit = fit(directionFor("Anterior"));
      if (!previousFit) {
        preset("Anterior");
        return;
      }
      // Keep the user's direction, target and zoom relative to the fitted view.
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(
        clampDistance(offset.length() * (anteriorFit / previousFit)),
      );
      camera.position.copy(controls.target).add(offset);
      controls.update();
      invalidate();
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(clampDistance(offset.length() * factor));
      camera.position.copy(controls.target).add(offset);
      controls.update();
      invalidate();
    },
    rotate(horizontal, vertical = 0) {
      const spherical = new Spherical().setFromVector3(
        camera.position.clone().sub(controls.target),
      );
      spherical.theta += horizontal;
      spherical.phi += vertical;
      spherical.makeSafe();
      camera.position
        .copy(controls.target)
        .add(new Vector3().setFromSpherical(spherical));
      controls.update();
      onFreeView();
      invalidate();
    },
  };
}
