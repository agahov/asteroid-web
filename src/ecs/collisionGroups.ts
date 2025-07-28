// Collision group constants for better readability
export const COLLISION_GROUPS = {
  PLAYER: 1,    // Player ship
  ASTEROID: 2,  // Asteroids
  BULLET: 4,    // Bullets
} as const;

// Collision masks - what each group can collide with
export const COLLISION_MASKS = {
  PLAYER: COLLISION_GROUPS.ASTEROID,                    // Player can hit asteroids
  //ASTEROID: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.BULLET| COLLISION_GROUPS.ASTEROID, // Asteroids can be hit by player and bullets
  ASTEROID: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.BULLET | COLLISION_GROUPS.ASTEROID,// Asteroids can be hit by player and bullets
  BULLET: COLLISION_GROUPS.ASTEROID,                    // Bullets can hit asteroids
} as const; 