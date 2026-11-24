import {
  AmbientLight, BoxGeometry, CircleGeometry, Color, DirectionalLight,
  EdgesGeometry, GridHelper, Group, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera,
  PlaneGeometry, Scene, SphereGeometry, TorusGeometry, Vector3, WebGLRenderer,
} from 'three';
import {BloomEffect, EffectComposer, EffectPass, RenderPass} from 'postprocessing';

const defaultColors = {body: '#f7a452', ground: '#182c3d', background: '#101d2a'};
const cameraPositions = {
  frente: [5, 3.7, 12],
  front: [5, 3.7, 12],
  lateral: [13, 3.8, 0.2],
  side: [13, 3.8, 0.2],
  arriba: [0, 15, 0],
  top: [0, 15, 0],
};

export function createThreeScene(canvas, {
  postprocessing = true,
  radius = 0.35,
  shape = 'esfera',
  colors = {},
} = {}) {
  const context = canvas.getContext('webgl2', {alpha: false, antialias: true, preserveDrawingBuffer: true});
  if (!context) throw new Error('La escena Three.js requiere WebGL 2.');

  const palette = {...defaultColors, ...colors};
  const renderer = new WebGLRenderer({canvas, context, alpha: false, antialias: true, preserveDrawingBuffer: true});
  const scene = new Scene();
  scene.background = new Color(palette.background);
  const camera = new OrthographicCamera(-5, 5, 3, -3, 0.1, 60);
  const impactLight = new DirectionalLight('#98dcff', 2.7);
  impactLight.position.set(-4, 5, 4);
  const fillLight = new DirectionalLight('#ffd1aa', 1.5);
  fillLight.position.set(4, 6, -3);
  scene.add(new AmbientLight('#f1f4ff', 1.05), impactLight, fillLight);

  const ground = new Mesh(
    new PlaneGeometry(14, 10),
    new MeshStandardMaterial({color: palette.ground, roughness: 0.86}),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.018;
  const grid = new GridHelper(14, 14, '#527994', '#31485b');
  grid.position.y = 0.002;
  scene.add(ground, grid);

  const body = new Group();
  const geometry = shape === 'cubo'
    ? new BoxGeometry(radius * 2, radius * 2, radius * 2)
    : new SphereGeometry(radius, 32, 20);
  const object = new Mesh(geometry, new MeshStandardMaterial({
    color: palette.body, emissive: palette.body, emissiveIntensity: 0.23,
    roughness: 0.27, metalness: 0.14,
  }));
  body.add(object);
  if (shape === 'cubo') {
    body.add(new LineSegments(new EdgesGeometry(geometry), new LineBasicMaterial({color: '#ffe7bd'})));
  } else {
    const stripe = new Mesh(
      new TorusGeometry(radius, radius * 0.043, 6, 36),
      new MeshBasicMaterial({color: '#ffe7bd'}),
    );
    stripe.rotation.x = Math.PI / 3;
    body.add(stripe);
  }
  scene.add(body);

  const shadow = new Mesh(
    new CircleGeometry(radius * 1.25, 24),
    new MeshBasicMaterial({color: '#020911', transparent: true, opacity: 0.55, depthWrite: false}),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.009;
  scene.add(shadow);

  const size = 10;
  const traceGeometry = new SphereGeometry(radius * 0.23, 12, 8);
  const trace = Array.from({length: size}, (_, index) => {
    const dot = new Mesh(traceGeometry, new MeshBasicMaterial({
      color: '#8fe8fc', transparent: true, depthWrite: false, opacity: 0.76 - index * 0.058,
    }));
    dot.scale.setScalar(1.10 - index * 0.06);
    scene.add(dot);
    return dot;
  });

  const engines = {three: 'Three.js WebGL 2', postprocessing: false, postprocessingAvailable: postprocessing};
  let composer;
  let bloomEffect;
  function prepareBloom() {
    if (composer) return;
    composer = new EffectComposer(renderer);
    bloomEffect = new BloomEffect({intensity: 2.5, luminanceThreshold: 0.46, mipmapBlur: true});
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, bloomEffect));
  }

  function resize(width, height) {
    const aspect = width / height;
    const widthSpan = Math.max(4.7, 3.4 * aspect);
    camera.left = -widthSpan;
    camera.right = widthSpan;
    camera.top = widthSpan / aspect;
    camera.bottom = -widthSpan / aspect;
    camera.updateProjectionMatrix();
    if (composer) composer.setSize(width, height, false);
    else renderer.setSize(width, height, false);
  }
  resize(canvas.width, canvas.height);

  return {
    engines,
    resize,
    project({x, y, z}) {
      camera.updateMatrixWorld();
      const point = new Vector3(x, y, z).project(camera);
      return {x: (point.x + 1) / 2, y: (1 - point.y) / 2};
    },
    render(frame, {physics, pose, bloom = true, trails = true, camera: view = 'frente'} = {}) {
      const frames = physics?.frames;
      const index = frames?.length ? Math.min(frames.length - 1, Math.max(0, Math.floor(frame))) : 0;
      const motion = frames?.[index];
      const position = motion?.position ?? {x: 0, y: radius + (pose?.elastic ?? 0) * 1.15, z: 0};
      const rotation = motion?.quaternion;
      const cameraPosition = Object.hasOwn(cameraPositions, view) ? cameraPositions[view] : cameraPositions.frente;
      const squash = Math.max(0.25, pose?.squash ?? 1);
      camera.position.set(...cameraPosition);
      camera.up.set(0, cameraPosition[2] === 0 ? 0 : 1, cameraPosition[2] === 0 ? -1 : 0);
      camera.lookAt(0, 2.1, 0);
      body.position.set(position.x, position.y, position.z);
      body.quaternion.set(rotation?.x ?? 0, rotation?.y ?? 0, rotation?.z ?? 0, rotation?.w ?? 1);
      if (pose?.yaw) body.rotateY(pose.yaw);
      body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      shadow.position.set(position.x, 0.009, position.z);
      const shadowScale = 1.14 + position.y * 0.24;
      shadow.scale.set(shadowScale, shadowScale, 1);
      shadow.material.opacity = 0.56 / (1 + position.y * 0.78);
      const flash = Math.min(1, Math.max(0, pose?.flash ?? (motion?.impact ? 1 : 0)));
      object.material.emissiveIntensity = 0.29 + flash * 0.72;
      const spacing = Math.max(1, Math.round((physics?.fps ?? 30) / 20));
      trace.forEach((dot, offset) => {
        const previous = trails ? frames?.[index - (offset + 1) * spacing]?.position : null;
        dot.visible = Boolean(previous);
        if (previous) dot.position.set(previous.x, previous.y, previous.z);
      });
      engines.postprocessing = false;
      if (postprocessing && bloom) {
        prepareBloom();
        renderer.autoClear = false;
        bloomEffect.intensity = 2.5 + flash * 0.8;
        composer.render(0);
        engines.postprocessing = true;
      } else {
        renderer.autoClear = true;
        renderer.render(scene, camera);
      }
      return {...position, impact: motion?.impact ?? false};
    },
    dispose() {
      composer?.dispose();
      traceGeometry.dispose();
      scene.traverse((item) => {
        if (item.geometry !== traceGeometry) item.geometry?.dispose();
        item.material?.dispose();
      });
      renderer.dispose();
    },
  };
}
