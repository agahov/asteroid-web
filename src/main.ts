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
import { Camera, Position } from "./ecs/components";

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
  // Configure virtual world and initial scale
  // Example virtual size; can be tuned. Min scale prevents too much zoom-in on small screens
  //LayerManager.getInstance().configureVirtualWorld(1920, 1080, 0.5);
  LayerManager.getInstance().configureVirtualWorld(768, 1024, 0.5);
  LayerManager.getInstance().updateScaleForScreen(app.screen.width, app.screen.height);

  // Setup input system
  setupInput();

  // Mount mobile HTML controls (Vue) after PIXI canvas is ready
  // Safe on all platforms; CSS can hide on desktop. Optionally gate by matchMedia.
  const { mountMobileControls } = await import('./ui/mobile/mountInputControls');
  mountMobileControls();

  setupGame(world, app); // create ship, asteroids, etc.

  // Create profiling UI
  //const profilingUI = new ProfilingUI(app);

  // Add this line to limit FPS
  app.ticker.maxFPS = 60;

  app.ticker.add((ticker) => {
    runSystems(world, ticker.deltaTime, app);
  //  profilingUI.update(ticker.FPS);
  });

  // Handle window resize: resize canvas, update scaling and camera inner rectangle
  const cameraQuery = defineQuery([Camera, Position]);
  function handleResize() {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    LayerManager.getInstance().updateScaleForScreen(app.screen.width, app.screen.height);
    const cams = cameraQuery(world);
    if (cams.length > 0) {
      const camId = cams[0];
      const view = LayerManager.getInstance().getViewSizeInWorld(app.screen.width, app.screen.height);
      Camera.innerW[camId] = view.width / 3;
      Camera.innerH[camId] = view.height / 3;
      console.log('handleResize camera inner size', Camera.innerW[camId], Camera.innerH[camId]); 
    }
    // Re-render borders to fit new screen size

    console.log('handleResize app size', app.screen.width, app.screen.height); 
    //console.log('handleResize world ', LayerManager.getInstance().getVirtualWorldSize()); 
    //console.log('handleResize world scale', LayerManager.getInstance().currentGameScale); 


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
