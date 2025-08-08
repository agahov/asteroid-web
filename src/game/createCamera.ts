import { addComponent, addEntity } from "bitecs";
import * as PIXI from "pixi.js";
import { Camera, Position } from "../ecs/components";
import type { GameWorld } from "../ecs/world";

export function createCamera(world: GameWorld, app: PIXI.Application) {
  const cam = addEntity(world);
  addComponent(world, Position, cam);
  addComponent(world, Camera, cam);

  // Initial camera at origin in world space
  Position.x[cam] = 0;
  Position.y[cam] = 0;

  // Inner rectangle is about 1/3 of screen size
  Camera.innerW[cam] = app.screen.width / 3;
  Camera.innerH[cam] = app.screen.height / 3;

  return cam;
}


