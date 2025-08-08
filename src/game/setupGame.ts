import * as PIXI from "pixi.js";
import { type GameWorld } from "../ecs/world";
import { createShip } from "./createShip";
import { createBorder } from "./createBorder";

export function setupGame(world: GameWorld, app: PIXI.Application) {
  world.pixiSprites = new Map(); // Side-channel storage for Sprite references
  world.pixiGraphics = new Map(); // Side-channel storage for Graphics references
  createBorder(world, app);
  createShip(world, app);
}
