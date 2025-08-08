import * as PIXI from "pixi.js";
import { defineQuery, removeEntity, addComponent, removeComponent, Not, addEntity } from "bitecs";
import { Position, Render, Velocity, Rotation, Input, Player, Lifetime, Collision, Asteroid, Bullet, RemoveMark, Hiter, Damage, Health, Mass, Friction, Impulse, CollisionDelay, Particle, ChainTimer, FadeComp, GraphicsVFX } from "./components";
import type { GameWorld } from "./world";
import { getInputState } from "../input/input";
import { createAsteroid } from "../game/createAsteroid";
import { createBullet } from "../game/createBullet";
import { createDamageVFX, createExplosionVFX, createCombinedVFX, createGraphicsExplosionVFX } from "../game/createVFX";
import { TextureCache } from "../game/TextureCache";
import { COLLISION_GROUPS } from "./collisionGroups";
import { startSystemTimer, endSystemTimer, profilingSystem } from "./profiling";

// Input system - updates input component based on keyboard state
const playerQuery = defineQuery([Position, Velocity, Rotation, Input, Player]);

function inputSystem(world: GameWorld) {
  startSystemTimer('inputSystem');
  const players = playerQuery(world);
  const keys = getInputState();
  
  for (const id of players) {
    Input.up[id] = keys['KeyW'] || keys['ArrowUp'] ? 1 : 0;
    Input.down[id] = keys['KeyS'] || keys['ArrowDown'] ? 1 : 0;
    Input.left[id] = keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0;
    Input.right[id] = keys['KeyD'] || keys['ArrowRight'] ? 1 : 0;
    Input.space[id] = keys['Space'] ? 1 : 0;
  }
  
  endSystemTimer('inputSystem', players.length);
}

// Player movement system
function playerMovementSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('playerMovementSystem');
  const players = playerQuery(world);
  for (const id of players) {
    const rotationSpeed = 0.1; // radians per frame
    const acceleration = 0.5; // pixels per frame squared
    const maxSpeed = 5; // maximum speed in pixels per frame

    // Handle rotation
    if (Input.left[id]) {
      Rotation.angle[id] -= rotationSpeed * deltaTime;
    }
    if (Input.right[id]) {
      Rotation.angle[id] += rotationSpeed * deltaTime;
    }

    // Handle thrust
    if (Input.up[id]) {
      const thrustX = Math.cos(Rotation.angle[id]) * acceleration * deltaTime;
      const thrustY = Math.sin(Rotation.angle[id]) * acceleration * deltaTime;
      
      Velocity.x[id] += thrustX;
      Velocity.y[id] += thrustY;
    }

    // Limit maximum speed
    const speed = Math.sqrt(Velocity.x[id] * Velocity.x[id] + Velocity.y[id] * Velocity.y[id]);
    if (speed > maxSpeed) {
      Velocity.x[id] = (Velocity.x[id] / speed) * maxSpeed;
      Velocity.y[id] = (Velocity.y[id] / speed) * maxSpeed;
    }
  }
  
  endSystemTimer('playerMovementSystem', players.length);
}

// Movement system - updates positions based on velocity
const moveQuery = defineQuery([Position, Velocity]);

function movementSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('movementSystem');
  const ents = moveQuery(world);
  for (const id of ents) {
    Position.x[id] += Velocity.x[id] * deltaTime;
    Position.y[id] += Velocity.y[id] * deltaTime;
  }
  
  endSystemTimer('movementSystem', ents.length);
}

// Friction system - applies friction to entities that have the Friction component
const frictionQuery = defineQuery([Position, Velocity, Friction]);

function frictionSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('frictionSystem');
  const ents = frictionQuery(world);
  for (const id of ents) {
    Velocity.x[id] *= Friction.value[id];
    Velocity.y[id] *= Friction.value[id];
  }
  
  endSystemTimer('frictionSystem', ents.length);
}

// Wrap system - replaced with border bounce and clamp
const wrapQuery = defineQuery([Position, Velocity, Collision]);
const borderQuery = defineQuery([Collision, Position, Not(Velocity)]);

function wrapSystem(world: GameWorld, app: PIXI.Application) {
  startSystemTimer('wrapSystem');
  // First loop: collect static rectangles (entities with Collision and NOT Velocity)
  const staticRects = borderQuery(world);

  // Second loop: process dynamic entities with Position + Velocity + Collision
  const entities = wrapQuery(world);

  // Outer: static rect, Inner: entities
  for (const bid of staticRects) {
    const bx = Position.x[bid];
    const by = Position.y[bid];
    const bw = Collision.rectW[bid];
    const bh = Collision.rectH[bid];

    const rectMinX = bx;
    const rectMaxX = bx + bw;
    const rectMinY = by;
    const rectMaxY = by + bh;

    for (const id of entities) {
      // Respect masks: dynamic entity collides with this static rect?
      const canCollide = (Collision.group[bid] & Collision.mask[id]) !== 0;
      if (!canCollide) continue;

      const radius = (Collision.radius[id] || 0);
      const cx = Position.x[id];
      const cy = Position.y[id];

      // Circle-rect closest point
      const closestX = Math.max(rectMinX, Math.min(cx, rectMaxX));
      const closestY = Math.max(rectMinY, Math.min(cy, rectMaxY));
      const dx = cx - closestX;
      const dy = cy - closestY;
      const distSq = dx * dx + dy * dy;
      const rSq = radius * radius;

      if (distSq < rSq) {
        const speed = Math.hypot(Velocity.x[id], Velocity.y[id]);
        const restitution = Math.min(1.0, 0.5 + 0.1 * speed);

        // If we have a valid normal (outside corner overlap)
        if (dx !== 0 || dy !== 0) {
          const dist = Math.sqrt(distSq) || 1e-6;
          const nx = dx / dist;
          const ny = dy / dist;
          const penetration = radius - dist;
          // Push out along normal
          Position.x[id] += nx * penetration;
          Position.y[id] += ny * penetration;
          // Reflect velocity along normal
          const vDotN = Velocity.x[id] * nx + Velocity.y[id] * ny;
          if (vDotN < 0) {
            Velocity.x[id] -= (1 + restitution) * vDotN * nx;
            Velocity.y[id] -= (1 + restitution) * vDotN * ny;
          }
        } else {
          // Center is inside rect; resolve along minimal axis to nearest edge
          const distLeft = Math.abs(cx - rectMinX);
          const distRight = Math.abs(rectMaxX - cx);
          const distTop = Math.abs(cy - rectMinY);
          const distBottom = Math.abs(rectMaxY - cy);
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);
          if (minDist === distLeft) {
            Position.x[id] = rectMinX - radius;
            if (Velocity.x[id] > 0) { /* moving right into left edge? no reflect */ } else { Velocity.x[id] = -Velocity.x[id] * restitution; }
          } else if (minDist === distRight) {
            Position.x[id] = rectMaxX + radius;
            if (Velocity.x[id] < 0) { Velocity.x[id] = -Velocity.x[id] * restitution; }
          } else if (minDist === distTop) {
            Position.y[id] = rectMinY - radius;
            if (Velocity.y[id] > 0) { /* moving down into top edge? */ } else { Velocity.y[id] = -Velocity.y[id] * restitution; }
          } else {
            Position.y[id] = rectMaxY + radius;
            if (Velocity.y[id] < 0) { Velocity.y[id] = -Velocity.y[id] * restitution; }
          }
        }
      }
    }
  }
  
  endSystemTimer('wrapSystem', entities.length);
}

// Render system - updates PIXI.DisplayObjects (sprites/graphics) based on component data
const spriteQuery = defineQuery([Position, Render]);

function renderSystem(world: GameWorld) {
  startSystemTimer('renderSystem');
  const entities = spriteQuery(world);
  for (const id of entities) {
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      sprite.x = Position.x[id];
      sprite.y = Position.y[id];
      
      // Update rotation if entity has rotation component
      if (Rotation.angle[id] !== undefined) {
        sprite.rotation = Rotation.angle[id];
      }
    }

    // Also update PIXI.Graphics positions if present
    const graphics = world.pixiGraphics.get(id);
    if (graphics) {
      graphics.x = Position.x[id];
      graphics.y = Position.y[id];
    }
  }
  
  endSystemTimer('renderSystem', spriteQuery(world).length);
}

// Graphics VFX system - updates graphics-based visual effects
const graphicsVFXQuery = defineQuery([Position, GraphicsVFX, Lifetime]);

function graphicsVFXSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('graphicsVFXSystem');
  const entities = graphicsVFXQuery(world);
  
  for (const id of entities) {
    const graphics = world.pixiGraphics.get(id);
    if (graphics) {
      // Update current time
      GraphicsVFX.currentTime[id] += deltaTime / 60;
      
      // Calculate normalized time (0.0 to 1.0)
      const t = GraphicsVFX.currentTime[id] / GraphicsVFX.duration[id];
      
      
      // Update graphics properties based on time
      if (graphics instanceof PIXI.Graphics) {
        // For now, just update alpha and scale for the graphics object
        graphics.alpha = Math.max(0, 1.0 - t);
        graphics.scale.set(1.0 + t * 2.0); // Expand over time
      }
    }
  }
  
  endSystemTimer('graphicsVFXSystem', entities.length);
}

let spawned = false;
export function asteroidSpawnerSystem(world: GameWorld, dt: number, app: PIXI.Application) {
  if (spawned) {
    return;
  }
  spawned = true;

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * app.screen.width;
    const y = Math.random() * app.screen.height;
    const speed = Math.floor(Math.random() * 1);
    createAsteroid(world, app, { x, y, speed, collisionDelay: 1.0 });
  }
}

const lifetimeQuery = defineQuery([Lifetime]);

export function lifetimeSystem(world: GameWorld, delta: number) {
  startSystemTimer('lifetimeSystem');
  const ents = lifetimeQuery(world);

  for (const id of ents) {
    Lifetime.timeLeft[id] -= delta / 60;
    if (Lifetime.timeLeft[id] <= 0) {
      const sprite = world.pixiSprites.get(id);
      if (sprite) {
        sprite.destroy();
        world.pixiSprites.delete(id);
      }
      
      const graphics = world.pixiGraphics.get(id);
      if (graphics) {
        graphics.destroy();
        world.pixiGraphics.delete(id);
      }
      
      removeEntity(world, id);
    }
  }
  
  endSystemTimer('lifetimeSystem', ents.length);
}

// Asteroid destroyed system - creates smaller asteroids when large ones are destroyed
const asteroidDestroyedQuery = defineQuery([RemoveMark, Asteroid, Collision, Position, Velocity]);

function asteroidDestroyedSystem(world: GameWorld, app: PIXI.Application) {
  startSystemTimer('asteroidDestroyedSystem');
  const entities = asteroidDestroyedQuery(world);
  
  for (const id of entities) {
    const currentRadius = Collision.radius[id];
    const minRadius = 10;
    
    // Create explosion VFX when asteroid is destroyed
    createGraphicsExplosionVFX(world, app, {
      x: Position.x[id],
      y: Position.y[id],
      size: currentRadius * 2,
      duration: 0.6,
      intensity: 1.0
    });
    
    // Only create smaller asteroids if the destroyed asteroid is large enough
    if (currentRadius > minRadius) {
      const numAsteroids = 2 + Math.floor(Math.random() * 3);
      const newRadius = currentRadius * 0.6;
      
      for (let i = 0; i < numAsteroids; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.floor(Math.random() * 1) + 2;
        
        const baseVelX = Velocity.x[id];
        const baseVelY = Velocity.y[id];
        const randomVelX = Math.cos(angle) * speed;
        const randomVelY = Math.sin(angle) * speed;
        
        createAsteroid(world, app, {
          x: Position.x[id],
          y: Position.y[id],
          speed: Math.sqrt((baseVelX + randomVelX) ** 2 + (baseVelY + randomVelY) ** 2),
          angle: Math.atan2(baseVelY + randomVelY, baseVelX + randomVelX),
          radius: newRadius,
          collisionDelay: 0.3
        });
      }
    }
  }
  
  endSystemTimer('asteroidDestroyedSystem', entities.length);
}

// Remove system - removes entities marked for removal
const removeMarkQuery = defineQuery([RemoveMark]);

export function removeSystem(world: GameWorld) {
  startSystemTimer('removeSystem');
  const entities = removeMarkQuery(world);
  
  for (const id of entities) {
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      sprite.destroy();
      world.pixiSprites.delete(id);
    }
    removeEntity(world, id);
  }
  
  endSystemTimer('removeSystem', entities.length);
}

let fireCooldown = 0;

const playerFireQuery = defineQuery([Player, Rotation, Position]);

export function fireSystem(world: GameWorld, delta: number, app: PIXI.Application) {
  fireCooldown -= delta / 60;	
   
  const players = playerFireQuery(world);
  
  if (players.length === 0) {
    endSystemTimer('fireSystem', 0);
    return;
  }
  
  const playerId = players[0];
  
  if (!Input.space[playerId] || fireCooldown > 0) {
    endSystemTimer('fireSystem', players.length);
    return;
  }

  createBullet(world, app, playerId);
  fireCooldown = 0.3;
  
  endSystemTimer('fireSystem', players.length);
}

// Hit system - handles collision detection and adds damage to entities
const hiterQuery = defineQuery([Position, Collision, Hiter, Velocity, Mass, Not(CollisionDelay)]);
const targetQuery = defineQuery([Position, Collision, Velocity, Mass, Not(CollisionDelay), Not(Damage)]);

function hitSystem(world: GameWorld) {
  startSystemTimer('hitSystem');
  const hiters = hiterQuery(world);
  const targets = targetQuery(world);
  
  let collisionChecks = 0;
  
  for (const hiter of hiters) {
    for (const target of targets) {
      collisionChecks++;
      
      if (hiter === target) continue;
      
      const canCollide = (Collision.group[target] & Collision.mask[hiter]) !== 0;
      
      if (!canCollide) continue;
      
      const dx = Position.x[hiter] - Position.x[target];
      const dy = Position.y[hiter] - Position.y[target];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const collisionDistance = Collision.radius[hiter] + Collision.radius[target];
      
      if (distance < collisionDistance) {
        addComponent(world, Damage, target);
        Damage.amount[target] = Hiter.value[hiter];
        Damage.hiterX[target] = Position.x[hiter];
        Damage.hiterY[target] = Position.y[hiter];
        
        const hiterMass = Mass.value[hiter] || 1;
        const targetMass = Mass.value[target] || 1;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const relativeVelX = Velocity.x[hiter] - Velocity.x[target];
        const relativeVelY = Velocity.y[hiter] - Velocity.y[target];
        
        const impulseMagnitude = Math.sqrt(relativeVelX * relativeVelX + relativeVelY * relativeVelY) * 0.5;
        
        if (!Impulse.x[hiter]) {
          addComponent(world, Impulse, hiter);
          Impulse.x[hiter] = 0;
          Impulse.y[hiter] = 0;
        }
        if (!Impulse.x[target]) {
          addComponent(world, Impulse, target);
          Impulse.x[target] = 0;
          Impulse.y[target] = 0;
        }
        
        Impulse.x[hiter] -= nx * impulseMagnitude * targetMass;
        Impulse.y[hiter] -= ny * impulseMagnitude * targetMass;
        Impulse.x[target] += nx * impulseMagnitude * hiterMass;
        Impulse.y[target] += ny * impulseMagnitude * hiterMass;
      }
    }
  }
  
  if (collisionChecks > 20000) {
    console.warn(`⚠️ High collision checks: ${collisionChecks} (${hiters.length} hiters × ${targets.length} targets)`);
  }
  
  endSystemTimer('hitSystem', hiters.length + targets.length);
}

// Damage system - processes damage and reduces health
const damageQuery = defineQuery([Damage, Health]);

function damageSystem(world: GameWorld, app: PIXI.Application) {
  startSystemTimer('damageSystem');
  const entities = damageQuery(world);
  
  for (const id of entities) {
    Health.current[id] -= Damage.amount[id];
    
    if (Health.current[id] <= 0) {
      addComponent(world, RemoveMark, id);
    } else {
      createDamageVFX(world, app, {
        x: Position.x[id],
        y: Position.y[id],
        hiterX: Damage.hiterX[id],
        hiterY: Damage.hiterY[id],
        count: Math.floor(2 + Math.random() * 3),
        speed: 1.5 + Math.random() * 1.5,
        size: 2 + Math.random() * 2
      });
    }
    removeComponent(world, Damage, id);
  }
  
  endSystemTimer('damageSystem', entities.length);
}

// Collision delay system - removes collision delay component when timer expires
const collisionDelayQuery = defineQuery([CollisionDelay]);

function collisionDelaySystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('collisionDelaySystem');
  const entities = collisionDelayQuery(world);
  
  for (const id of entities) {
    CollisionDelay.timeLeft[id] -= deltaTime / 60;
    
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      const progress = Math.max(0, 1 - (CollisionDelay.timeLeft[id] / 0.5));
      sprite.alpha = 0.5 + (progress * 0.5);
    }
    
    if (CollisionDelay.timeLeft[id] <= 0) {
      removeComponent(world, CollisionDelay, id);
      console.log(`Entity ${id} collision delay expired`);
      
      if (sprite) {
        sprite.alpha = 1.0;
      }
    }
  }
  
  endSystemTimer('collisionDelaySystem', entities.length);
}



// Chain timer system - simple timer for spawning chain particles
// const chainTimerQuery = defineQuery([ChainTimer, Position]);

// function chainTimerSystem(world: GameWorld, deltaTime: number, app: PIXI.Application) {
//   startSystemTimer('chainTimerSystem');
//   const entities = chainTimerQuery(world);
  
//   for (const id of entities) {
//     ChainTimer.timeLeft[id] -= deltaTime / 60;
    
//     if (ChainTimer.timeLeft[id] <= 0 && ChainTimer.chainCount[id] > 0) {
//       // Create a new particle with bigger size
//       const newSize = ChainTimer.baseSize[id] * 1.5; // 50% bigger
      
//       // Create new particle entity
//       const newEnt = addEntity(world);
//       addComponent(world, Position, newEnt);
//       //addComponent(world, Velocity, newEnt);
//       addComponent(world, Sprite, newEnt);
//       addComponent(world, Lifetime, newEnt);
//       addComponent(world, Particle, newEnt);
//       addComponent(world, ChainTimer, newEnt); // Make this particle also chain-capable
      
//       // Set position at current entity position
//       Position.x[newEnt] = Position.x[id];
//       Position.y[newEnt] = Position.y[id];
      
      
      
//       // Set lifetime
//       //Lifetime.timeLeft[newEnt] = 0.1 + Math.random() * 0.1;
//       Lifetime.timeLeft[newEnt] = Lifetime.timeLeft[id] - 0.2;
      
//       // Set chain timer for the new particle (smaller chain than parent)
//       ChainTimer.timeLeft[newEnt] = 0.1; // Slightly longer delay for chain particles
//       //ChainTimer.chainCount[newEnt] = Math.max(1, ChainTimer.chainCount[id] - 1); // Reduce chain count
//       ChainTimer.chainCount[newEnt] = ChainTimer.chainCount[id] - 1; // Reduce chain count
//       ChainTimer.baseSize[newEnt] = newSize; // Smaller base size for chain particles
      
//       // Create sprite with bigger size
//       const texture = TextureCache.getInstance().getExplosionParticleTexture(app, newSize);
//       const newSprite = new PIXI.Sprite(texture);
//       newSprite.anchor.set(0.5);
//       newSprite.x = Position.x[newEnt];
//       newSprite.y = Position.y[newEnt];
//       newSprite.alpha = 0.6;
      
//       // Attach to GAME_OBJECTS layer
//       LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, newSprite);
//       world.pixiSprites.set(newEnt, newSprite);
      
//       // ChainTimer.chainCount[id]--;
//       // ChainTimer.timeLeft[id] = 0.1; // Reset timer for next chain particle
//       removeComponent(world, ChainTimer, id);
//     }
    
//     if (ChainTimer.chainCount[id] <= 0) {
//     }
//   }
  
//   endSystemTimer('chainTimerSystem', entities.length);
// }

// Fade system - handles fade effects
const fadeQuery = defineQuery([FadeComp, Render]);

function fadeSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('fadeSystem');
  const entities = fadeQuery(world);
  
  for (const id of entities) {
    FadeComp.currentTime[id] += deltaTime / 60;
    const progress = Math.min(1, FadeComp.currentTime[id] / FadeComp.duration[id]);
    
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      const currentAlpha = FadeComp.startAlpha[id] + (FadeComp.endAlpha[id] - FadeComp.startAlpha[id]) * progress;
      sprite.alpha = currentAlpha;
    }
    
    if (progress >= 1) {
      removeComponent(world, FadeComp, id);
    }
  }
  
  endSystemTimer('fadeSystem', entities.length);
}

export function runSystems(world: GameWorld, deltaTime: number, app: PIXI.Application) {
  const originalDeltaTime = deltaTime;
  
  startSystemTimer('totalFrame');
  
  inputSystem(world);
  playerMovementSystem(world, deltaTime);
  asteroidSpawnerSystem(world, deltaTime, app);
  frictionSystem(world, deltaTime);
  movementSystem(world, deltaTime);
  fireSystem(world, deltaTime, app);
  collisionDelaySystem(world, deltaTime);
  
  // Animation systems
  //chainTimerSystem(world, deltaTime, app);
  fadeSystem(world, deltaTime);
  graphicsVFXSystem(world, deltaTime);
  
  hitSystem(world);
  damageSystem(world, app);
  asteroidDestroyedSystem(world, app);
  removeSystem(world);
  wrapSystem(world, app);
  lifetimeSystem(world, deltaTime);
  renderSystem(world);
  
  profilingSystem(world, deltaTime);
  
  endSystemTimer('totalFrame', 0);
}
