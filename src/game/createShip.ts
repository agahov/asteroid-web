import * as PIXI from "pixi.js";
import { addEntity, addComponent } from "bitecs";
import { Position, Velocity, Sprite, Player, Rotation, Input, Collision } from "../ecs/components";
import { type GameWorld } from "../ecs/world";
import { COLLISION_GROUPS, COLLISION_MASKS } from "../ecs/collisionGroups";

export function createShip(world: GameWorld, app: PIXI.Application) {
  const ship = addEntity(world);
  console.log('Created ship entity:', ship);
  
  // Add all components to the entity
  addComponent(world, Position, ship);
  addComponent(world, Velocity, ship);
  addComponent(world, Rotation, ship);
  addComponent(world, Input, ship);
  addComponent(world, Sprite, ship);
  addComponent(world, Player, ship);
  addComponent(world, Collision, ship);
  
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

  console.log('Ship components set:', {
    entity: ship,
    position: { x: Position.x[ship], y: Position.y[ship] },
    velocity: { x: Velocity.x[ship], y: Velocity.y[ship] },
    rotation: Rotation.angle[ship],
    input: { up: Input.up[ship], down: Input.down[ship], left: Input.left[ship], right: Input.right[ship], space: Input.space[ship] },
    sprite: Sprite[ship],
    player: Player[ship]
  });

  const graphic = new PIXI.Graphics();
  //graphic.beginFill(0xffffff);
  graphic.moveTo(10, 0);
  graphic.lineTo(-10, 7);
  graphic.lineTo(-10, -7);
  graphic.lineTo(10, 0);

  
  graphic.fill(0xffffff);
  //graphic.endFill();
  
  //graphic.endFill();

  const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
  sprite.anchor.set(0.5);
  sprite.x = Position.x[ship];
  sprite.y = Position.y[ship];
  app.stage.addChild(sprite);

  world.pixiSprites.set(ship, sprite);
}
