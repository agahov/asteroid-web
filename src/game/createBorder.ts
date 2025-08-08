import * as PIXI from "pixi.js";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { addComponent, addEntity } from "bitecs";
import { Collision, Position, Render } from "../ecs/components";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";
import type { GameWorld } from "../ecs/world";

export function createBorder(world: GameWorld, app: PIXI.Application): number[] {
  // Draw visible border
  // const borderGraphics = new PIXI.Graphics();
  // borderGraphics
  //   .rect(0, 0, app.screen.width, app.screen.height)
  //   .stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
  // borderGraphics.zIndex = 50;
  // LayerManager.getInstance().attachToLayer(LAYERS.BACKGROUND, borderGraphics);

  // Thickness of the border rectangles
  const thickness = 12; // px

  const ents: number[] = [];

  // Helper to create one static rect entity
  function addRect(x: number, y: number, w: number, h: number) {
    const ent = addEntity(world);
    addComponent(world, Position, ent);
    addComponent(world, Collision, ent);
    addComponent(world, Render, ent);

    Position.x[ent] = x;
    Position.y[ent] = y;

    Collision.radius[ent] = 0; // not used for rect
    Collision.rectW[ent] = w;
    Collision.rectH[ent] = h;
    Collision.group[ent] = COLLISION_GROUPS.STATIC;
    Collision.mask[ent] = COLLISION_MASKS.STATIC;

    // Render as a thin filled rectangle along the inner edge and shorten to avoid corner overlap
    const g = new PIXI.Graphics();
    const isVertical = h > w;
    const thin = 2; // px, visible thickness
    if (isVertical) {
      // Align to inner edge (left or right), shorten by full border thickness at both ends to avoid corner crossing
      const innerX = x === 0 ? Math.max(0, w - thin) : 0;
      const startY = thickness;
      const length = Math.max(0, h - 2 * thickness);
      g.rect(innerX, startY, thin, length).fill({ color: 0xffffff, alpha: 0.2 });
    } else {
      // Align to inner edge (top or bottom), shorten by full border thickness at both ends to avoid corner crossing
      const innerY = y === 0 ? Math.max(0, h - thin) : 0;
      const startX = thickness;
      const length = Math.max(0, w - 2 * thickness);
      g.rect(startX, innerY, length, thin).fill({ color: 0xffffff, alpha: 0.2 });
    }

    g.zIndex = 50;
    g.x = x;
    g.y = y;
    LayerManager.getInstance().attachToLayer(LAYERS.BACKGROUND, g);
    world.pixiGraphics.set(ent, g);

    ents.push(ent);
  }

  // Left
  addRect(0, 0, thickness, app.screen.height);
  // Right
  addRect(app.screen.width - thickness, 0, thickness, app.screen.height);
  // Top
  addRect(0, 0, app.screen.width, thickness);
  // Bottom
  addRect(0, app.screen.height - thickness, app.screen.width, thickness);

  return ents;
}


