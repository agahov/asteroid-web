import * as PIXI from "pixi.js";

// Render layer for different types of game elements
class RenderLayer extends PIXI.Container {
  constructor(name: string, zIndex: number) {
    super();
    this.name = name;
    this.sortableChildren = true;
    this.zIndex = zIndex;
  }

  attach(element: PIXI.Container | PIXI.Graphics | PIXI.Text | PIXI.Sprite) {
    this.addChild(element);
  }
}

export class LayerManager {
  private static instance: LayerManager;
  private layers: Map<string, RenderLayer> = new Map();
  private app: PIXI.Application | null = null;
  // Container that holds all world (non-UI) layers
  private worldContainer: PIXI.Container | null = null;

  // Virtual world configuration
  private virtualWorldWidth = 1920;
  private virtualWorldHeight = 1080;
  private minGameScale = 1.0;
  private currentGameScale = 1.0;
  private currentWorldOffsetX = 0;
  private currentWorldOffsetY = 0;

  private constructor() {}

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  initialize(app: PIXI.Application) {
    this.app = app;
    // Ensure stage uses zIndex sorting so UI stays on top
    this.app.stage.sortableChildren = true;
    
    // Create a world container that will be scaled and positioned
    this.worldContainer = new PIXI.Container();
    this.worldContainer.name = 'WORLD_CONTAINER';
    this.worldContainer.zIndex = 0;
    this.app.stage.addChild(this.worldContainer);
    
    // Create layers with specific z-index values
    this.createLayer('UI', 9999);
    this.createLayer('GAME_OBJECTS', 1000);
    this.createLayer('BACKGROUND', 100);
  }

  private createLayer(name: string, zIndex: number) {
    const layer = new RenderLayer(name, zIndex);
    this.layers.set(name, layer);
    if (this.app) {
      // Place non-UI layers inside world container; UI stays directly on stage
      if (name === 'UI' || !this.worldContainer) {
        this.app.stage.addChild(layer);
      } else {
        this.worldContainer.addChild(layer);
      }
    }
  }

  getLayer(name: string): RenderLayer | undefined {
    return this.layers.get(name);
  }

  attachToLayer(layerName: string, element: PIXI.Container | PIXI.Graphics | PIXI.Text | PIXI.Sprite) {
    const layer = this.getLayer(layerName);
    if (layer) {
      layer.attach(element);
    } else {
      console.warn(`Layer '${layerName}' not found`);
    }
  }

  // Configuration for virtual world size and minimum scale
  configureVirtualWorld(width: number, height: number, minScale: number) {
    this.virtualWorldWidth = width;
    this.virtualWorldHeight = height;
    this.minGameScale = minScale;
    if (this.app) {
      this.updateScaleForScreen(this.app.screen.width, this.app.screen.height);
    }
  }

  // Recalculate and apply scale/offset for given screen size
  updateScaleForScreen(screenW: number, screenH: number) {
    const scaleX = screenW / this.virtualWorldWidth;
    const scaleY = screenH / this.virtualWorldHeight;
    const newScale = Math.max(scaleX, scaleY, this.minGameScale);
    this.currentGameScale = newScale;
    // Center world; negative offset means cropping
    const worldPixelW = this.virtualWorldWidth * newScale;
    const worldPixelH = this.virtualWorldHeight * newScale;
    // In camera-only model, keep world container at origin; do not center via container
    this.currentWorldOffsetX = 0;
    this.currentWorldOffsetY = 0;
    if (this.worldContainer) {
      this.worldContainer.scale.set(newScale);
      this.worldContainer.position.set(0, 0);
    }

    console.log('LayerManager new scale', this.currentGameScale); 
    console.log('LayerManager world offset (camera-only model)', this.currentWorldOffsetX, this.currentWorldOffsetY); 
    console.log('LayerManager world pixel size (scaled)', worldPixelW, worldPixelH); 

  }

  // Getters for camera/system usage
  getGameScale(): number { return this.currentGameScale; }
  getWorldOffset(): { x: number; y: number } { return { x: this.currentWorldOffsetX, y: this.currentWorldOffsetY }; }
  getVirtualWorldSize(): { width: number; height: number } { return { width: this.virtualWorldWidth, height: this.virtualWorldHeight }; }
  // Current screen view size in world units
  getViewSizeInWorld(screenW?: number, screenH?: number): { width: number; height: number } {
    const w = screenW ?? this.app?.screen.width ?? 0;
    const h = screenH ?? this.app?.screen.height ?? 0;
    const scale = this.currentGameScale || 1;
    return { width: w / scale, height: h / scale };
  }
}

// Layer name constants for easy access
export const LAYERS = {
  UI: 'UI',
  GAME_OBJECTS: 'GAME_OBJECTS',
  BACKGROUND: 'BACKGROUND'
} as const; 