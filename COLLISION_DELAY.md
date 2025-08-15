# Collision Delay System

## Overview
The collision delay system prevents newly spawned asteroids from colliding with other entities for a specified period of time. This prevents immediate collisions when asteroids are created, especially useful when asteroids break apart into smaller pieces.

## Implementation Details

### Components
- **CollisionDelay**: Tracks the remaining time before collision is enabled
  - `timeLeft`: Time remaining in seconds before collision is enabled

### Systems
- **collisionDelaySystem**: Manages collision delay timers and visual feedback
  - Decrements the delay timer each frame
  - Removes the CollisionDelay component when timer expires
  - Updates visual opacity during the delay period

### bitECS Query Usage
The system uses proper bitECS patterns with `Not()` queries to exclude entities with collision delay:

```typescript
// Use Not(CollisionDelay) to exclude entities with collision delay
const hiterQuery = defineQuery([Position, Collision, Hiter, Velocity, Mass, Not(CollisionDelay)]);
const targetQuery = defineQuery([Position, Collision, Velocity, Mass, Not(CollisionDelay)]);
```

This is more efficient than manually checking for collision delay in the loop, as bitECS handles the filtering at the query level.

### Visual Feedback
- Asteroids start semi-transparent (alpha = 0.5) when created
- Opacity gradually increases as the delay decreases
- Asteroids become fully opaque (alpha = 1.0) when collision delay expires

### Usage
When creating asteroids, you can specify a collision delay:

```typescript
createAsteroid(world, app, {
  x: 100,
  y: 100,
  speed: 2,
  collisionDelay: 0.5 // 0.5 seconds delay
});
```

### Default Delays
- **Initial asteroids**: 1.0 second delay
- **Smaller asteroids** (from breaking): 0.3 second delay
- **Default delay**: 0.5 seconds (if not specified)

### Collision Detection
The hit system automatically excludes entities with active collision delay using bitECS `Not()` queries:
- Entities with `CollisionDelay` component are automatically filtered out
- This prevents unwanted collisions during the delay period
- More efficient than manual checks in the collision loop

## Benefits
1. **Prevents immediate collisions** when asteroids spawn
2. **Visual feedback** shows which asteroids are still in delay period
3. **Configurable delays** for different asteroid types
4. **Smooth gameplay** without jarring instant collisions
5. **Efficient bitECS usage** with proper query patterns 

# Project Rules

## General Project Description

I want to implement a simple Asteroid game on techstack bitecs and pixi.js

## ECS Component Management Rules

When adding a new component to an entity, always use `addComponent(world, ComponentName, entityId)` from bitecs. Never use direct assignment like `ComponentName[entityId] = value` for adding components.

**Correct way:**
```typescript
import { addComponent } from "bitecs";
addComponent(world, RemoveMark, entityId);
```

**Incorrect way:**
```typescript
RemoveMark[entityId] = 1; // This is wrong for adding components
```

**Note:** Direct assignment is only for modifying existing component data, not for adding components to entities.

## Vue Component Structure Rules

All Vue components must follow this exact section order:

1. **`<script setup>`** - Script logic and imports
2. **`<template>`** - HTML template markup  
3. **`<style>`** - CSS styling

**Correct structure:**
```vue
<script setup>
// imports and component logic here
</script>

<template>
  <!-- template markup here -->
</template>

<style>
/* styles here */
</style>
```

**Incorrect structure:**
```vue
<template>
  <!-- template first - WRONG -->
</template>

<script setup>
// script second - WRONG
</script>

<style>
/* style third - WRONG */
</style>
```

This ordering ensures consistency across all Vue components in the project and follows Vue.js best practices. 