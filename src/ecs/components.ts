import { defineComponent, Types } from "bitecs";

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Rotation = defineComponent({
  angle: Types.f32,
});

export const Input = defineComponent({
  up: Types.ui8,
  down: Types.ui8,
  left: Types.ui8,
  right: Types.ui8,
  space: Types.ui8,
});

export const Sprite = defineComponent();
export const Player = defineComponent();
export const Asteroid = defineComponent();
export const Bullet = defineComponent();

export const Lifetime = defineComponent({
  timeLeft: Types.f32,
});

// Collision component for collision detection
export const Collision = defineComponent({
  // Circle collider (for dynamic entities)
  radius: Types.f32,
  // Rect collider (for static border)
  rectW: Types.f32,
  rectH: Types.f32,
  // Group and mask
  group: Types.ui8,
  mask: Types.ui8,
});

// RemoveMark component for marking entities for removal
export const RemoveMark = defineComponent();

// Hiter component - entities that can deal damage
export const Hiter = defineComponent({
  value: Types.f32,     // Amount of damage this entity deals
});

// Damage component - entities that have been hit and should take damage
export const Damage = defineComponent({
  amount: Types.f32,    // Amount of damage to deal
  hiterX: Types.f32,    // X position of the entity that caused the damage
  hiterY: Types.f32,    // Y position of the entity that caused the damage
});

// Health component - entities that have health
export const Health = defineComponent({
  current: Types.f32,   // Current health
  max: Types.f32,       // Maximum health
});

// Mass component - affects physics calculations
export const Mass = defineComponent({
  value: Types.f32,     // Mass value (higher = more inertia, less affected by forces)
});

// Friction component - affects how quickly entities slow down
export const Friction = defineComponent({
  value: Types.f32,     // Friction factor (0-1, where 1 = no friction, 0 = complete stop)
});

// Impulse component - temporary force applied to entities
export const Impulse = defineComponent({
  x: Types.f32,         // X component of impulse force
  y: Types.f32,         // Y component of impulse force
});

// CollisionDelay component - entities that have collision disabled for a period
export const CollisionDelay = defineComponent({
  timeLeft: Types.f32,  // Time remaining before collision is enabled
});

// Particle component - marks an entity as a particle for VFX
export const Particle = defineComponent();

// ChainTimer component - simple timer for chain particle spawning
export const ChainTimer = defineComponent({
  timeLeft: Types.f32,    // Time remaining before spawning chain particle
  chainCount: Types.ui8,  // Number of particles to spawn in chain
  baseSize: Types.f32,    // Base size for chain particles
});

// FadeComp component - for entities that need fade effects
export const FadeComp = defineComponent({
  startAlpha: Types.f32,  // Starting alpha
  endAlpha: Types.f32,    // Target alpha
  duration: Types.f32,    // Fade duration in seconds
  currentTime: Types.f32, // Current time in fade
});

// MeshVFX component - for mesh-based visual effects with shaders
export const MeshVFX = defineComponent({
  startTime: Types.f32,     // When the effect started
  duration: Types.f32,      // Total duration of the effect
  currentTime: Types.f32,   // Current time in the effect
  scale: Types.f32,         // Current scale of the mesh
  alpha: Types.f32,         // Current alpha value
  intensity: Types.f32,     // Current intensity/brightness
});

// Default export to ensure this is recognized as a module
export default {
  Position,
  Velocity,
  Rotation,
  Input,
  Sprite,
  Player,
  Asteroid,
  Bullet,
  Collision,
  RemoveMark,
  Hiter,
  Damage,
  Health,
  Mass,
  Friction,
  Impulse,
  CollisionDelay,
  Particle,
  ChainTimer,
  FadeComp,
  MeshVFX,
};
