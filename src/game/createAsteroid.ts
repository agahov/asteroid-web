import { addEntity, addComponent } from "bitecs";
import { type GameWorld } from "../ecs/world";
import * as PIXI from "pixi.js";
import { Position, Velocity, Render, Asteroid, Rotation, Player, Input, Collision, Health, Hiter, Mass, Friction, CollisionDelay } from "../ecs/components";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { TextureCache } from "./TextureCache";

export function createAsteroid(world: GameWorld, app: PIXI.Application, options = {}) {
	//console.log("createAsteroid");
  const { x = 0, y = 0, speed = 1, angle = Math.random() * Math.PI * 2, radius: customRadius, collisionDelay = 0.5 } = options as {
    x?: number;
    y?: number;
    speed?: number;
    angle?: number;
    radius?: number;
    collisionDelay?: number;
  };

  const ent = addEntity(world);
  
  // Add all components to the entity
  addComponent(world, Position, ent);
  addComponent(world, Velocity, ent);
  addComponent(world, Rotation, ent);
  addComponent(world, Render, ent);
  addComponent(world, Asteroid, ent);
  addComponent(world, Collision, ent);
  addComponent(world, Health, ent);
  addComponent(world, Hiter, ent);
  addComponent(world, Mass, ent);
  addComponent(world, Friction, ent);
  
  // Add collision delay component
  addComponent(world, CollisionDelay, ent);
  
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
  
  // Set collision properties - but start with collision disabled
  Collision.radius[ent] = radius; // Use the same radius as visual
  Collision.group[ent] = COLLISION_GROUPS.ASTEROID;
  Collision.mask[ent] = COLLISION_MASKS.ASTEROID;
  
  // Set collision delay
  CollisionDelay.timeLeft[ent] = collisionDelay;
  
  // Set health properties
  Health.current[ent] = radius * 2; // Asteroids take 10 hits to destroy
  Health.max[ent] = radius * 10;
  
  // Set mass properties - mass scales with radius (volume)
  Mass.value[ent] = radius * 0.5; // Heavier asteroids are harder to move
  
  // Set friction properties
  Friction.value[ent] = 0.99; // Asteroids have high friction

  // Set damage value - larger asteroids deal more damage
  Hiter.value[ent] = radius / 10; // Damage scales with size

  // Use cached texture instead of generating new one
  const texture = TextureCache.getInstance().getAsteroidTexture(app, radius);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = Position.x[ent];
  sprite.y = Position.y[ent];
  
  // Make asteroid semi-transparent when it has collision delay
  sprite.alpha = 0.5;
  
  // Attach to GAME_OBJECTS layer using LayerManager
  LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, sprite);

  world.pixiSprites.set(ent, sprite);
}
