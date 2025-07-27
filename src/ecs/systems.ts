import * as PIXI from "pixi.js";
import { defineQuery, removeEntity, addComponent } from "bitecs";
import { Position, Sprite, Velocity, Rotation, Input, Player, Lifetime, Collision, Asteroid, Bullet, RemoveMark, Hiter, Damage, Health, Mass, Friction, Impulse } from "./components";
import type { GameWorld } from "./world";
import { getInputState } from "../input/input";
import { createAsteroid } from "../game/createAsteroid";
import { createBullet } from "../game/createBullet";

const spriteQuery = defineQuery([Position, Sprite]);
const moveQuery = defineQuery([Position, Velocity]);
const frictionQuery = defineQuery([Position, Velocity, Friction]);
const playerQuery = defineQuery([Position, Velocity, Rotation, Input, Player]);

// Input system - updates input component based on keyboard state
function inputSystem(world: GameWorld) {
  const players = playerQuery(world);
  const keys = getInputState();
  
  for (const id of players) {
    Input.up[id] = keys['KeyW'] || keys['ArrowUp'] ? 1 : 0;
    Input.down[id] = keys['KeyS'] || keys['ArrowDown'] ? 1 : 0;
    Input.left[id] = keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0;
    Input.right[id] = keys['KeyD'] || keys['ArrowRight'] ? 1 : 0;
    Input.space[id] = keys['Space'] ? 1 : 0;
  }
}

// Player movement system
function playerMovementSystem(world: GameWorld, deltaTime: number) {
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
}

// Movement system - updates positions based on velocity
function movementSystem(world: GameWorld, deltaTime: number) {
  const ents = moveQuery(world);
  for (const id of ents) {
    Position.x[id] += Velocity.x[id] * deltaTime;
    Position.y[id] += Velocity.y[id] * deltaTime;
  }
}

// Friction system - applies friction to entities that have the Friction component
function frictionSystem(world: GameWorld, deltaTime: number) {
  const ents = frictionQuery(world);
  for (const id of ents) {
    Velocity.x[id] *= Friction.value[id];
    Velocity.y[id] *= Friction.value[id];
  }
}

// Wrap system - handles screen wrapping for entities
function wrapSystem(world: GameWorld, app: PIXI.Application) {
  const wrapQuery = defineQuery([Position]);
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;

  const entities = wrapQuery(world);

  for (const id of entities) {
    if (Position.x[id] < 0) Position.x[id] = screenWidth;
    else if (Position.x[id] > screenWidth) Position.x[id] = 0;

    if (Position.y[id] < 0) Position.y[id] = screenHeight;
    else if (Position.y[id] > screenHeight) Position.y[id] = 0;
  }
}

// Render system - updates sprite positions and rotations based on component data
function renderSystem(world: GameWorld) {
  for (const id of spriteQuery(world)) {
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
}

let initialized = 0;

// Predefined speed array with custom distribution:
// 0 - 80%, 0.1 - 10%, 0.3 - 6%, 0.5 - 3%, 1.0 - 1%
const SPEED_WEIGHTS = [
  // 80 zeros (80%)
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 10 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 20 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 30 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 40 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 50 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 60 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 70 zeros
  // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 80 zeros
  
  // 10 values of 0.1 (10%)
  0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
  
  // 6 values of 0.3 (6%)
  0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
  
  // 3 values of 0.5 (3%)
  0.5, 0.5, 0.5,
  
  // 1 value of 1.0 (1%)
  1.0
];

// Utility function to generate speed with more dispersion towards zero
function generateAsteroidSpeed(): number {
  // Randomly select from the weighted array
  const randomIndex = Math.floor(Math.random() * SPEED_WEIGHTS.length);
  return SPEED_WEIGHTS[randomIndex];
}

export function asteroidSpawnerSystem(world: GameWorld, deltaTime: number, app: PIXI.Application) {
  if (initialized >= 0) {
	initialized -= deltaTime;
	return;
  }
  initialized = 3000;

  for (let i = 0; i < 5; i++) {
    const x = Math.random() * app.screen.width;
    const y = Math.random() * app.screen.height;
    const speed = generateAsteroidSpeed(); // Range 0 to 1 with dispersion towards zero
    createAsteroid(world, app, { x, y, speed });
  }


}

const lifetimeQuery = defineQuery([Lifetime]);
const removeMarkQuery = defineQuery([RemoveMark]);

export function lifetimeSystem(world: GameWorld, delta: number) {
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
}

// Asteroid destroyed system - creates smaller asteroids when large ones are destroyed
function asteroidDestroyedSystem(world: GameWorld, app: PIXI.Application) {
  const asteroidDestroyedQuery = defineQuery([RemoveMark, Asteroid, Collision, Position, Velocity]);
  const entities = asteroidDestroyedQuery(world);
  
  for (const id of entities) {
    const currentRadius = Collision.radius[id];
    const minRadius = 10; // Minimum radius for creating smaller asteroids
    
    // Only create smaller asteroids if the destroyed asteroid is large enough
    if (currentRadius > minRadius) {
      const numAsteroids = 2 + Math.floor(Math.random() * 3); // 2-4 asteroids
      const newRadius = currentRadius * 0.6; // 60% of original size
      
      for (let i = 0; i < numAsteroids; i++) {
        // Calculate random angle for the new asteroid's velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = generateAsteroidSpeed(); // Range 0 to 1 with dispersion towards zero
        
        // Calculate velocity based on original asteroid's velocity plus some randomness
        const baseVelX = Velocity.x[id];
        const baseVelY = Velocity.y[id];
        const randomVelX = Math.cos(angle) * speed;
        const randomVelY = Math.sin(angle) * speed;
        
        createAsteroid(world, app, {
          x: Position.x[id],
          y: Position.y[id],
          speed: Math.sqrt((baseVelX + randomVelX) ** 2 + (baseVelY + randomVelY) ** 2),
          angle: Math.atan2(baseVelY + randomVelY, baseVelX + randomVelX),
          radius: newRadius
        });
      }
    }
  }
}

// Remove system - removes entities marked for removal
export function removeSystem(world: GameWorld) {
  const entities = removeMarkQuery(world);
  
  for (const id of entities) {
    const sprite = world.pixiSprites.get(id);
    if (sprite) {
      sprite.destroy();
      world.pixiSprites.delete(id);
    }
    removeEntity(world, id);
  }
}


let fireCooldown = 0;

export function fireSystem(world: GameWorld, delta: number, app: PIXI.Application) {
  //const keys = getInputState();
  fireCooldown -= delta / 60;	
   
  
  const playerQuery = defineQuery([Player, Rotation, Position]);
  const players = playerQuery(world);
  
  if (players.length === 0) return;
  
  const playerId = players[0];
  
  if (!Input.space[playerId] || fireCooldown > 0) return;

  createBullet(world, app, playerId);
  fireCooldown = 0.3; // Fire every 0.3s
}

// Hit system - handles collision detection and adds damage to entities
function hitSystem(world: GameWorld) {
  const hiterQuery = defineQuery([Position, Collision, Hiter, Velocity, Mass]);
  const targetQuery = defineQuery([Position, Collision, Velocity, Mass]);
  const hiters = hiterQuery(world);
  const targets = targetQuery(world);
  
  // Check each hiter against all targets for collisions
  for (const hiter of hiters) {
    for (const target of targets) {
      // Skip if hiter is trying to hit itself
      if (hiter === target) continue;
      
      // Check if these entities can collide based on their groups and masks
      const canCollide = (Collision.group[hiter] & Collision.mask[target]) !== 0 ||
                        (Collision.group[target] & Collision.mask[hiter]) !== 0;
      
      if (!canCollide) continue;
      
      // Calculate distance between entities
      const dx = Position.x[hiter] - Position.x[target];
      const dy = Position.y[hiter] - Position.y[target];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if they're colliding
      const collisionDistance = Collision.radius[hiter] + Collision.radius[target];
      
      if (distance < collisionDistance) {
        console.log("Hit detected between", hiter, "and", target);
        
        // Add damage component to the target
        addComponent(world, Damage, target);
        Damage.amount[target] = 1; // Default damage amount
        
        // Apply impulse forces based on collision
        const hiterMass = Mass.value[hiter] || 1;
        const targetMass = Mass.value[target] || 1;
        
        // Calculate collision normal
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const relativeVelX = Velocity.x[hiter] - Velocity.x[target];
        const relativeVelY = Velocity.y[hiter] - Velocity.y[target];
        
        // Calculate impulse magnitude (simplified elastic collision)
        const impulseMagnitude = Math.sqrt(relativeVelX * relativeVelX + relativeVelY * relativeVelY) * 0.5;
        
        // Apply impulse to both entities
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
        
        // Apply impulse in opposite directions
        Impulse.x[hiter] -= nx * impulseMagnitude * targetMass;
        Impulse.y[hiter] -= ny * impulseMagnitude * targetMass;
        Impulse.x[target] += nx * impulseMagnitude * hiterMass;
        Impulse.y[target] += ny * impulseMagnitude * hiterMass;
        
        // Mark hiter for removal (e.g., bullets disappear after hitting)
        addComponent(world, RemoveMark, hiter);
      }
    }
  }
}



// Damage system - processes damage and reduces health
function damageSystem(world: GameWorld) {
  const damageQuery = defineQuery([Damage, Health]);
  const entities = damageQuery(world);
  
  for (const id of entities) {
    // Only process if damage amount is greater than 0
    if (Damage.amount[id] > 0) {
      // Reduce health by damage amount
      Health.current[id] -= Damage.amount[id];
      
      console.log(`Entity ${id} took ${Damage.amount[id]} damage. Health: ${Health.current[id]}/${Health.max[id]}`);
      
      // Check if health is below 0
      if (Health.current[id] <= 0) {
        console.log(`Entity ${id} has died!`);
        addComponent(world, RemoveMark, id);
      }
      
      // Mark damage as processed by setting amount to 0
      Damage.amount[id] = 0;
    }
  }
}


export function runSystems(world: GameWorld, deltaTime: number, app: PIXI.Application) {
  // Run input system first
  inputSystem(world);
  
  // Run player movement system
  playerMovementSystem(world, deltaTime);

  asteroidSpawnerSystem(world, deltaTime, app);

  // Run friction system before movement
  frictionSystem(world, deltaTime);
  
  // Run movement system
  movementSystem(world, deltaTime);
  fireSystem(world, deltaTime, app);
  
  // Run hit system
  hitSystem(world);
  
  // Run damage system
  damageSystem(world);
  
  // Run asteroid destroyed system to create smaller asteroids
  asteroidDestroyedSystem(world, app);
  
  // Run remove system to clean up marked entities
  removeSystem(world);
  
  // Run wrap system
  wrapSystem(world, app);

  lifetimeSystem(world, deltaTime);

  // Run render system last
  renderSystem(world);
}
