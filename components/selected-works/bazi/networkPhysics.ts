import { BAZI_GODS_NODES } from '../../selectedWorksData';
import { clamp, positiveModulo } from '../shared';
import {
  DAY_MASTER_NODE_ID,
  NETWORK_BUTTON_PAD,
  NETWORK_BUTTON_PAD_HALF,
  NETWORK_CORE_EDGE,
  NETWORK_LAYOUT,
  NETWORK_NODE_RADIUS,
  NETWORK_ORBIT_EDGE,
  NETWORK_ORDER,
  NETWORK_SIM,
} from './constants';
import type { NetworkEdge, NetworkNode, Point, Velocity } from './types';
import { normalizeNodeId } from './ganzhi';

export function nodeRadius(node: NetworkNode, maxGodWeight: number): number {
  if (node.isDayMaster) return NETWORK_NODE_RADIUS.min;
  const normalized = node.weight / Math.max(0.01, maxGodWeight);
  return NETWORK_NODE_RADIUS.min + normalized * (NETWORK_NODE_RADIUS.max - NETWORK_NODE_RADIUS.min);
}

export function fieldCenter(width: number, height: number): Point {
  return { x: width / 2, y: height / 2 };
}

export function defaultRingPoint(nodeId: string, width: number, height: number, nodes: NetworkNode[]): Point {
  const gods = nodes.filter((node) => !node.isDayMaster);
  const index = gods.findIndex((node) => node.id === nodeId);
  if (index < 0) return fieldCenter(width, height);

  const node = gods[index];
  const weights = gods.map((god) => god.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights, 0.01);
  const weightRange = maxWeight - minWeight;
  const normalized = weightRange > 0 ? (node.weight - minWeight) / weightRange : 1;

  const center = fieldCenter(width, height);
  const radius = NETWORK_CORE_EDGE.targetBase - normalized * NETWORK_CORE_EDGE.targetRange;
  const angle = (index / Math.max(gods.length, 1)) * Math.PI * 2 - Math.PI * 0.5;

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function clampPoint(point: Point, width: number, height: number, radius: number): Point {
  const inset = radius + NETWORK_LAYOUT.outerPadding;
  return {
    x: clamp(point.x, inset, width - inset),
    y: clamp(point.y, inset, height - inset),
  };
}

export function clampPointToViewport(
  point: Point,
  rect: { left: number; top: number },
  viewportWidth: number,
  viewportHeight: number,
  radius: number,
): Point {
  const inset = radius + NETWORK_LAYOUT.outerPadding;
  const viewportX = point.x + rect.left;
  const viewportY = point.y + rect.top;

  return {
    x: clamp(viewportX, inset, viewportWidth - inset) - rect.left,
    y: clamp(viewportY, inset, viewportHeight - inset) - rect.top,
  };
}

export function buildNetworkNodes(): NetworkNode[] {
  const mapped = BAZI_GODS_NODES.map((node) => ({
    id: normalizeNodeId(node.id),
    zh: node.zh,
    en: node.en,
    weight: node.weight,
    isDayMaster: normalizeNodeId(node.id) === DAY_MASTER_NODE_ID,
  }));

  const dayMaster = mapped.find((node) => node.id === DAY_MASTER_NODE_ID);
  const others = NETWORK_ORDER
    .map((id) => mapped.find((node) => node.id === id))
    .filter((node): node is NetworkNode => Boolean(node));

  return dayMaster ? [dayMaster, ...others] : others;
}

export function buildNetworkEdges(nodes: NetworkNode[]): NetworkEdge[] {
  const gods = nodes.filter((node) => !node.isDayMaster);
  if (gods.length === 0) return [];

  const maxWeight = Math.max(...gods.map((node) => node.weight), 0.01);
  const edges: NetworkEdge[] = [];

  for (const god of gods) {
    const normalized = god.weight / maxWeight;
    edges.push({
      id: `core-${god.id}`,
      from: DAY_MASTER_NODE_ID,
      to: god.id,
      strength: NETWORK_CORE_EDGE.strengthBase + normalized * NETWORK_CORE_EDGE.strengthRange,
      targetDistance: NETWORK_CORE_EDGE.targetBase - normalized * NETWORK_CORE_EDGE.targetRange,
      isCoreLink: true,
    });
  }

  for (let index = 0; index < gods.length; index += 1) {
    const current = gods[index];
    const next = gods[(index + 1) % gods.length];
    edges.push({
      id: `orbit-${current.id}-${next.id}`,
      from: current.id,
      to: next.id,
      strength: NETWORK_ORBIT_EDGE.strength,
      targetDistance: NETWORK_ORBIT_EDGE.targetDistance,
      isCoreLink: false,
    });
  }

  return edges;
}

export function resolveOverlaps(
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  maxGodWeight: number,
  width: number,
  height: number,
): Record<string, Point> {
  const result = { ...positions };
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  for (let iter = 0; iter < NETWORK_LAYOUT.overlapIterations; iter += 1) {
    let changed = false;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const left = nodes[i];
        const right = nodes[j];
        const leftPos = result[left.id] ?? fieldCenter(width, height);
        const rightPos = result[right.id] ?? fieldCenter(width, height);
        const leftRad = (radii[left.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        const rightRad = (radii[right.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        const minDist = leftRad + rightRad + NETWORK_LAYOUT.overlapGap;
        const dx = rightPos.x - leftPos.x;
        const dy = rightPos.y - leftPos.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;

          if (left.id === DAY_MASTER_NODE_ID) {
            result[right.id] = clampPoint(
              { x: rightPos.x + ux * (minDist - dist), y: rightPos.y + uy * (minDist - dist) },
              width,
              height,
              rightRad,
            );
          } else if (right.id === DAY_MASTER_NODE_ID) {
            result[left.id] = clampPoint(
              { x: leftPos.x - ux * (minDist - dist), y: leftPos.y - uy * (minDist - dist) },
              width,
              height,
              leftRad,
            );
          } else {
            result[left.id] = clampPoint(
              { x: leftPos.x - ux * push, y: leftPos.y - uy * push },
              width,
              height,
              leftRad,
            );
            result[right.id] = clampPoint(
              { x: rightPos.x + ux * push, y: rightPos.y + uy * push },
              width,
              height,
              rightRad,
            );
          }

          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  for (const node of nodes) {
    const pos = result[node.id];
    if (pos) {
      const radius = (radii[node.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
      result[node.id] = clampPoint(pos, width, height, radius);
    }
  }

  return result;
}

export function resolveDragCollisionWithOthers(
  pos: Point,
  draggedId: string,
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  maxGodWeight: number,
  width: number,
  height: number,
): Record<string, Point> {
  const result = { ...positions, [draggedId]: pos };
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  for (let iter = 0; iter < NETWORK_LAYOUT.dragCollisionIterations; iter += 1) {
    let changed = false;
    const dragRadius = (radii[draggedId] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;

    for (const other of nodes) {
      const draggedPos = result[draggedId] ?? pos;
      if (other.id === draggedId) continue;

      const otherPos = result[other.id] ?? fieldCenter(width, height);
      const otherRadius = (radii[other.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
      const minDist = dragRadius + otherRadius + NETWORK_LAYOUT.overlapGap;
      const dx = draggedPos.x - otherPos.x;
      const dy = draggedPos.y - otherPos.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < minDist) {
        const push = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        const nextDragged = clampPoint(
          { x: draggedPos.x + ux * push, y: draggedPos.y + uy * push },
          width,
          height,
          dragRadius,
        );
        const nextOther = other.id === DAY_MASTER_NODE_ID
          ? otherPos
          : clampPoint(
              { x: otherPos.x - ux * push, y: otherPos.y - uy * push },
              width,
              height,
              otherRadius,
            );

        result[draggedId] = nextDragged;
        result[other.id] = nextOther;
        changed = true;
      }
    }

    if (!changed) break;
  }

  return result;
}

export function applyPhysicsTriple(
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  maxGodWeight: number,
  width: number,
  height: number,
  options: {
    draggedId?: string | null;
    draggedPos?: Point;
    velocities?: Record<string, Velocity>;
    simulationSteps?: number;
    dtMs?: number;
    boundaryCollisions?: Record<string, number>;
    viewportBounds?: { rect: { left: number; top: number }; viewportWidth: number; viewportHeight: number };
  } = {},
): { positions: Record<string, Point>; velocities: Record<string, Velocity> } {
  let result = { ...positions };
  let velocities = options.velocities ?? {};
  const boundaryCollisions = options.boundaryCollisions ?? {};
  const dtMs = options.dtMs ?? NETWORK_SIM.refDtMs;
  const viewportBounds = options.viewportBounds;
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  const boundsWidth = viewportBounds ? viewportBounds.viewportWidth : width;
  const boundsHeight = viewportBounds ? viewportBounds.viewportHeight : height;
  const rect = viewportBounds?.rect ?? { left: 0, top: 0 };

  const toViewport = (point: Point): Point => ({ x: point.x + rect.left, y: point.y + rect.top });
  const toContainer = (point: Point): Point => ({ x: point.x - rect.left, y: point.y - rect.top });

  const applyCollision = (current: Record<string, Point>, dragId: string | null, dragPos?: Point) => {
    if (dragId && dragPos) {
      return resolveDragCollisionWithOthers(
        dragPos,
        dragId,
        current,
        nodes,
        maxGodWeight,
        boundsWidth,
        boundsHeight,
      );
    }

    return resolveOverlaps(current, nodes, maxGodWeight, boundsWidth, boundsHeight);
  };

  const applyPadding = (current: Record<string, Point>) => {
    const padded = { ...current };

    for (const node of nodes) {
      const point = padded[node.id];
      if (point) {
        const radius = (radii[node.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        padded[node.id] = clampPoint(point, boundsWidth, boundsHeight, radius);
      }
    }

    return padded;
  };

  const draggedId = options.draggedId ?? null;
  const steps = options.simulationSteps ?? 0;

  if (viewportBounds) {
    result = Object.fromEntries(Object.entries(result).map(([id, point]) => [id, toViewport(point)])) as Record<string, Point>;

    if (draggedId && options.draggedPos) {
      result[draggedId] = toViewport(options.draggedPos);
    }
  }

  result = applyCollision(result, draggedId, draggedId ? result[draggedId] : undefined);
  result = applyPadding(result);

  const containerCenter = fieldCenter(width, height);
  const dayMasterCenter = viewportBounds ? toViewport(containerCenter) : containerCenter;

  for (let index = 0; index < steps; index += 1) {
    result[DAY_MASTER_NODE_ID] = dayMasterCenter;
    const { positions: nextPositions, velocities: nextVelocities } = stepSimulation(
      nodes,
      edges,
      result,
      velocities,
      boundsWidth,
      boundsHeight,
      draggedId,
      dtMs,
      boundaryCollisions,
      dayMasterCenter,
    );
    result = nextPositions;
    velocities = nextVelocities;
    result = applyCollision(result, draggedId, draggedId ? result[draggedId] : undefined);
    result = applyPadding(result);
  }

  if (viewportBounds) {
    result = Object.fromEntries(Object.entries(result).map(([id, point]) => [id, toContainer(point)])) as Record<string, Point>;
  }

  const dayMasterRadius = (radii[DAY_MASTER_NODE_ID] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
  result[DAY_MASTER_NODE_ID] = viewportBounds
    ? clampPointToViewport(containerCenter, rect, boundsWidth, boundsHeight, dayMasterRadius)
    : clampPoint(containerCenter, width, height, dayMasterRadius);

  return { positions: result, velocities };
}

export function stepSimulation(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  positions: Record<string, Point>,
  velocities: Record<string, Velocity>,
  width: number,
  height: number,
  draggedId: string | null,
  dtMs: number = NETWORK_SIM.refDtMs,
  boundaryCollisions: Record<string, number> = {},
  dayMasterCenter?: Point,
): { positions: Record<string, Point>; velocities: Record<string, Velocity>; boundaryCollisions: Record<string, number> } {
  const dt = Math.min(Math.max(dtMs, 4), 50) / NETWORK_SIM.refDtMs;
  const nextPositions = { ...positions };
  const nextVelocities = { ...velocities };
  const center = dayMasterCenter ?? fieldCenter(width, height);
  const godNodes = nodes.filter((node) => !node.isDayMaster);
  const simulatedNodes = [...nodes];
  const maxGodWeight = Math.max(...godNodes.map((node) => node.weight), 0.01);

  nextPositions[DAY_MASTER_NODE_ID] = center;
  nextVelocities[DAY_MASTER_NODE_ID] = nextVelocities[DAY_MASTER_NODE_ID] ?? { dx: 0, dy: 0 };

  const forces: Record<string, Velocity> = {};
  for (const node of simulatedNodes) {
    forces[node.id] = { dx: 0, dy: 0 };
  }

  const dayMasterPoint = nextPositions[DAY_MASTER_NODE_ID] ?? center;

  for (let i = 0; i < simulatedNodes.length; i += 1) {
    const left = simulatedNodes[i];
    const leftPoint = nextPositions[left.id] ?? (left.isDayMaster ? center : defaultRingPoint(left.id, width, height, nodes));
    const leftHome = left.isDayMaster ? center : defaultRingPoint(left.id, width, height, nodes);

    const anchor = left.isDayMaster ? NETWORK_SIM.dayMasterAnchorStiffness : NETWORK_SIM.anchorStiffness;
    forces[left.id].dx += (leftHome.x - leftPoint.x) * anchor;
    forces[left.id].dy += (leftHome.y - leftPoint.y) * anchor;

    if (!left.isDayMaster) {
      const centerDx = leftPoint.x - dayMasterPoint.x;
      const centerDy = leftPoint.y - dayMasterPoint.y;
      const centerDist = Math.max(Math.hypot(centerDx, centerDy), NETWORK_SIM.minDist);
      const centerForce = NETWORK_SIM.centerRepulsion / (centerDist * centerDist);
      forces[left.id].dx += (centerDx / centerDist) * centerForce;
      forces[left.id].dy += (centerDy / centerDist) * centerForce;
    }

    for (let j = i + 1; j < simulatedNodes.length; j += 1) {
      const right = simulatedNodes[j];
      const rightPoint = nextPositions[right.id] ?? (right.isDayMaster ? center : defaultRingPoint(right.id, width, height, nodes));
      const dx = leftPoint.x - rightPoint.x;
      const dy = leftPoint.y - rightPoint.y;
      const dist = Math.max(Math.hypot(dx, dy), NETWORK_SIM.minDist);
      const repulsion = NETWORK_SIM.pairRepulsion / (dist * dist);
      const fx = (dx / dist) * repulsion;
      const fy = (dy / dist) * repulsion;

      forces[left.id].dx += fx;
      forces[left.id].dy += fy;
      forces[right.id].dx -= fx;
      forces[right.id].dy -= fy;
    }
  }

  for (const edge of edges) {
    const fromPoint = nextPositions[edge.from];
    const toPoint = nextPositions[edge.to];
    if (!fromPoint || !toPoint) continue;

    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    const delta = dist - edge.targetDistance;
    const spring = edge.isCoreLink ? 0.1 + edge.strength * 0.05 : 0.06 + edge.strength * 0.04;
    const magnitude = delta * spring;
    const fx = (dx / dist) * magnitude;
    const fy = (dy / dist) * magnitude;

    forces[edge.from].dx += fx;
    forces[edge.from].dy += fy;
    forces[edge.to].dx -= fx;
    forces[edge.to].dy -= fy;
  }

  const damping = Math.pow(NETWORK_SIM.damping, dt);

  for (const node of simulatedNodes) {
    if (draggedId === node.id) continue;
    if (node.id === DAY_MASTER_NODE_ID) continue;

    const force = forces[node.id];
    force.dx = clamp(force.dx, -NETWORK_SIM.maxForce, NETWORK_SIM.maxForce);
    force.dy = clamp(force.dy, -NETWORK_SIM.maxForce, NETWORK_SIM.maxForce);

    const velocity = nextVelocities[node.id] ?? { dx: 0, dy: 0 };
    velocity.dx = (velocity.dx + force.dx * NETWORK_SIM.timeStep * dt) * damping;
    velocity.dy = (velocity.dy + force.dy * NETWORK_SIM.timeStep * dt) * damping;
    velocity.dx = clamp(velocity.dx, -NETWORK_SIM.maxVel, NETWORK_SIM.maxVel);
    velocity.dy = clamp(velocity.dy, -NETWORK_SIM.maxVel, NETWORK_SIM.maxVel);

    let point = nextPositions[node.id] ?? defaultRingPoint(node.id, width, height, nodes);
    point = { x: point.x + velocity.dx * dt, y: point.y + velocity.dy * dt };

    const radius = node.isDayMaster ? nodeRadius(node, maxGodWeight) + 2 : nodeRadius(node, maxGodWeight);
    const effectiveRadius = radius + NETWORK_BUTTON_PAD_HALF;
    const bounded = clampPoint(point, width, height, effectiveRadius);

    if (bounded.x !== point.x || bounded.y !== point.y) {
      const count = (boundaryCollisions[node.id] ?? 0) + 1;
      boundaryCollisions[node.id] = count;

      if (count <= NETWORK_SIM.boundaryCollisionLimit) {
        velocity.dx *= 0.45;
        velocity.dy *= 0.45;
      }
    }

    nextPositions[node.id] = bounded;
    nextVelocities[node.id] = velocity;
  }

  return { positions: nextPositions, velocities: nextVelocities, boundaryCollisions };
}
