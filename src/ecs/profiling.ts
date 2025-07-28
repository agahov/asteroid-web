import { defineComponent, defineQuery, enterQuery, exitQuery, Types } from "bitecs";
import type { GameWorld } from "./world";

// Profiling component to track system performance
export const Profiling = defineComponent({
  entityCount: Types.ui32,
  frameTime: Types.f32,
  fps: Types.f32,
});

// Profiling data structure
export interface SystemProfile {
  name: string;
  executionTime: number;
  entityCount: number;
}

export interface ProfilingData {
  totalEntities: number;
  systems: SystemProfile[];
  frameTime: number;
  fps: number;
  timestamp: number;
}

// Global profiling state
let profilingData: ProfilingData = {
  totalEntities: 0,
  systems: [],
  frameTime: 0,
  fps: 0,
  timestamp: 0,
};

// System execution time tracking
const systemTimers = new Map<string, number>();
const systemEntityCounts = new Map<string, number>();

// Profiling utilities
export function startSystemTimer(systemName: string): void {
  systemTimers.set(systemName, performance.now());
}

export function endSystemTimer(systemName: string, entityCount: number): void {
  const startTime = systemTimers.get(systemName);
  if (startTime) {
    const executionTime = performance.now() - startTime;
    systemEntityCounts.set(systemName, entityCount);
    
    // Update profiling data
    const existingSystem = profilingData.systems.find(s => s.name === systemName);
    if (existingSystem) {
      existingSystem.executionTime = executionTime;
      existingSystem.entityCount = entityCount;
    } else {
      profilingData.systems.push({
        name: systemName,
        executionTime,
        entityCount,
      });
    }
  }
}

export function updateProfilingData(world: GameWorld, frameTime: number): void {
  // Count total entities
  const allEntities = defineQuery([]);
  profilingData.totalEntities = allEntities(world).length;
  profilingData.frameTime = frameTime * 1000; // Convert seconds to milliseconds
  
  // Use the actual frame time to calculate FPS correctly
  if (frameTime > 0) {
    profilingData.fps = 1 / frameTime;
  } else {
    profilingData.fps = 0;
  }
  
  profilingData.timestamp = performance.now();
}

export function getProfilingData(): ProfilingData {
  return { ...profilingData };
}

export function logProfilingData(): void {
  console.group('🎯 Performance Profile');
  console.log(`�� Total Entities: ${profilingData.totalEntities}`);
  console.log(`⏱️  Frame Time: ${profilingData.frameTime.toFixed(2)}ms`);
  console.log(`🎮 FPS: ${profilingData.fps.toFixed(1)}`);
  console.log('\n�� System Performance:');
  
  // Sort systems by execution time (slowest first)
  const sortedSystems = [...profilingData.systems].sort((a, b) => b.executionTime - a.executionTime);
  
  sortedSystems.forEach(system => {
    const color = system.executionTime > 5 ? '🔴' : system.executionTime > 2 ? '🟡' : '🟢';
    console.log(`${color} ${system.name}: ${system.executionTime.toFixed(2)}ms (${system.entityCount} entities)`);
  });
  
  console.groupEnd();
}

// Profiling system that runs every frame
export function profilingSystem(world: GameWorld, deltaTime: number): void {
  console.log('DEBUG - profilingSystem deltaTime:', deltaTime, 'Expected FPS:', 1/deltaTime);
  updateProfilingData(world, deltaTime);
  
  // Log profiling data every 60 frames (about once per second at 60fps)
  if (Math.floor(performance.now() / 1000) % 1 === 0) {
    logProfilingData();
  }
} 