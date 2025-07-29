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
  radius: Types.f32,    // Collision radius
  group: Types.ui8,     // Collision group (what this entity belongs to)
  mask: Types.ui8,      // Collision mask (what this entity can collide with)
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
};
