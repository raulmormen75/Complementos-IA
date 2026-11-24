import React from 'react';
import {AbsoluteFill, Composition, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Production, productionDefaults, timing} from './Production';

type Props = {title: string; accent: string};

const Film: React.FC<Props> = ({title, accent}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const reveal = interpolate(frame, [0, fps * 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const turn = interpolate(frame, [0, 119], [-0.6, 0.65], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const progress = interpolate(frame, [12, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#111C26', color: '#F3EFE5', fontFamily: 'Arial, sans-serif'}}>
      <AbsoluteFill style={{left: width * 0.42, width: width * 0.58, opacity: reveal}}>
        <ThreeCanvas width={Math.round(width * 0.58)} height={height} camera={{position: [0, 0, 6], fov: 36}} gl={{antialias: true, alpha: true}}>
          <ambientLight intensity={0.35}/>
          <directionalLight position={[3, 4, 5]} intensity={3} color="#fff1d2"/>
          <directionalLight position={[-3, 0, 2]} intensity={0.7} color="#75b9e7"/>
          <mesh rotation={[0.2, turn, 0.15]} scale={0.93 + reveal * 0.07}>
            <torusKnotGeometry args={[1, 0.32, 128, 24]}/>
            <meshStandardMaterial color={accent} metalness={0.25} roughness={0.34}/>
          </mesh>
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 88, top: 146, width: 500, opacity: reveal, transform: `translateY(${(1-reveal)*24}px)`}}>
        <div style={{fontSize: 16, letterSpacing: 4, color: accent, marginBottom: 32}}>CREACIÓN AUDIOVISUAL</div>
        <h1 style={{fontSize: 76, lineHeight: 1.05, letterSpacing: -3, fontWeight: 500, margin: 0, maxWidth: 470}}>{title}</h1>
        <p style={{fontSize: 22, lineHeight: 1.5, maxWidth: 380, color: '#B9C7CD', marginTop: 28}}>Una idea. Decisiones que se ven.</p>
      </div>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <path d="M88 594 H1192" stroke="#344650" strokeWidth="1"/>
        <path d="M88 594 H1192" stroke={accent} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress}/>
      </svg>
      <div style={{position: 'absolute', left: 88, bottom: 70, fontSize: 14, color: '#B9C7CD', letterSpacing: 2}}>FORMA · LUZ · MOVIMIENTO</div>
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="Estudio" component={Film} durationInFrames={120} fps={30} width={1280} height={720} defaultProps={{title: 'Diseñar el movimiento.', accent: '#D9B879'}}/>
    <Composition id="DatosEnMovimiento" component={Production} durationInFrames={360} fps={30} width={1280} height={720}
      defaultProps={productionDefaults} calculateMetadata={({props}) => ({durationInFrames: timing(props).total})}/>
  </>
);
