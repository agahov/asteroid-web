import * as PIXI from "pixi.js";

export class TextureCache {
  private static instance: TextureCache;
  private textures: Map<string, PIXI.Texture> = new Map();

  static getInstance(): TextureCache {
    if (!TextureCache.instance) {
      TextureCache.instance = new TextureCache();
    }
    return TextureCache.instance;
  }

  // Create different asteroid textures based on size categories
  getAsteroidTexture(app: PIXI.Application, radius: number): PIXI.Texture {
    // Group asteroids by size ranges to balance variety and performance
    const sizeCategory = Math.floor(radius / 5) * 5; // Groups: 10, 15, 20, etc.
    const key = `asteroid_${sizeCategory}`;
    
    if (!this.textures.has(key)) {
      // Generate a template asteroid for this size category
      const numPoints = 4 + Math.floor(Math.random() * 5); // 4 to 8 points
      const points: number[] = [];
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const pointRadius = radius * (0.7 + Math.random() * 0.6); // Vary radius by ±30%
        const px = Math.cos(angle) * pointRadius;
        const py = Math.sin(angle) * pointRadius;
        points.push(px, py);
      }

      const graphic = new PIXI.Graphics();
      graphic.poly(points).fill(0xff0000);
      
      const texture = app.renderer.generateTexture(graphic);
      this.textures.set(key, texture);
      
      // Clean up the temporary graphics object
      graphic.destroy();
    }
    
    return this.textures.get(key)!;
  }

  // Single reusable bullet texture
  getBulletTexture(app: PIXI.Application): PIXI.Texture {
    const key = 'bullet';
    
    if (!this.textures.has(key)) {
      const graphic = new PIXI.Graphics();
      graphic.circle(0, 0, 2).fill(0xffffff);
      
      const texture = app.renderer.generateTexture(graphic);
      this.textures.set(key, texture);
      
      // Clean up the temporary graphics object
      graphic.destroy();
    }
    
    return this.textures.get(key)!;
  }

  // Single reusable ship texture
  getShipTexture(app: PIXI.Application): PIXI.Texture {
    const key = 'ship';
    
    if (!this.textures.has(key)) {
      const graphic = new PIXI.Graphics();
      graphic
        .moveTo(10, 0)
        .lineTo(-10, 7)
        .lineTo(-10, -7)
        .lineTo(10, 0)
        .fill(0xffffff);
      
      const texture = app.renderer.generateTexture(graphic);
      this.textures.set(key, texture);
      
      // Clean up the temporary graphics object
      graphic.destroy();
    }
    
    return this.textures.get(key)!;
  }

  // Properly destroy all cached textures when shutting down
  destroy() {
    for (const texture of this.textures.values()) {
      texture.destroy(true); // true = also destroy BaseTexture to free GPU memory
    }
    this.textures.clear();
  }

  // Get stats for debugging
  getStats() {
    return {
      textureCount: this.textures.size,
      textureKeys: Array.from(this.textures.keys())
    };
  }
} 