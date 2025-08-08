// Collision group constants for better readability
export const COLLISION_GROUPS = {
  PLAYER: 1,    // Player ship
  ASTEROID: 2,  // Asteroids
  BULLET: 4,    // Bullets
  STATIC: 8,    // Static colliders (e.g., borders)
} as const;

// Collision masks - what each group can collide with
export const COLLISION_MASKS = {
  PLAYER: COLLISION_GROUPS.ASTEROID | COLLISION_GROUPS.STATIC,                    // Player can hit asteroids and static
  //ASTEROID: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.BULLET| COLLISION_GROUPS.ASTEROID, // Asteroids can be hit by player and bullets
  //ASTEROID: COLLISION_GROUPS.PLAYER |  COLLISION_GROUPS.ASTEROID,// Asteroids can be hit by player and bullets
  ASTEROID: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.BULLET | COLLISION_GROUPS.ASTEROID | COLLISION_GROUPS.STATIC, // Asteroids can be hit by player, bullets, asteroids, and static
  BULLET: COLLISION_GROUPS.ASTEROID,                    // Bullets can hit asteroids
  STATIC: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ASTEROID, // Static interacts with player and asteroids only
} as const; 