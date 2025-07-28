	import * as PIXI from "pixi.js";
	import { getProfilingData } from "../ecs/profiling";
// Removed the import of getProfilingData as it causes an error and is not used in the provided code

export class ProfilingUI {
  private container: PIXI.Container;
  private text: PIXI.Text;
  private background: PIXI.Graphics;
  private isVisible: boolean = false;

  constructor(app: PIXI.Application) {
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    
    // Create background
    this.background = new PIXI.Graphics();
    this.background.fill({ color: 0x000000, alpha: 0.8 });
    //this.background.drawRoundedRect(0, 0, 300, 200, 8);
    //this.background.fill();
    this.background.zIndex = 1000;
    
    // Create text
    this.text = new PIXI.Text('', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x00ff00,
      align: 'left',
    });
    this.text.x = 10;
    this.text.y = 10;
    this.text.zIndex = 1001;
    
    this.container.addChild(this.background);
    this.container.addChild(this.text);
    
    // Position in top-right corner
    this.container.x = app.screen.width - 320;
    this.container.y = 20;
    
    app.stage.addChild(this.container);
    
    // Toggle visibility with 'P' key
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        this.toggleVisibility();
      }
    });
  }

  private toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.container.visible = this.isVisible;
  }

  public update(pixiFPS?: number): void {
    if (!this.isVisible) return;
    
    const data = getProfilingData();
    
    let displayText = `🎯 PERFORMANCE\n`;
    displayText += `📊 Entities: ${data.totalEntities}\n`;
    displayText += `⏱️  Frame: ${data.frameTime.toFixed(1)}ms\n`;
    displayText += `🎮 FPS: ${pixiFPS ? pixiFPS.toFixed(1) : data.fps.toFixed(1)}\n\n`;
    displayText += `�� SYSTEMS:\n`;
    
    // Show top 5 slowest systems
    const sortedSystems = [...data.systems]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5);
    
    sortedSystems.forEach(system => {
      const color = system.executionTime > 5 ? '🔴' : system.executionTime > 2 ? '🟡' : '🟢';
      displayText += `${color} ${system.name}: ${system.executionTime.toFixed(1)}ms\n`;
    });
    
    this.text.text = displayText;
  }
} 