import * as PIXI from "pixi.js";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { addComponent, addEntity } from "bitecs";
import { Border, Collision, Position, Render } from "../ecs/components";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";
import type { GameWorld } from "../ecs/world";

// Border thickness in screen pixels
const BORDER_THICKNESS = 12;

// Helper to draw the visible thin segment of a border inside its rectangle bounds
function drawBorderGraphicSegment(
  g: PIXI.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  thickness: number
) {
  g.clear();
  const isVertical = h > w;
  const thin = 2; // visible thickness in px
  if (isVertical) {
    const innerX = x === 0 ? Math.max(0, w - thin) : 0;
    const startY = thickness;
    const length = Math.max(0, h - 2 * thickness);
    g.rect(innerX, startY, thin, length).fill({ color: 0xffffff, alpha: 0.2 });
  } else {
    const innerY = y === 0 ? Math.max(0, h - thin) : 0;
    const startX = thickness;
    const length = Math.max(0, w - 2 * thickness);
    g.rect(startX, innerY, length, thin).fill({ color: 0xffffff, alpha: 0.2 });
  }
}

function computeRectForSide(side: number, app: PIXI.Application, thickness: number) {
  switch (side) {
    // 0: left, 1: right, 2: top, 3: bottom
    case 0:
      return { x: 0, y: 0, w: thickness, h: app.screen.height };
    case 1:
      return {
        x: app.screen.width - thickness,
        y: 0,
        w: thickness,
        h: app.screen.height,
      };
    case 2:
      return { x: 0, y: 0, w: app.screen.width, h: thickness };
    case 3:
      return {
        x: 0,
        y: app.screen.height - thickness,
        w: app.screen.width,
        h: thickness,
      };
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

export function createBorder(world: GameWorld, app: PIXI.Application): number[] {
  // Draw visible border
  // const borderGraphics = new PIXI.Graphics();
  // borderGraphics
  //   .rect(0, 0, app.screen.width, app.screen.height)
  //   .stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
  // borderGraphics.zIndex = 50;
  // LayerManager.getInstance().attachToLayer(LAYERS.BACKGROUND, borderGraphics);

  const ents: number[] = [];

  // Helper to create one static rect entity
  function addRect(x: number, y: number, w: number, h: number, side: number) {
    const ent = addEntity(world);
    addComponent(world, Position, ent);
    addComponent(world, Collision, ent);
    addComponent(world, Render, ent);
    addComponent(world, Border, ent);

    Position.x[ent] = x;
    Position.y[ent] = y;

    Collision.radius[ent] = 0; // not used for rect
    Collision.rectW[ent] = w;
    Collision.rectH[ent] = h;
    Collision.group[ent] = COLLISION_GROUPS.STATIC;
    Collision.mask[ent] = COLLISION_MASKS.STATIC;
    Border.side[ent] = side;

    const g = new PIXI.Graphics();
    // Render as a thin filled rectangle along the inner edge and shorten to avoid corner overlap
    drawBorderGraphicSegment(g, x, y, w, h, BORDER_THICKNESS);

    g.zIndex = 50;
    g.x = x;
    g.y = y;
    LayerManager.getInstance().attachToLayer(LAYERS.BACKGROUND, g);
    world.pixiGraphics.set(ent, g);

    ents.push(ent);
  }

  // Left
  addRect(0, 0, BORDER_THICKNESS, app.screen.height, 0);
  // Right
  addRect(app.screen.width - BORDER_THICKNESS, 0, BORDER_THICKNESS, app.screen.height, 1);
  // Top
  addRect(0, 0, app.screen.width, BORDER_THICKNESS, 2);
  // Bottom
  addRect(0, app.screen.height - BORDER_THICKNESS, app.screen.width, BORDER_THICKNESS, 3);

  return ents;
}

// Query helper to get all border entities
import { defineQuery } from "bitecs";
const borderQuery = defineQuery([Border]);
export function getBorders(world: GameWorld): number[] {
  return borderQuery(world);
}

// Re-render and reposition border entities for current screen size
export function renderBorders(world: GameWorld, app: PIXI.Application) {
  const ents = getBorders(world);
  for (const ent of ents) {
    const side = Border.side[ent];
    const { x, y, w, h } = computeRectForSide(side, app, BORDER_THICKNESS);

    // Update components
    Position.x[ent] = x;
    Position.y[ent] = y;
    Collision.rectW[ent] = w;
    Collision.rectH[ent] = h;

    // Update graphics
    const g = world.pixiGraphics.get(ent);
    if (g) {
      drawBorderGraphicSegment(g, x, y, w, h, BORDER_THICKNESS);
      g.x = x;
      g.y = y;
    }
  }
}





