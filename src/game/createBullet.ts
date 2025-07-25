import { addComponent, addEntity } from "bitecs";
import { Position, Velocity, Sprite, Bullet, Lifetime, Rotation, Asteroid, Collision, Hiter, Mass } from "../ecs/components";
import * as PIXI from "pixi.js";
import { type GameWorld } from "../ecs/world";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";

export function createBullet(world: GameWorld, app: PIXI.Application, originId: number) {
console.log("createBullet", originId);
  const x = Position.x[originId];
  const y = Position.y[originId];
  const angle = Rotation.angle[originId];
  const speed = 4;

  const bullet = addEntity(world);

  addComponent(world, Position, bullet);
  addComponent(world, Velocity, bullet);
  addComponent(world, Rotation, bullet);
  addComponent(world, Bullet, bullet);
  addComponent(world, Lifetime, bullet);
  addComponent(world, Sprite, bullet);
  addComponent(world, Collision, bullet);
  addComponent(world, Hiter, bullet);
  addComponent(world, Mass, bullet);

  Position.x[bullet] = x;
  Position.y[bullet] = y;

  Velocity.x[bullet] = Math.cos(angle) * speed;
  Velocity.y[bullet] = Math.sin(angle) * speed;

  Rotation.angle[bullet] = angle;

  Bullet[bullet] = 1;
  Lifetime.timeLeft[bullet] = 2.0; // 2 seconds

  // Set collision properties
  Collision.radius[bullet] = 2; // Small bullet radius
  Collision.group[bullet] = COLLISION_GROUPS.BULLET;
  Collision.mask[bullet] = COLLISION_MASKS.BULLET;

  // Set mass properties
  Mass.value[bullet] = 0.1; // Bullets are very light

  // Create visual
  const graphic = new PIXI.Graphics();
  graphic.circle(0, 0, 2);
  graphic.fill(0xffffff);

  console.log('Bullet components set:', {
    entity: bullet,
    position: { x: Position.x[bullet], y: Position.y[bullet] },
    velocity: { x: Velocity.x[bullet], y: Velocity.y[bullet] },
    rotation: Rotation.angle[bullet],
    sprite: Sprite[bullet],
    bullet: Bullet[bullet],
    lifetime: Lifetime.timeLeft[bullet],
  });


  const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
  sprite.anchor.set(0.5);
  sprite.x = Position.x[bullet];
  sprite.y = Position.y[bullet];
  app.stage.addChild(sprite);

  world.pixiSprites.set(bullet, sprite);
}
