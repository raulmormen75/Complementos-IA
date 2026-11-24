import {
  AxesHelper, Color, DirectionalLight, DoubleSide, GridHelper, HemisphereLight,
  Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGPURenderer,
} from 'three/webgpu';

export async function mountSurface() {
  const host = document.getElementById('three');
  const message = document.getElementById('three-estado');
  const flatCanvas = document.getElementById('lienzo');
  const angle = document.getElementById('angulo');
  const amplitude = document.getElementById('amplitud');
  if (!host || !message || !flatCanvas || !angle || !amplitude) return;
  host.hidden = false;
  message.textContent = 'Preparando Three.js.';
  let renderer;
  try {
    renderer = new WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    await renderer.init();
  } catch {
    renderer?.dispose?.();
    message.textContent = 'WebGPU y WebGL 2 no están disponibles para esta escena. Se muestra la proyección 2D.';
    return;
  }
  const scene = new Scene();
  scene.background = new Color('#eaf4fd');
  const camera = new PerspectiveCamera(42, 1, 0.1, 70);
  const geometry = new PlaneGeometry(6, 6, 48, 48).rotateX(-Math.PI / 2);
  const mesh = new Mesh(geometry, new MeshStandardMaterial({
    color: '#2787c3', side: DoubleSide, roughness: 0.58, metalness: 0.05,
  }));
  scene.add(mesh, new HemisphereLight('#f1f8ff', '#51647c', 2.15));
  const key = new DirectionalLight('#ffffff', 2.4);
  key.position.set(4, 8, 5);
  scene.add(key);
  const grid = new GridHelper(8, 16, '#76a6c8', '#b5d0e3');
  grid.position.y = -2.05;
  scene.add(grid, new AxesHelper(3.5));
  const resize = () => {
    const width = Math.max(280, Math.min(920, host.clientWidth || 720));
    const height = Math.round(width * 0.54);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const render = () => {
    const rotation = Number(angle.value) * Math.PI / 180;
    camera.position.set(9.3 * Math.sin(rotation), 6.1, 9.3 * Math.cos(rotation));
    camera.lookAt(0, 0, 0);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      positions.setY(index, Number(amplitude.value) * Math.sin(positions.getX(index)) * Math.cos(positions.getZ(index)));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    renderer.render(scene, camera);
  };
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Superficie matemática 3D. Ajusta giro y amplitud con los controles.');
  renderer.domElement.setAttribute('role', 'img');
  try {
    resize();
    render();
  } catch {
    renderer.domElement.remove();
    renderer.dispose();
    message.textContent = 'No se pudo dibujar la superficie en la tarjeta gráfica. Se muestra la proyección 2D.';
    return;
  }
  angle.addEventListener('input', render);
  amplitude.addEventListener('input', render);
  window.addEventListener('resize', () => {
    resize();
    render();
  });
  flatCanvas.hidden = true;
  message.textContent = renderer.backend?.isWebGPUBackend ? 'Three.js · WebGPU' : 'Three.js · WebGL 2';
}

document.addEventListener('graficos:render', ({ detail }) => {
  if (detail?.spec?.surface === 'sine') void mountSurface();
}, { once: true });
