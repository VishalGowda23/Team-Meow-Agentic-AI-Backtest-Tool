(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,38738,e=>{"use strict";var o=e.i(43476),i=e.i(71645),t=e.i(75056),n=e.i(71753),r=e.i(90072);function a({state:e,audioLevel:t}){let a=(0,i.useRef)(null),s=(0,i.useRef)(null),l=(0,i.useMemo)(()=>({uTime:{value:0},uAudioLevel:{value:0},uState:{value:0},uColor1:{value:new r.Color("#00e5ff")},uColor2:{value:new r.Color("#b388ff")},uColor3:{value:new r.Color("#c6ff00")}}),[]);(0,n.useFrame)((o,i)=>{s.current&&a.current&&(l.uTime.value+=i,l.uAudioLevel.value+=(t-l.uAudioLevel.value)*.1,l.uState.value+=(({idle:0,listening:1,processing:2,speaking:3})[e]-l.uState.value)*.05,a.current.rotation.y+=.15*i,a.current.rotation.x=.1*Math.sin(.3*l.uTime.value))});let c=`
    uniform float uTime;
    uniform float uAudioLevel;
    uniform float uState;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    // Simplex noise approximation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vNormal = normal;
      vPosition = position;

      // Base noise
      float speed = 0.4 + uState * 0.3;
      float noise = snoise(position * 1.5 + uTime * speed);
      float noise2 = snoise(position * 3.0 - uTime * speed * 0.7);

      // Displacement amplitude based on state
      float baseAmp = 0.04 + uState * 0.02;
      float audioAmp = uAudioLevel * 0.15;
      float totalAmp = baseAmp + audioAmp;

      float displacement = (noise * 0.6 + noise2 * 0.4) * totalAmp;
      vDisplacement = displacement;

      vec3 newPosition = position + normal * displacement;

      // Processing spin
      if (uState > 1.5 && uState < 2.5) {
        float spin = uTime * 2.0;
        float sx = sin(spin) * 0.02;
        float cx = cos(spin) * 0.02;
        newPosition.x += sx;
        newPosition.z += cx;
      }

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,u=`
    uniform float uTime;
    uniform float uAudioLevel;
    uniform float uState;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    void main() {
      // Fresnel effect for edge glow
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

      // Color mixing based on state
      vec3 baseColor = mix(uColor1, uColor2, sin(uTime * 0.5) * 0.5 + 0.5);

      // Listening: shift to cyan/green
      if (uState > 0.5 && uState < 1.5) {
        baseColor = mix(uColor1, uColor3, uAudioLevel);
      }
      // Processing: purple pulse
      else if (uState > 1.5 && uState < 2.5) {
        baseColor = mix(uColor2, uColor1, sin(uTime * 3.0) * 0.5 + 0.5);
      }
      // Speaking: warm cyan/lime
      else if (uState > 2.5) {
        baseColor = mix(uColor1, uColor3, sin(uTime * 2.0) * 0.3 + 0.5);
      }

      // Displacement coloring
      vec3 color = baseColor + vDisplacement * 2.0;

      // Glow
      float glowIntensity = 0.3 + uAudioLevel * 0.4 + fresnel * 0.6;
      color += baseColor * glowIntensity;

      // Alpha for transparency
      float alpha = 0.7 + fresnel * 0.3;

      gl_FragColor = vec4(color, alpha);
    }
  `;return(0,o.jsxs)("mesh",{ref:a,children:[(0,o.jsx)("icosahedronGeometry",{args:[1,64]}),(0,o.jsx)("shaderMaterial",{ref:s,vertexShader:c,fragmentShader:u,uniforms:l,transparent:!0,depthWrite:!1})]})}function s({state:e}){let t=(0,i.useRef)(null);return(0,n.useFrame)((o,i)=>{if(!t.current)return;t.current.rotation.z+=.2*i;let n="listening"===e?1.15:"processing"===e?1.1:1.05;t.current.scale.lerp(new r.Vector3(n,n,n),.05)}),(0,o.jsxs)("mesh",{ref:t,rotation:[Math.PI/2,0,0],children:[(0,o.jsx)("torusGeometry",{args:[1.3,.015,16,100]}),(0,o.jsx)("meshBasicMaterial",{color:"listening"===e?"#00e5ff":"processing"===e?"#b388ff":"#00e5ff",transparent:!0,opacity:.4})]})}function l({state:e,audioLevel:i,size:n=280}){return(0,o.jsxs)("div",{style:{width:n,height:n,position:"relative"},children:[(0,o.jsx)("div",{style:{position:"absolute",inset:"-20%",borderRadius:"50%",background:"listening"===e?"radial-gradient(circle, #00e5ff15, transparent 70%)":"processing"===e?"radial-gradient(circle, #b388ff15, transparent 70%)":"speaking"===e?"radial-gradient(circle, #c6ff0015, transparent 70%)":"radial-gradient(circle, #00e5ff08, transparent 70%)",animation:"idle"!==e?"pulse 2s ease-in-out infinite":"none",transition:"background 0.5s ease"}}),(0,o.jsxs)(t.Canvas,{camera:{position:[0,0,3],fov:45},style:{background:"transparent"},gl:{alpha:!0,antialias:!0},children:[(0,o.jsx)("ambientLight",{intensity:.3}),(0,o.jsx)("pointLight",{position:[5,5,5],intensity:.8,color:"#00e5ff"}),(0,o.jsx)("pointLight",{position:[-5,-3,2],intensity:.4,color:"#b388ff"}),(0,o.jsx)(a,{state:e,audioLevel:i}),(0,o.jsx)(s,{state:e})]})]})}e.s(["default",()=>l])},55024,e=>{e.n(e.i(38738))}]);