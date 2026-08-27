"use client";

import { useEffect, useRef } from "react";

export const FluidBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext;

    if (!gl) {
      console.error("WebGL is not supported");
      return;
    }

    // ============================================================
    // VERTEX SHADER
    // ============================================================
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // ============================================================
    // FRAGMENT SHADER
    // ============================================================
    const fragmentShaderSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      #define PI 3.14159265359

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          value += noise(p) * amplitude;
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      vec2 domainWarp(vec2 p, float time) {
        vec2 q;
        q.x = fbm(p + vec2(0.0, time * 0.08));
        q.y = fbm(p + vec2(5.2, 1.3) - vec2(time * 0.06, 0.0));
        vec2 r;
        r.x = fbm(p + 3.5 * q + vec2(1.7, 9.2));
        r.y = fbm(p + 3.5 * q + vec2(8.3, 2.8));
        return p + 1.35 * r;
      }

      float ripple(vec2 p, vec2 center, float scale, float speed, float strength) {
        float d = distance(p, center);
        float wave = sin(d * scale - u_time * speed);
        float falloff = exp(-d * 2.8);
        return wave * falloff * strength;
      }

      float liquidRipples(vec2 p) {
        float r = 0.0;
        r += ripple(p, vec2(-0.55, 0.15), 18.0, 1.4, 0.06);
        r += ripple(p, vec2(0.25, -0.25), 22.0, 1.2, 0.055);
        r += ripple(p, vec2(0.75, 0.30), 26.0, 1.6, 0.045);
        return r;
      }

      float liquidField(vec2 p, float time) {
        vec2 warped = domainWarp(p, time);
        float large = fbm(warped * 1.65);
        float medium = fbm(warped * 3.4 + time * 0.03);
        float small = fbm(warped * 7.0 - time * 0.05);
        return large * 0.65 + medium * 0.25 + small * 0.10;
      }

      float liquidHighlight(vec2 p, float field, float time) {
        float e = 0.01;
        float fx = liquidField(p + vec2(e, 0.0), time);
        float fy = liquidField(p + vec2(0.0, e), time);
        float gx = (fx - field) / e;
        float gy = (fy - field) / e;
        vec3 normal = normalize(vec3(-gx * 7.0, -gy * 7.0, 1.0));
        vec3 light = normalize(vec3(-0.4, 0.5, 1.0));
        float spec = pow(max(dot(normal, light), 0.0), 14.0);
        return spec;
      }

      float glowShape(vec2 p, vec2 center, float radius) {
        float d = distance(p, center);
        return exp(-pow(d / radius, 2.0));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = uv - 0.5;
        p.x *= aspect;

        vec2 mouse = u_mouse - 0.5;
        mouse.x *= aspect;
        float mouseDistance = distance(p, mouse);
        float mouseInfluence = exp(-mouseDistance * 2.0);
        p += normalize(p - mouse + 0.001) * mouseInfluence * 0.025;

        float time = u_time * 0.18;
        float field = liquidField(p, time);
        float ripples = liquidRipples(p);
        field += ripples;

        float liquid = smoothstep(0.43, 0.68, field);
        float contour = smoothstep(0.02, 0.0, abs(field - 0.56));
        float contour2 = smoothstep(0.018, 0.0, abs(field - 0.49));

        vec3 black = vec3(0.002, 0.012, 0.004);
        vec3 deepGreen = vec3(0.008, 0.12, 0.025);
        vec3 green = vec3(0.02, 0.65, 0.12);
        vec3 electricGreen = vec3(0.08, 1.0, 0.32);
        vec3 lime = vec3(0.32, 0.95, 0.05);

        vec3 color = mix(black, deepGreen, liquid);
        color = mix(color, green, smoothstep(0.48, 0.82, field) * 0.65);

        float limeMask = smoothstep(0.58, 0.82, field);
        color = mix(color, lime, limeMask * 0.22);

        float spec = liquidHighlight(p, field, time);
        color += electricGreen * spec * 1.15;
        color += electricGreen * contour * 0.85;
        color += lime * contour2 * 0.45;

        float glow1 = glowShape(p, vec2(0.55, 0.10), 0.65);
        float glow2 = glowShape(p, vec2(-0.45, -0.20), 0.50);
        float glow3 = glowShape(p, vec2(0.15, 0.35), 0.42);

        color += vec3(0.01, 0.20, 0.05) * glow1 * 0.45;
        color += vec3(0.03, 0.18, 0.02) * glow2 * 0.30;
        color += vec3(0.02, 0.30, 0.08) * glow3 * 0.35;

        float edge = smoothstep(0.045, 0.0, abs(field - 0.57));
        color += electricGreen * edge * 0.25;

        float vignette = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.0, 0.85)));
        color *= 0.72 + vignette * 0.38;

        float grain = hash21(gl_FragCoord.xy + u_time);
        color += (grain - 0.5) * 0.008;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ============================================================
    // SHADER COMPILATION
    // ============================================================
    function createShader(type: number, source: string): WebGLShader {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Shader compilation failed: " + log);
      }
      return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create WebGL program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      throw new Error("Program linking failed");
    }

    gl.useProgram(program);

    // ============================================================
    // FULLSCREEN QUAD
    // ============================================================
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // ============================================================
    // UNIFORMS
    // ============================================================
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    // ============================================================
    // MOUSE
    // ============================================================
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    function handleMouse(event: MouseEvent) {
      targetMouseX = event.clientX / window.innerWidth;
      targetMouseY = 1.0 - event.clientY / window.innerHeight;
    }

    window.addEventListener("mousemove", handleMouse, { passive: true });

    // ============================================================
    // RESIZE
    // ============================================================
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // ============================================================
    // ANIMATION LOOP
    // ============================================================
    const start = performance.now();
    let animationFrame = 0;

    function render() {
      const elapsed = (performance.now() - start) / 1000;

      mouseX += (targetMouseX - mouseX) * 0.035;
      mouseY += (targetMouseY - mouseY) * 0.035;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = requestAnimationFrame(render);
    }

    render();

    // ============================================================
    // CLEANUP
    // ============================================================
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 0,
        pointerEvents: "none",
        background: "#01030a",
      }}
    />
  );
};
