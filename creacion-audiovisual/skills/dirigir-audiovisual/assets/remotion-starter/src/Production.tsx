import React, {useEffect, useMemo} from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {ThreeWebGPUCanvas} from '@remotion/three/webgpu';
import {useLoader} from '@react-three/fiber';
import {Box3, ExtrudeGeometry, Shape, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {AnimatedChart, type ChartSpec} from './AnimatedChart';

export type Footage = {file: string; seconds: number; offset?: number; volume?: number};
export type Caption = {start: number; end: number; text: string};
export type Outline = {points: [number, number][]; depth: number};
export type ProductionProps = {
  chart: ChartSpec;
  accent?: string;
  chartSeconds?: number;
  chartEngine?: 'recharts' | 'svg';
  clip?: Footage;
  mathScene?: Footage;
  narration?: string;
  captions?: Caption[];
  model?: string;
  geometry?: Outline;
  modelSeconds?: number;
  render3d?: 'webgl2' | 'webgpu';
};

const fps = 30;
const frames = (seconds: number, title: string) => {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 120) throw new Error('Duración inválida: ' + title);
  return Math.ceil(seconds * fps);
};

function publicFile(file: string) {
  if (!file || file.includes('..') || !/^[\p{L}\p{N} ._/-]+$/u.test(file) || file.startsWith('/')) {
    throw new Error('Usa un archivo local dentro de public, sin URL ni ruta absoluta.');
  }
  return staticFile(file);
}

export function timing(props: ProductionProps) {
  const chart = frames(props.chartSeconds ?? 7, 'gráfica');
  const clip = props.clip ? frames(props.clip.seconds, 'clip') : 0;
  const math = props.mathScene ? frames(props.mathScene.seconds, 'matemáticas') : 0;
  const model = frames(props.modelSeconds ?? 5, 'modelo');
  return {chart, clip, math, model, total: chart + clip + math + model};
}

function Captions({entries}: {entries: Caption[]}) {
  const frame = useCurrentFrame();
  const active = entries.find((entry) => frame / fps >= entry.start && frame / fps < entry.end);
  if (!active) return null;
  return (
    <div style={{position: 'absolute', bottom: 85, width: '100%', textAlign: 'center', color: '#fff', font: '24px Arial'}}>
      <span style={{padding: '6px 12px', background: '#111C26', borderRadius: 4, display: 'inline-block', maxWidth: '76%'}}>{active.text}</span>
    </div>
  );
}

function MeshFromFile({asset}: {asset: string}) {
  const data = useLoader(GLTFLoader, publicFile(asset));
  const {model, center, scale} = useMemo(() => {
    const clone = data.scene.clone();
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    if (!extent || !Number.isFinite(extent)) throw new Error('El archivo GLB no contiene geometría visible.');
    return {model: clone, center: bounds.getCenter(new Vector3()).multiplyScalar(-1), scale: 2.4 / extent};
  }, [data.scene]);
  return <group scale={scale}><group position={center}><primitive object={model}/></group></group>;
}

function OutlineMesh({geometry, accent}: {geometry: Outline; accent: string}) {
  const mesh = useMemo(() => {
    if (!Array.isArray(geometry.points) || geometry.points.length < 3 || geometry.points.length > 180
      || !geometry.points.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
      || !Number.isFinite(geometry.depth) || geometry.depth <= 0) {
      throw new Error('El perfil 3D requiere de 3 a 180 pares de coordenadas y profundidad positiva.');
    }
    const shape = new Shape();
    geometry.points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const result = new ExtrudeGeometry(shape, {depth: geometry.depth, bevelEnabled: false});
    result.center();
    result.computeBoundingBox();
    const box = result.boundingBox;
    const extent = box ? Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z) : 0;
    if (!extent || !Number.isFinite(extent)) throw new Error('El perfil no define un volumen válido.');
    result.scale(2.4 / extent, 2.4 / extent, 2.4 / extent);
    return result;
  }, [geometry]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return <mesh geometry={mesh}><meshStandardMaterial color={accent} metalness={0.22} roughness={0.37}/></mesh>;
}

function ModelScene({model, geometry, accent, renderer, span}: {
  model?: string; geometry?: Outline; accent: string; renderer: 'webgl2' | 'webgpu'; span: number;
}) {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const angle = interpolate(frame, [0, Math.max(1, span - 1)], [-0.64, 0.68]);
  const camera = {position: [0, 0, 6] as [number, number, number], fov: 36};
  const scene = (
    <>
      <ambientLight intensity={0.55}/>
      <directionalLight position={[3, 4, 5]} intensity={3.5} color="#fff1d2"/>
      <directionalLight position={[-4, 1, 1]} intensity={1.2} color="#75b9e7"/>
      <group rotation={[0.23, angle, 0.05]}>
        {model ? <MeshFromFile asset={model}/> : geometry ? <OutlineMesh geometry={geometry} accent={accent}/> :
          <mesh><torusKnotGeometry args={[1, 0.24, 128, 24]}/>
            <meshStandardMaterial color={accent} metalness={0.22} roughness={0.35}/></mesh>}
      </group>
    </>
  );
  return (
    <AbsoluteFill style={{background: '#111C26'}}>
      {renderer === 'webgpu'
        ? <ThreeWebGPUCanvas width={width} height={height} camera={camera}>{scene}</ThreeWebGPUCanvas>
        : <ThreeCanvas width={width} height={height} camera={camera} gl={{antialias: true, alpha: true}}>{scene}</ThreeCanvas>}
    </AbsoluteFill>
  );
}

function Video({footage}: {footage: Footage}) {
  const offset = footage.offset ?? 0;
  const volume = footage.volume ?? 0;
  if (!Number.isFinite(offset) || offset < 0 || !Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new Error('El clip requiere offset no negativo y volumen entre 0 y 1.');
  }
  return <OffthreadVideo src={publicFile(footage.file)} startFrom={Math.floor(offset * fps)} volume={volume}
    style={{width: '100%', height: '100%', objectFit: 'contain'}}/>;
}

export function Production(props: ProductionProps) {
  const length = timing(props);
  const accent = /^#[0-9a-f]{6}$/i.test(props.accent ?? '') ? props.accent as string : '#D9B879';
  return (
    <AbsoluteFill style={{background: '#111C26'}}>
      <Sequence durationInFrames={length.chart} name="Datos">
        <AnimatedChart chart={props.chart} accent={accent} engine={props.chartEngine ?? 'recharts'}/>
      </Sequence>
      {props.clip && <Sequence from={length.chart} durationInFrames={length.clip} name="Fragmento"><Video footage={props.clip}/></Sequence>}
      <Sequence from={length.chart + length.clip} durationInFrames={length.model} name="Modelo 3D">
        <ModelScene model={props.model} geometry={props.geometry} accent={accent} renderer={props.render3d ?? 'webgl2'} span={length.model}/>
      </Sequence>
      {props.mathScene && <Sequence from={length.chart + length.clip + length.model} durationInFrames={length.math} name="Explicación con Manim">
        <Video footage={props.mathScene}/>
      </Sequence>}
      {props.narration && <Audio src={publicFile(props.narration)}/>}
      {props.captions && <Captions entries={props.captions}/>}
    </AbsoluteFill>
  );
}

export const productionDefaults: ProductionProps = {
  chart: {
    title: 'Distribución por grupo',
    source: 'Datos sintéticos de demostración',
    unit: 'Observaciones',
    x: 'grupo',
    y: 'conteo',
    rows: [{grupo: 'A', conteo: 9}, {grupo: 'B', conteo: 14}, {grupo: 'C', conteo: 11}],
  },
};
