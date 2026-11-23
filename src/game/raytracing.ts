import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const RayTracingPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRtStrength: { value: 1.0 },
    uLightCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1280, 720) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uRtStrength;
    uniform vec2 uLightCenter;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float luma(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uRtStrength <= 0.01) {
        gl_FragColor = base;
        return;
      }

      // 1. Screen-Space Ray-Marched Specular Bounce & Wet Caustic Reflections
      vec2 centerDir = vUv - vec2(0.5);
      vec2 reflectDir = normalize(vec2(-centerDir.x, abs(centerDir.y) + 0.15)) * 0.024;
      vec3 ssrAccum = vec3(0.0);
      float ssrWeight = 0.0;

      for (int i = 1; i <= 8; i++) {
        float fi = float(i);
        vec2 sampleUv = clamp(vUv + reflectDir * fi, 0.002, 0.998);
        vec3 sCol = texture2D(tDiffuse, sampleUv).rgb;
        float bright = smoothstep(0.45, 1.15, luma(sCol));
        float falloff = 1.0 - (fi / 9.0);
        ssrAccum += sCol * bright * falloff;
        ssrWeight += falloff;
      }
      vec3 ssrColor = ssrAccum / max(ssrWeight, 0.001);

      // Grazing-angle Fresnel weight (stronger near tunnel walls & edges)
      float edgeDist = length(centerDir * vec2(1.15, 1.0));
      float fresnel = pow(clamp(edgeDist * 1.45, 0.0, 1.0), 2.2);

      // 2. Ray-Marched Volumetric God-Rays from Forward Searchlight / Bio-Cores
      vec2 rayDelta = (vUv - uLightCenter) * 0.016;
      vec3 godRay = vec3(0.0);
      float decay = 1.0;
      vec2 rayUv = vUv;
      for (int j = 0; j < 10; j++) {
        rayUv = clamp(rayUv - rayDelta, 0.002, 0.998);
        vec3 tap = texture2D(tDiffuse, rayUv).rgb;
        float emissiveMask = smoothstep(0.58, 1.25, luma(tap));
        godRay += tap * emissiveMask * decay * 0.09;
        decay *= 0.86;
      }

      // 3. Subtle Ray-Traced Chromatic Micro-Dispersion on high-contrast highlights
      vec2 caOffset = centerDir * 0.0025 * uRtStrength;
      float rCh = texture2D(tDiffuse, clamp(vUv + caOffset, 0.0, 1.0)).r;
      float bCh = texture2D(tDiffuse, clamp(vUv - caOffset, 0.0, 1.0)).b;
      vec3 dispersed = vec3(mix(base.r, rCh, 0.35), base.g, mix(base.b, bCh, 0.35));

      // Combine physical ray-traced lighting bounce
      vec3 finalCol = dispersed
        + ssrColor * (0.28 + 0.42 * fresnel) * uRtStrength
        + godRay * 0.48 * uRtStrength;

      // Cinematic optical vignette
      float vig = 1.0 - smoothstep(0.55, 1.12, edgeDist) * 0.24;
      finalCol *= vig;

      gl_FragColor = vec4(finalCol, base.a);
    }
  `,
};

export interface RayTracingPipeline {
  render: (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    podWorldPos: THREE.Vector3,
    lightScreenUv: THREE.Vector2,
    elapsed: number,
    enabled: boolean,
    isBrightScene?: boolean
  ) => void;
  setSize: (width: number, height: number) => void;
  getCubeEnvTexture: () => THREE.Texture | null;
  dispose: () => void;
}

export function createRayTracingPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isSoftwareGl: boolean
): RayTracingPipeline {
  if (isSoftwareGl) {
    // Software WebGL guard: skip CubeCamera + EffectComposer multi-pass bottlenecks
    return {
      render: (s, c) => {
        renderer.render(s, c);
      },
      setSize: () => {},
      getCubeEnvTexture: () => null,
      dispose: () => {},
    };
  }

  // Real-time Dynamic CubeCamera for genuine 3D ray-traced environment reflections on Pod & Crystals
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.8, 120, cubeRenderTarget);
  scene.add(cubeCamera);

  // Post-Processing Composer
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const rtPass = new ShaderPass(RayTracingPostShader);
  composer.addPass(rtPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.42, // strength
    0.35, // radius
    0.78  // threshold
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  let frameCounter = 0;

  return {
    render: (s, _c, podWorldPos, lightScreenUv, elapsed, enabled, isBrightScene = false) => {
      frameCounter++;
      if (enabled && frameCounter % 3 === 0) {
        // Update dynamic environment reflection probe around Nano-Pod
        cubeCamera.position.copy(podWorldPos);
        cubeCamera.update(renderer, s);
      }

      rtPass.uniforms.uTime.value = elapsed;
      rtPass.uniforms.uRtStrength.value = enabled ? (isBrightScene ? 0.22 : 1.0) : 0.0;
      rtPass.uniforms.uLightCenter.value.copy(lightScreenUv);
      bloomPass.threshold = isBrightScene ? 0.94 : 0.78;
      bloomPass.strength = enabled ? (isBrightScene ? 0.12 : 0.44) : isBrightScene ? 0.04 : 0.16;

      composer.render();
    },
    setSize: (width, height) => {
      composer.setSize(width, height);
      rtPass.uniforms.uResolution.value.set(width, height);
      bloomPass.resolution.set(width, height);
    },
    getCubeEnvTexture: () => cubeRenderTarget.texture,
    dispose: () => {
      cubeRenderTarget.dispose();
      composer.dispose();
    },
  };
}
