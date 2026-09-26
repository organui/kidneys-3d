import { PerspectiveCamera, Spherical, Vector3 } from "three";
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
  radius: number,
  invalidate: () => void,
  onFreeView: () => void,
): CameraNavigation {
  let fitDistance = 0;
  const clampDistance = (distance: number) =>
    Math.min(controls.maxDistance, Math.max(controls.minDistance, distance));

  function preset(view: ViewName) {
    controls.target.set(0, 0, 0);
    // The source model places patient left on +X and patient right on -X.
    const direction: [number, number, number] =
      view === "Posterior"
        ? [0, 0, -1]
        : view === "Patient left"
          ? [1, 0, 0]
          : view === "Patient right"
            ? [-1, 0, 0]
            : [0, 0, 1];
    camera.position.set(...direction).multiplyScalar(fitDistance);
    camera.lookAt(controls.target);
    controls.update();
    invalidate();
  }

  return {
    preset,
    resize(width, height) {
      const aspect = Math.max(0.3, width / Math.max(height, 1));
      const halfFov = (camera.fov * Math.PI) / 360;
      const previousFit = fitDistance;
      fitDistance =
        (radius /
          Math.sin(Math.atan(Math.tan(halfFov) * Math.min(aspect, 1)))) *
        1.12;
      // Narrow viewports need enough room for the full model and zooming out.
      controls.maxDistance = Math.max(radius * 5.5, fitDistance * 2);
      if (!previousFit) {
        preset("Anterior");
        return;
      }
      // Keep the user's direction, target and zoom relative to the fitted view.
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(
        clampDistance(offset.length() * (fitDistance / previousFit)),
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
