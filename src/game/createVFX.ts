import { addEntity, addComponent } from "bitecs";
import { type GameWorld } from "../ecs/world";
import * as PIXI from "pixi.js";
import { 
  Position, Velocity, Sprite, Lifetime, Particle, Rotation
} from "../ecs/components";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { TextureCache } from "./textureCache";

/**
 * Creates damage particles that move from the hit object towards the hitter
 * @param world - The game world
 * @param app - PIXI application
 * @param options - Configuration options
 */
export function createDamageVFX(world: GameWorld, app: PIXI.Application, options: {
  x: number;
  y: number;
  hiterX: number;
  hiterY: number;
  count?: number;
  spread?: number;
  speed?: number;
  lifetime?: number;
  size?: number;
}) {
  const {
    x,
    y,
    hiterX,
    hiterY,
    count = 8,
    spread = Math.PI, // Full circle by default
    //spread = Math.PI * 2, // Full circle by default
    speed = 2,
    lifetime = 1.5,
    size = 3
  } = options;

  // Calculate direction vector from object to hitter
  const dx = hiterX - x;
  const dy = hiterY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize the direction vector
  const dirX = dx / distance;
  const dirY = dy / distance;
  

  for (let i = 0; i < count; i++) {
    const ent = addEntity(world);
    
    // Add components using existing systems
    addComponent(world, Position, ent);
    addComponent(world, Velocity, ent);
    addComponent(world, Sprite, ent);
    addComponent(world, Lifetime, ent);
    addComponent(world, Particle, ent); // Just mark as particle
    addComponent(world, Rotation, ent); // Add rotation for spinning particles

    // Set position at hit point
    Position.x[ent] = hiterX;
    Position.y[ent] = hiterY;

    // Calculate velocity along the direction vector with some randomness
    const velocityMagnitude = speed * (0.5 + Math.random() * 0.5); // Vary speed slightly
    const randomOffset = (Math.random() - 0.5) * 0.2; // Small random offset
    
    Velocity.x[ent] = (dirX + randomOffset) * velocityMagnitude;
    Velocity.y[ent] = (dirY + randomOffset) * velocityMagnitude;

    // Set lifetime
    Lifetime.timeLeft[ent] = lifetime * (0.4 + Math.random() * 0.2); // Vary lifetime slightly
    
    // Set rotation to match actual velocity direction (including random offset)
    Rotation.angle[ent] = Math.atan2(Velocity.y[ent], Velocity.x[ent]);

    // Create sprite with rectangle texture
    const texture = TextureCache.getInstance().getDamageParticleTexture(app, size);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = Position.x[ent];
    sprite.y = Position.y[ent];
    sprite.alpha = 1.0;
    
    // Rotate sprite to face movement direction
    sprite.rotation = Math.atan2(dirY, dirX);

    // Attach to GAME_OBJECTS layer
    LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, sprite);
    world.pixiSprites.set(ent, sprite);
  }
}

/**
 * Creates an explosion effect - circle that grows from small to big and decreases alpha
 * @param world - The game world
 * @param app - PIXI application
 * @param options - Configuration options
 */
export function createExplosionVFX(world: GameWorld, app: PIXI.Application, options: {
  x: number;
  y: number;
  minSize?: number;
  maxSize?: number;
  lifetime?: number;
}) {
  const {
    x,
    y,
    minSize = 5,
    maxSize = 50,
    lifetime = 1.0
  } = options;

  const ent = addEntity(world);
  
  // Add components using existing systems
  addComponent(world, Position, ent);
  addComponent(world, Velocity, ent);
  addComponent(world, Sprite, ent);
  addComponent(world, Lifetime, ent);
  addComponent(world, Particle, ent); // Just mark as particle

  // Set position (stationary)
  Position.x[ent] = x;
  Position.y[ent] = y;
  
  // No velocity for explosion (it just grows in place)
  Velocity.x[ent] = 0;
  Velocity.y[ent] = 0;

  // Set lifetime
  Lifetime.timeLeft[ent] = lifetime;

  // Create sprite with circle texture
  const texture = TextureCache.getInstance().getExplosionParticleTexture(app, minSize);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = Position.x[ent];
  sprite.y = Position.y[ent];
  sprite.alpha = 0.8;
  
  // Scale up for explosion effect
  sprite.scale.set(1, 1);

  // Attach to GAME_OBJECTS layer
  LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, sprite);
  world.pixiSprites.set(ent, sprite);
}

/**
 * Creates a combination of damage particles and explosion for dramatic effect
 * @param world - The game world
 * @param app - PIXI application
 * @param options - Configuration options
 */
export function createCombinedVFX(world: GameWorld, app: PIXI.Application, options: {
  x: number;
  y: number;
  hiterX: number;
  hiterY: number;
  damageParticles?: boolean;
  explosion?: boolean;
  intensity?: number;
}) {
  const {
    x,
    y,
    hiterX,
    hiterY,
    damageParticles = true,
    explosion = true,
    intensity = 1.0
  } = options;

  if (damageParticles) {
    createDamageVFX(world, app, {
      x,
      y,
      hiterX,
      hiterY,
      count: Math.floor(8 * intensity),
      speed: 2 * intensity,
      lifetime: 1.5,
      size: 3
    });
  }

  if (explosion) {
    createExplosionVFX(world, app, {
      x,
      y,
      maxSize: 30 * intensity,
      lifetime: 0.8
    });
  }
} 