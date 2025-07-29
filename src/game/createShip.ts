import * as PIXI from "pixi.js";
import { addEntity, addComponent } from "bitecs";
import { Position, Velocity, Sprite, Player, Rotation, Input, Collision, Health, Mass, Friction, Hiter } from "../ecs/components";
import { type GameWorld } from "../ecs/world";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";
import { LayerManager, LAYERS } from "../ui/LayerManager";
import { TextureCache } from "./TextureCache";

export function createShip(world: GameWorld, app: PIXI.Application) {
  const ship = addEntity(world);
  //console.log('Created ship entity:', ship);
  
  // Add all components to the entity
  addComponent(world, Position, ship);
  addComponent(world, Velocity, ship);
  addComponent(world, Rotation, ship);
  addComponent(world, Input, ship);
  addComponent(world, Sprite, ship);
  addComponent(world, Player, ship);
  addComponent(world, Collision, ship);
  addComponent(world, Health, ship);
  addComponent(world, Mass, ship);
  addComponent(world, Friction, ship);
  addComponent(world, Hiter, ship);
  
  // Set component values
  Position.x[ship] = app.screen.width / 2;
  Position.y[ship] = app.screen.height / 2;
  Velocity.x[ship] = 0;
  Velocity.y[ship] = 0;
  Rotation.angle[ship] = 0;

  // Initialize input state
  Input.up[ship] = 0;
  Input.down[ship] = 0;
  Input.left[ship] = 0;
  Input.right[ship] = 0;
  Input.space[ship] = 0;

  // Set collision properties
  Collision.radius[ship] = 10; // Ship collision radius
  Collision.group[ship] = COLLISION_GROUPS.PLAYER;
  Collision.mask[ship] = COLLISION_MASKS.PLAYER;

  // Set health properties
  Health.current[ship] = 100; // Player has 5 health
  Health.max[ship] = 200;

  // Set mass properties
  Mass.value[ship] = 1.0; // Ship has medium mass
  
  // Set friction properties
  Friction.value[ship] = 0.98; // Ship has medium friction

  // Set damage value
  Hiter.value[ship] = 50;

  // console.log('Ship components set:', {
  //   entity: ship,
  //   position: { x: Position.x[ship], y: Position.y[ship] },
  //   velocity: { x: Velocity.x[ship], y: Velocity.y[ship] },
  //   rotation: Rotation.angle[ship],
  //   input: { up: Input.up[ship], down: Input.down[ship], left: Input.left[ship], right: Input.right[ship], space: Input.space[ship] },
  //   sprite: Sprite[ship],
  //   player: Player[ship]
  // });

  // Use cached texture instead of generating new one
  const texture = TextureCache.getInstance().getShipTexture(app);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = Position.x[ship];
  sprite.y = Position.y[ship];
  
  // Attach to GAME_OBJECTS layer using LayerManager
  LayerManager.getInstance().attachToLayer(LAYERS.GAME_OBJECTS, sprite);

  world.pixiSprites.set(ship, sprite);
}
