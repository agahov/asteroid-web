import * as PIXI from "pixi.js";

// Render layer for different types of game elements
class RenderLayer extends PIXI.Container {
  constructor(name: string, zIndex: number) {
    super();
    this.name = name;
    this.sortableChildren = true;
    this.zIndex = zIndex;
  }

  attach(element: PIXI.Container | PIXI.Graphics | PIXI.Text | PIXI.Sprite | PIXI.Mesh) {
    this.addChild(element);
  }
}

export class LayerManager {
  private static instance: LayerManager;
  private layers: Map<string, RenderLayer> = new Map();
  private app: PIXI.Application | null = null;

  private constructor() {}

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  initialize(app: PIXI.Application) {
    this.app = app;
    
    // Create layers with specific z-index values
    this.createLayer('UI', 9999);
    this.createLayer('GAME_OBJECTS', 1000);
    this.createLayer('BACKGROUND', 100);
  }

  private createLayer(name: string, zIndex: number) {
    const layer = new RenderLayer(name, zIndex);
    this.layers.set(name, layer);
    if (this.app) {
      this.app.stage.addChild(layer);
    }
  }

  getLayer(name: string): RenderLayer | undefined {
    return this.layers.get(name);
  }

  attachToLayer(layerName: string, element: PIXI.Container | PIXI.Graphics | PIXI.Text | PIXI.Sprite | PIXI.Mesh) {
    const layer = this.getLayer(layerName);
    if (layer) {
      layer.attach(element);
    } else {
      console.warn(`Layer '${layerName}' not found`);
    }
  }
}

// Layer name constants for easy access
export const LAYERS = {
  UI: 'UI',
  GAME_OBJECTS: 'GAME_OBJECTS',
  BACKGROUND: 'BACKGROUND'
} as const; 