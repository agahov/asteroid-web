import { createWorld, type IWorld } from "bitecs";
import * as PIXI from "pixi.js";

// Extend the world interface to include PixiJS sprites and meshes
export interface GameWorld extends IWorld {
  pixiSprites: Map<number, PIXI.Sprite>;
  pixiMeshes: Map<number, PIXI.Mesh | PIXI.Graphics>;
}

export const world = createWorld() as GameWorld;
world.pixiSprites = new Map();
world.pixiMeshes = new Map();
