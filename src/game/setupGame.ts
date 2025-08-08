import * as PIXI from "pixi.js";
import { type GameWorld } from "../ecs/world";
import { createShip } from "./createShip";
import { createBorder } from "./createBorder";
import { createCamera } from "./createCamera";

export function setupGame(world: GameWorld, app: PIXI.Application) {
  world.pixiSprites = new Map(); // Side-channel storage for Sprite references
  world.pixiGraphics = new Map(); // Side-channel storage for Graphics references
  createCamera(world, app);
  createBorder(world, app);
  createShip(world, app);
}
