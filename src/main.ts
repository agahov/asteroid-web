import * as PIXI from "pixi.js";
import { world } from "./ecs/world";
import { setupGame } from "./game/setupGame";
import { runSystems } from "./ecs/systems";
import { setupInput } from "./input/input";

async function initGame() {
  const app = new PIXI.Application();
  // Wait for the application to be ready
  await app.init({
    backgroundColor: 0x000000, 
    hello: true,
    antialias: true
  });
  
  app.renderer.resize(window.innerWidth, window.innerHeight);

  document.body.appendChild(app.canvas);

  // Setup input system
  setupInput();

  setupGame(world, app); // create ship, asteroids, etc.

  app.ticker.add((ticker) => {
    runSystems(world, ticker.deltaTime, app);
  });
}

initGame().catch(console.error);
