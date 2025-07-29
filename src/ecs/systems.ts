import * as PIXI from "pixi.js";
import { defineQuery, removeEntity, addComponent, removeComponent, Not } from "bitecs";
import { Position, Sprite, Velocity, Rotation, Input, Player, Lifetime, Collision, Asteroid, Bullet, RemoveMark, Hiter, Damage, Health, Mass, Friction, Impulse, CollisionDelay, Particle, ScaleAnim, FadeComp } from "./components";
import type { GameWorld } from "./world";
import { getInputState } from "../input/input";
import { createAsteroid } from "../game/createAsteroid";
import { createBullet } from "../game/createBullet";
import { createDamageVFX, createExplosionVFX, createCombinedVFX } from "../game/createVFX";
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

// Wrap system - handles screen wrapping for entities
const wrapQuery = defineQuery([Position]);

function wrapSystem(world: GameWorld, app: PIXI.Application) {
  startSystemTimer('wrapSystem');
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;

  const entities = wrapQuery(world);

  for (const id of entities) {
    if (Position.x[id] < 0) Position.x[id] = screenWidth;
    else if (Position.x[id] > screenWidth) Position.x[id] = 0;

    if (Position.y[id] < 0) Position.y[id] = screenHeight;
    else if (Position.y[id] > screenHeight) Position.y[id] = 0;
  }
  
  endSystemTimer('wrapSystem', entities.length);
}

// Render system - updates sprite positions and rotations based on component data
const spriteQuery = defineQuery([Position, Sprite]);

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
  }
  
  endSystemTimer('renderSystem', spriteQuery(world).length);
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
    createCombinedVFX(world, app, {
      x: Position.x[id],
      y: Position.y[id],
      hiterX: Position.x[id],
      hiterY: Position.y[id],
      intensity: Math.min(2.0, currentRadius / 15), 
      damageParticles: false,
      explosion: true
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

// Scale animation system - handles scaling animations
const scaleAnimQuery = defineQuery([ScaleAnim, Sprite]);

function scaleAnimSystem(world: GameWorld, deltaTime: number) {
  startSystemTimer('scaleAnimSystem');
  const entities = scaleAnimQuery(world);
  
  for (const id of entities) {
    ScaleAnim.currentTime[id] += deltaTime / 60;
    const progress = Math.min(1, ScaleAnim.currentTime[id] / ScaleAnim.duration[id]);
    
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      const currentScale = ScaleAnim.startScale[id] + (ScaleAnim.endScale[id] - ScaleAnim.startScale[id]) * progress;
      sprite.scale.set(currentScale, currentScale);
    }
    
    if (progress >= 1) {
      removeComponent(world, ScaleAnim, id);
    }
  }
  
  endSystemTimer('scaleAnimSystem', entities.length);
}

// Fade system - handles fade effects
const fadeQuery = defineQuery([FadeComp, Sprite]);

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
  scaleAnimSystem(world, deltaTime);
  fadeSystem(world, deltaTime);
  
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
