import * as PIXI from "pixi.js";
import { type GameWorld } from "../ecs/world";
import { createShip } from "./createShip";

export function setupGame(world: GameWorld, app: PIXI.Application) {
  world.pixiSprites = new Map(); // Side-channel storage for Sprite references
  createShip(world, app);
}
