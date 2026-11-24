import Rapier from '@dimforge/rapier3d-compat';

let initialized;

export async function bakePhysics({
  fps = 30,
  frames = 120,
  gravity = -9.81,
  restitution = 0.72,
  height = 3.25,
  radius = 0.35,
  shape = 'esfera',
} = {}) {
  if (
    !Number.isInteger(fps) || fps < 1 || fps > 120
    || !Number.isInteger(frames) || frames < 1 || frames > 3601
    || !Number.isFinite(gravity) || gravity >= 0
    || !Number.isFinite(restitution) || restitution < 0 || restitution > 1
    || !Number.isFinite(radius) || radius < 0.1 || radius > 1
    || !Number.isFinite(height) || height <= radius || height > 8
    || !['esfera', 'cubo'].includes(shape)
  ) {
    throw new RangeError('Revisa fps, fotogramas, gravedad, rebote, altura, tamaño y forma de la simulación.');
  }

  initialized ??= Rapier.init().catch((error) => {
    initialized = undefined;
    throw error;
  });
  await initialized;

  const world = new Rapier.World({x: 0, y: gravity, z: 0});
  const events = new Rapier.EventQueue(true);
  try {
    const substeps = Math.ceil(120 / fps);
    world.timestep = 1 / (fps * substeps);
    const floor = Rapier.ColliderDesc.cuboid(50, 0.1, 50)
      .setTranslation(0, -0.1, 0)
      .setFriction(0.15)
      .setRestitution(restitution);
    world.createCollider(floor);
    const initialBody = Rapier.RigidBodyDesc.dynamic()
      .setTranslation(-3.2, height, 0)
      .setLinvel(1.25, 0, 0)
      .setCcdEnabled(true);
    const body = world.createRigidBody(initialBody);
    const bodyShape = shape === 'cubo'
      ? Rapier.ColliderDesc.cuboid(radius, radius, radius)
      : Rapier.ColliderDesc.ball(radius);
    world.createCollider(
      bodyShape
        .setFriction(0.15)
        .setRestitution(restitution)
        .setActiveEvents(Rapier.ActiveEvents.COLLISION_EVENTS),
      body,
    );

    const states = [];
    for (let index = 0; index < frames; index += 1) {
      let impact = false;
      if (index > 0) {
        for (let step = 0; step < substeps; step += 1) {
          world.step(events);
          events.drainCollisionEvents((_, __, started) => {
            impact ||= started;
          });
        }
      }
      const {x, y, z} = body.translation();
      const rotation = body.rotation();
      states.push({
        position: {x, y, z},
        quaternion: {x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w},
        impact,
      });
    }
    return {fps, frames: states};
  } finally {
    events.free();
    world.free();
  }
}
