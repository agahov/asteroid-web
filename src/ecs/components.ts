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
};
