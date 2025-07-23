import * as PIXI from "pixi.js";
import { defineQuery, removeEntity, addComponent } from "bitecs";
import { Position, Sprite, Velocity, Rotation, Input, Player, Lifetime, Collision, Asteroid, Bullet, RemoveMark } from "./components";
import type { GameWorld } from "./world";
import { getInputState } from "../input/input";
import { createAsteroid } from "../game/createAsteroid";
import { createBullet } from "../game/createBullet";

const spriteQuery = defineQuery([Position, Sprite]);
const moveQuery = defineQuery([Position, Velocity]);
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
    const friction = 0.98; // friction factor

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

    // Apply friction
    Velocity.x[id] *= friction;
    Velocity.y[id] *= friction;

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

let initialized = false;

export function asteroidSpawnerSystem(world: GameWorld, app: PIXI.Application) {
  if (initialized) return;

  for (let i = 0; i < 5; i++) {
    const x = Math.random() * app.screen.width;
    const y = Math.random() * app.screen.height;
    const speed = 0.5 + Math.random() * 1;
    createAsteroid(world, app, { x, y, speed });
  }

  initialized = true;
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

// Collision system - handles collision detection and marks entities for removal
function collisionSystem(world: GameWorld) {
  const collisionQuery = defineQuery([Position, Collision]);
  const entities = collisionQuery(world);
  
  // Check each pair of entities for collisions
  for (let i = 0; i < entities.length; i++) {
    const entityA = entities[i];
    
    for (let j = i + 1; j < entities.length; j++) {
      const entityB = entities[j];
      
      // Check if these entities can collide based on their groups and masks
      const canCollide = (Collision.group[entityA] & Collision.mask[entityB]) !== 0 ||
                        (Collision.group[entityB] & Collision.mask[entityA]) !== 0;
      
      if (!canCollide) continue;
	  console.log("Collision detected between", entityA, "and", entityB);
      
      // Calculate distance between entities
      const dx = Position.x[entityA] - Position.x[entityB];
      const dy = Position.y[entityA] - Position.y[entityB];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if they're colliding
      const collisionDistance = Collision.radius[entityA] + Collision.radius[entityB];
      
      if (distance < collisionDistance) {
        // Mark entities for removal instead of removing them directly
        addComponent(world, RemoveMark, entityA);
        addComponent(world, RemoveMark, entityB);
      }
    }
  }
}



// Handle collision between two entities
function handleCollision(world: GameWorld, entityA: number, entityB: number) {
  // Get entity types
  const isPlayerA = Player[entityA] !== undefined;
  const isPlayerB = Player[entityB] !== undefined;
  const isAsteroidA = Asteroid[entityA] !== undefined;
  const isAsteroidB = Asteroid[entityB] !== undefined;
  const isBulletA = Bullet[entityA] !== undefined;
  const isBulletB = Bullet[entityB] !== undefined;
  
  // Player vs Asteroid collision
  if ((isPlayerA && isAsteroidB) || (isPlayerB && isAsteroidA)) {
    const player = isPlayerA ? entityA : entityB;
    const asteroid = isPlayerA ? entityB : entityA;
    
    // Remove the asteroid
    removeEntity(world, asteroid);
    const asteroidSprite = world.pixiSprites.get(asteroid);
    if (asteroidSprite) {
      asteroidSprite.destroy();
      world.pixiSprites.delete(asteroid);
    }
    
    // TODO: Handle player damage/death
    console.log("Player hit asteroid!");
  }
  
  // Bullet vs Asteroid collision
  if ((isBulletA && isAsteroidB) || (isBulletB && isAsteroidA)) {
    const bullet = isBulletA ? entityA : entityB;
    const asteroid = isBulletA ? entityB : entityA;
    
    // Remove both bullet and asteroid
    removeEntity(world, bullet);
    removeEntity(world, asteroid);
    
    const bulletSprite = world.pixiSprites.get(bullet);
    if (bulletSprite) {
      bulletSprite.destroy();
      world.pixiSprites.delete(bullet);
    }
    
    const asteroidSprite = world.pixiSprites.get(asteroid);
    if (asteroidSprite) {
      asteroidSprite.destroy();
      world.pixiSprites.delete(asteroid);
    }
    
    console.log("Bullet hit asteroid!");
  }
}


export function runSystems(world: GameWorld, deltaTime: number, app: PIXI.Application) {
  // Run input system first
  inputSystem(world);
  
  // Run player movement system
  playerMovementSystem(world, deltaTime);

  asteroidSpawnerSystem(world, app);

  // Run movement system
  movementSystem(world, deltaTime);
  fireSystem(world, deltaTime, app);
  
  // Run collision system
  collisionSystem(world);
  
  // Run remove system to clean up marked entities
  removeSystem(world);
  
  // Run wrap system
  wrapSystem(world, app);

  lifetimeSystem(world, deltaTime);

  // Run render system last
  renderSystem(world);
}
