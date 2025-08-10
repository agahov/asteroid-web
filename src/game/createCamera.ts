import { addComponent, addEntity } from "bitecs";
import * as PIXI from "pixi.js";
import { Camera, Position } from "../ecs/components";
import { LayerManager } from "../ui/LayerManager";
import type { GameWorld } from "../ecs/world";

export function createCamera(world: GameWorld, app: PIXI.Application) {
  const cam = addEntity(world);
  addComponent(world, Position, cam);
  addComponent(world, Camera, cam);

  // Initial camera centered so the initial view is centered within the virtual world
  const view = LayerManager.getInstance().getViewSizeInWorld(app.screen.width, app.screen.height);
  const { width: worldW, height: worldH } = LayerManager.getInstance().getVirtualWorldSize();
  Position.x[cam] = (worldW - view.width) / 2;
  Position.y[cam] = (worldH - view.height) / 2;

  // Inner rectangle is about 1/3 of screen size
  Camera.innerW[cam] = view.width / 3;
  Camera.innerH[cam] = view.height / 3;

  // Default clamp offset from world bounds (in world units)
  const clampOffset = 8;
  Camera.offsetX[cam] = clampOffset;
  Camera.offsetY[cam] = clampOffset;

  return cam;
}


