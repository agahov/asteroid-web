import * as PIXI from "pixi.js";
import { world } from "./ecs/world";
import { setupGame } from "./game/setupGame";
import { renderBorders } from "./game/createBorder";
import { runSystems } from "./ecs/systems";
import { setupInput } from "./input/input";
import { ProfilingUI } from "./ui/profilingUI";
import { LayerManager } from "./ui/LayerManager";
import { TextureCache } from "./game/TextureCache";
import { defineQuery } from "bitecs";
import { Camera } from "./ecs/components";

async function initGame() {
  const app = new PIXI.Application();
  // Wait for the application to be ready
  await app.init({
    backgroundColor: 0x000000, 
    // width: 800,
    // height: 600,
    resizeTo: window,
    hello: true,
    antialias: true
  });
  
  app.renderer.resize(window.innerWidth, window.innerHeight);

  app.canvas.style.position = 'fixed';
  app.canvas.style.top = '0';
  app.canvas.style.left = '0';
  app.canvas.style.right = '0';
  app.canvas.style.bottom = '0';

  document.body.appendChild(app.canvas);

  // Initialize LayerManager
  LayerManager.getInstance().initialize(app);

  // Setup input system
  setupInput();

  setupGame(world, app); // create ship, asteroids, etc.

  // Create profiling UI
  const profilingUI = new ProfilingUI(app);

  // Add this line to limit FPS
  app.ticker.maxFPS = 60;

  app.ticker.add((ticker) => {
    runSystems(world, ticker.deltaTime, app);
    profilingUI.update(ticker.FPS);
  });

  // Handle window resize: resize canvas and update camera inner rectangle
  const cameraQuery = defineQuery([Camera]);
  function handleResize() {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    const cams = cameraQuery(world);
    if (cams.length > 0) {
      const camId = cams[0];
      Camera.innerW[camId] = app.screen.width / 3;
      Camera.innerH[camId] = app.screen.height / 3;
    }
    // Re-render borders to fit new screen size
    renderBorders(world, app);
  }
  window.addEventListener('resize', handleResize);

  // Add cleanup for when the page is closed
  window.addEventListener('beforeunload', () => {
    TextureCache.getInstance().destroy();
    app.destroy(true);
  });
}

initGame();
