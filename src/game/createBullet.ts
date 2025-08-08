import { addComponent, addEntity } from "bitecs";
import { Position, Velocity, Render, Bullet, Lifetime, Rotation, Asteroid, Collision, Hiter, Mass, Health } from "../ecs/components";
import * as PIXI from "pixi.js";
import { type GameWorld } from "../ecs/world";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { TextureCache } from "./TextureCache";

export function createBullet(world: GameWorld, app: PIXI.Application, originId: number) {
//console.log("createBullet", originId);
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
  addComponent(world, Render, bullet);
  addComponent(world, Collision, bullet);
  addComponent(world, Hiter, bullet);
  addComponent(world, Mass, bullet);
  addComponent(world, Health, bullet);

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

  // Set damage value
  Hiter.value[bullet] = 10; // Bullets deal 1 damage

  // Set health values
  Health.current[bullet] = 1; // Bullets have 1 health
  Health.max[bullet] = 1;     // Bullets have 1 max health

  // console.log('Bullet components set:', {
  //   entity: bullet,
  //   position: { x: Position.x[bullet], y: Position.y[bullet] },
  //   velocity: { x: Velocity.x[bullet], y: Velocity.y[bullet] },
  //   rotation: Rotation.angle[bullet],
  //   sprite: Sprite[bullet],
  //   bullet: Bullet[bullet],
  //   lifetime: Lifetime.timeLeft[bullet],
  // });

  // Use cached texture instead of generating new one
  const texture = TextureCache.getInstance().getBulletTexture(app);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = Position.x[bullet];
  sprite.y = Position.y[bullet];
  
  // Attach to GAME_OBJECTS layer using LayerManager
  LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, sprite);

  world.pixiSprites.set(bullet, sprite);
}
