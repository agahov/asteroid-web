import { createWorld, type IWorld } from "bitecs";
import * as PIXI from "pixi.js";

// Extend the world interface to include PixiJS sprites and graphics
export interface GameWorld extends IWorld {
  pixiSprites: Map<number, PIXI.Sprite>;
  pixiGraphics: Map<number, PIXI.Graphics>;
}

export const world = createWorld() as GameWorld;
world.pixiSprites = new Map();
world.pixiGraphics = new Map();
