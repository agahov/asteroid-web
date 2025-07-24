import { addEntity, addComponent } from "bitecs";
import { type GameWorld } from "../ecs/world";
import * as PIXI from "pixi.js";
import { Position, Velocity, Sprite, Asteroid, Rotation, Player, Input, Collision, Health, Hiter } from "../ecs/components";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";

export function createAsteroid(world: GameWorld, app: PIXI.Application, options = {}) {
	console.log("createAsteroid");
  const { x = 0, y = 0, speed = 1, angle = Math.random() * Math.PI * 2, radius: customRadius } = options as {
    x?: number;
    y?: number;
    speed?: number;
    angle?: number;
    radius?: number;
  };

  const ent = addEntity(world);
  
  // Add all components to the entity
  addComponent(world, Position, ent);
  addComponent(world, Velocity, ent);
  addComponent(world, Rotation, ent);
  addComponent(world, Sprite, ent);
  addComponent(world, Asteroid, ent);
  addComponent(world, Collision, ent);
  addComponent(world, Health, ent);
  addComponent(world, Hiter, ent);
  
  // Set component values
  Position.x[ent] = x;
  Position.y[ent] = y;

  Velocity.x[ent] = Math.cos(angle) * speed;
  Velocity.y[ent] = Math.sin(angle) * speed;
  
  Rotation.angle[ent] = Math.random() * Math.PI * 2;

  // Generate random asteroid shape
  const minRadius = 10;
  const maxRadius = 20;
  const radius = customRadius || (minRadius + Math.random() * (maxRadius - minRadius));
  
  // Set collision properties
  Collision.radius[ent] = radius; // Use the same radius as visual
  Collision.group[ent] = COLLISION_GROUPS.ASTEROID;
  Collision.mask[ent] = COLLISION_MASKS.ASTEROID;
  
  // Set health properties
  Health.current[ent] = 3; // Asteroids take 3 hits to destroy
  Health.max[ent] = 3;
  
  // Generate 4-8 random points around the center
  const numPoints = 4 + Math.floor(Math.random() * 5); // 4 to 8 points
  const points: number[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const pointRadius = radius * (0.7 + Math.random() * 0.6); // Vary radius by ±30%
    const px = Math.cos(angle) * pointRadius;
    const py = Math.sin(angle) * pointRadius;
    points.push(px, py);
  }

  const graphic = new PIXI.Graphics();
  graphic.stroke({ width: 2, color: 0xffffff });
  graphic.poly(points);
  graphic.fill(0xff0000);

//   console.log('Asteroid components set:', {
//     entity: ent,
//     position: { x: Position.x[ent], y: Position.y[ent] },
//     velocity: { x: Velocity.x[ent], y: Velocity.y[ent] },
//     rotation: Rotation.angle[ent],
//     sprite: Sprite[ent],
//     asteroid: Asteroid[ent],
//     radius: radius,
//     numPoints: numPoints
//   });

  const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
  sprite.anchor.set(0.5);
  sprite.x = Position.x[ent];
  sprite.y = Position.y[ent];
  app.stage.addChild(sprite);

  //world.pixiSprites[ent] = sprite;
  world.pixiSprites.set(ent, sprite);
}
