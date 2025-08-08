// Vertex shader for explosion effect
export const explosionVertexShader = `
attribute vec2 aVertexPosition;
attribute vec2 aUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2 vUvs;

void main() {
    vUvs = aUvs;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
`;

// Fragment shader for explosion effect
export const explosionFragmentShader = `
varying vec2 vUvs;

uniform float uTime;
uniform float uDuration;
uniform float uScale;
uniform float uAlpha;
uniform float uIntensity;
uniform vec2 uResolution;

void main() {
    // Calculate normalized time (0.0 to 1.0)
    float t = uTime / uDuration;
    
    // Calculate distance from center
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = vUvs - center;
    float dist = length(uv);
    
    // Phase 1: Expand smoothly from center (0.0 to 0.7)
    float expandPhase = smoothstep(0.0, 0.7, t);
    float expandRadius = expandPhase * 0.8; // Expand to 80% of the graphic
    
    // Phase 2: Collapse into bright flash (0.7 to 1.0)
    float collapsePhase = smoothstep(0.7, 1.0, t);
    float collapseRadius = 0.8 - collapsePhase * 0.8; // Collapse from 80% to 0%
    
    // Combine phases
    float currentRadius = expandPhase < 0.7 ? expandRadius : collapseRadius;
    
    // Create ring effect with soft edges
    float ring = smoothstep(currentRadius + 0.1, currentRadius, dist) * 
                 smoothstep(currentRadius - 0.1, currentRadius, dist);
    
    // Add glow effect
    float glow = smoothstep(currentRadius + 0.2, currentRadius, dist);
    
    // Color gradient from orange to white
    vec3 color1 = vec3(1.0, 0.5, 0.0); // Orange
    vec3 color2 = vec3(1.0, 1.0, 1.0); // White
    
    // Interpolate colors based on time
    vec3 baseColor = mix(color1, color2, t);
    
    // Add intensity variation
    float intensity = uIntensity * (1.0 + sin(t * 20.0) * 0.3); // Pulsing effect
    
    // Combine ring and glow
    float alpha = (ring * 0.8 + glow * 0.4) * uAlpha * intensity;
    
    // Add bright flash at the end
    if (t > 0.8) {
        float flash = smoothstep(0.8, 1.0, t) * smoothstep(1.0, 0.9, t);
        alpha += flash * 2.0;
        baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), flash);
    }
    
    gl_FragColor = vec4(baseColor, alpha);
}
`; 