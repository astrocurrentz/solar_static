import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlitchText from '../../GlitchText';
import { BAZI_DEMO_CHART, ELEMENT_COLORS } from '../../selectedWorksData';
import { BaziPressableButton } from './BaziControls';
import { DAY_MASTER_NODE_ID, NETWORK_BUTTON_PAD, NETWORK_BUTTON_PAD_HALF, NETWORK_NODE_RADIUS } from './constants';
import { elementByGlyph, influenceNodeElement } from './ganzhi';
import {
  applyPhysicsTriple,
  buildNetworkEdges,
  buildNetworkNodes,
  clampPoint,
  defaultRingPoint,
  nodeRadius,
} from './networkPhysics';
import type { Point, Velocity } from './types';

export function InfluenceNetworkCard({ captionGlitchSignal }: { captionGlitchSignal?: number | string }) {
  const nodes = useMemo(() => buildNetworkNodes(), []);
  const edges = useMemo(() => buildNetworkEdges(nodes), [nodes]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [draggedIds, setDraggedIds] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  const velocitiesRef = useRef<Record<string, Velocity>>({});
  const lastTickRef = useRef<number | null>(null);
  const initPositionsRef = useRef<Record<string, Point>>({});
  const positionsRef = useRef<Record<string, Point>>({});
  const dragStateRef = useRef<Map<number, { nodeId: string; startX: number; startY: number; startPos: Point; pointerType: string }>>(new Map());
  const hasMovedRef = useRef(false);
  const prevDraggedCountRef = useRef(0);
  const prevDraggedRef = useRef<string | null>(null);
  const lastReleasedNodeRef = useRef<string | null>(null);
  const docListenersRef = useRef<{ move: (event: PointerEvent) => void; up: (event: PointerEvent) => void } | null>(null);

  const maxGodWeight = useMemo(
    () => Math.max(...nodes.filter((node) => !node.isDayMaster).map((node) => node.weight), 0.01),
    [nodes],
  );
  const dayMasterElement = elementByGlyph(BAZI_DEMO_CHART.dayMasterStem);
  positionsRef.current = positions;

  const getViewportBounds = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return undefined;
    }

    const inView = rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
    if (!inView) {
      return undefined;
    }

    return {
      rect: { left: rect.left, top: rect.top },
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(0, entry.contentRect.width);
      const height = Math.max(0, entry.contentRect.height);
      setSize({ width, height });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const withDayMasterCentered = useCallback(
    (nextPositions: Record<string, Point>) => {
      if (size.width <= 0 || size.height <= 0) return nextPositions;
      const center = { x: size.width / 2, y: size.height / 2 };
      return { ...nextPositions, [DAY_MASTER_NODE_ID]: center };
    },
    [size.height, size.width],
  );

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    const initial: Record<string, Point> = {
      [DAY_MASTER_NODE_ID]: { x: size.width / 2, y: size.height / 2 },
    };

    for (const node of nodes) {
      if (!node.isDayMaster) {
        initial[node.id] = defaultRingPoint(node.id, size.width, size.height, nodes);
      }
    }

    const viewportBounds = getViewportBounds();
    const { positions: resolved } = applyPhysicsTriple(
      initial,
      nodes,
      edges,
      maxGodWeight,
      size.width,
      size.height,
      { simulationSteps: 0, viewportBounds },
    );

    initPositionsRef.current = resolved;
    setPositions(withDayMasterCentered({ ...positionsRef.current, ...resolved }));
    velocitiesRef.current = {};
  }, [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered]);

  const runSimulation = useCallback(() => {
    if (rafRef.current) return;
    if (Object.keys(initPositionsRef.current).length === 0) return;

    const releasedNodeId = prevDraggedRef.current;
    const simPositions = { ...initPositionsRef.current };

    if (releasedNodeId && releasedNodeId !== DAY_MASTER_NODE_ID) {
      const releasedPosition = positionsRef.current[releasedNodeId];
      if (releasedPosition) {
        simPositions[releasedNodeId] = releasedPosition;
      }
    }

    const boundaryCollisions: Record<string, number> = {};
    lastTickRef.current = null;
    let bounceCount = 0;
    let previousToward = 0;
    const BOUNCE_LIMIT = 3;
    setIsSimulating(true);

    const tick = (now: number) => {
      const dtMs = lastTickRef.current !== null ? now - lastTickRef.current : 1000 / 60;
      lastTickRef.current = now;

      const viewportBounds = getViewportBounds();
      const { positions: next, velocities } = applyPhysicsTriple(
        simPositions,
        nodes,
        edges,
        maxGodWeight,
        size.width,
        size.height,
        {
          velocities: velocitiesRef.current,
          simulationSteps: 1,
          dtMs,
          boundaryCollisions,
          viewportBounds,
        },
      );

      Object.assign(simPositions, next);
      velocitiesRef.current = velocities;

      if (releasedNodeId && releasedNodeId !== DAY_MASTER_NODE_ID) {
        const current = next[releasedNodeId];
        const velocity = velocities[releasedNodeId] ?? { dx: 0, dy: 0 };
        const target = initPositionsRef.current[releasedNodeId];

        if (current && target) {
          const dx = target.x - current.x;
          const dy = target.y - current.y;
          const toward = velocity.dx * dx + velocity.dy * dy;
          if (previousToward > 0.5 && toward < -0.5) {
            bounceCount += 1;
          }
          previousToward = toward;
        }
      }

      if (bounceCount >= BOUNCE_LIMIT) {
        velocitiesRef.current = {};
        setPositions(withDayMasterCentered(initPositionsRef.current));
        setIsSimulating(false);
        rafRef.current = null;
        return;
      }

      setPositions(withDayMasterCentered(next));
      const maxVelocity = Math.max(...Object.values(velocities).map((entry) => Math.hypot(entry.dx, entry.dy)), 0);

      if (maxVelocity > 0.5) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        velocitiesRef.current = {};
        setPositions(withDayMasterCentered(initPositionsRef.current));
        setIsSimulating(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered]);

  useEffect(() => {
    if (draggedIds.size === 0 && prevDraggedCountRef.current > 0 && Object.keys(positionsRef.current).length > 0) {
      prevDraggedRef.current = lastReleasedNodeRef.current;
      runSimulation();
      lastReleasedNodeRef.current = null;
    }
    prevDraggedCountRef.current = draggedIds.size;
  }, [draggedIds.size, runSimulation]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      const listeners = docListenersRef.current;
      if (listeners) {
        document.removeEventListener('pointermove', listeners.move);
        document.removeEventListener('pointerup', listeners.up);
        document.removeEventListener('pointercancel', listeners.up);
        docListenersRef.current = null;
      }
    };
  }, []);

  const handleDocPointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current.get(event.pointerId);
      if (!dragState || !containerRef.current) {
        return;
      }
      const { nodeId, startX, startY, startPos, pointerType } = dragState;
      hasMovedRef.current = true;

      const raw = {
        x: startPos.x + (event.clientX - startX),
        y: startPos.y + (event.clientY - startY),
      };
      const targetNode = nodes.find((node) => node.id === nodeId);
      const radius = targetNode ? nodeRadius(targetNode, maxGodWeight) : NETWORK_NODE_RADIUS.min;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportPos = { x: raw.x + rect.left, y: raw.y + rect.top };
      const clampedViewport = clampPoint(
        viewportPos,
        window.innerWidth,
        window.innerHeight,
        radius + NETWORK_BUTTON_PAD_HALF,
      );
      const final = { x: clampedViewport.x - rect.left, y: clampedViewport.y - rect.top };
      const viewportBounds = getViewportBounds() ?? {
        rect: { left: rect.left, top: rect.top },
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
      const isMobileDrag = pointerType === 'touch' || window.innerWidth <= 768;
      const { positions: simulatedPositions, velocities } = applyPhysicsTriple(
        { ...positionsRef.current, [nodeId]: final },
        nodes,
        edges,
        maxGodWeight,
        size.width,
        size.height,
        {
          draggedId: nodeId,
          draggedPos: final,
          velocities: isMobileDrag ? {} : velocitiesRef.current,
          simulationSteps: isMobileDrag ? 0 : 5,
          viewportBounds,
        },
      );
      velocitiesRef.current = isMobileDrag ? {} : velocities;
      setPositions(withDayMasterCentered({ ...positionsRef.current, ...simulatedPositions }));
    },
    [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered],
  );

  const handleDocPointerUp = useCallback((event: PointerEvent) => {
    const dragState = dragStateRef.current.get(event.pointerId);
    if (!dragState) {
      return;
    }

    const { nodeId } = dragState;
    velocitiesRef.current[nodeId] = { dx: 0, dy: 0 };
    dragStateRef.current.delete(event.pointerId);
    lastReleasedNodeRef.current = nodeId;
    setDraggedIds((previous) => {
      const next = new Set(previous);
      next.delete(nodeId);
      return next;
    });

    if (dragStateRef.current.size === 0) {
      const listeners = docListenersRef.current;
      if (listeners) {
        document.removeEventListener('pointermove', listeners.move);
        document.removeEventListener('pointerup', listeners.up);
        document.removeEventListener('pointercancel', listeners.up);
        docListenersRef.current = null;
      }
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
      if (nodeId === DAY_MASTER_NODE_ID) {
        return;
      }

      event.preventDefault();
      hasMovedRef.current = false;

      if (rafRef.current && dragStateRef.current.size === 0) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setIsSimulating(false);
      }
      velocitiesRef.current = {};

      const position = positions[nodeId] ?? defaultRingPoint(nodeId, size.width, size.height, nodes);
      dragStateRef.current.set(event.pointerId, {
        nodeId,
        startX: event.clientX,
        startY: event.clientY,
        startPos: position,
        pointerType: event.pointerType,
      });
      setDraggedIds((previous) => new Set(previous).add(nodeId));

      if (!docListenersRef.current) {
        const listeners = {
          move: (docEvent: PointerEvent) => handleDocPointerMove(docEvent),
          up: (docEvent: PointerEvent) => handleDocPointerUp(docEvent),
        };
        docListenersRef.current = listeners;
        document.addEventListener('pointermove', listeners.move);
        document.addEventListener('pointerup', listeners.up);
        document.addEventListener('pointercancel', listeners.up);
      }
    },
    [handleDocPointerMove, handleDocPointerUp, nodes, positions, size.height, size.width],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragStateRef.current.has(event.pointerId)) {
        return;
      }
      handleDocPointerMove(event.nativeEvent);
    },
    [handleDocPointerMove],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
      if (nodeId === DAY_MASTER_NODE_ID) {
        return;
      }
      if (dragStateRef.current.has(event.pointerId)) {
        handleDocPointerUp(event.nativeEvent);
      }
    },
    [handleDocPointerUp],
  );

  const handleClick = useCallback(() => {
    if (hasMovedRef.current) {
      return;
    }
  }, []);

  const getPosition = useCallback(
    (id: string): Point => {
      if (id === DAY_MASTER_NODE_ID) {
        return { x: size.width / 2, y: size.height / 2 };
      }
      return positions[id] ?? defaultRingPoint(id, size.width, size.height, nodes);
    },
    [nodes, positions, size.height, size.width],
  );

  return (
    <article className="bazi-card bazi-section-card bazi-network-card" data-disable-custom-cursor="true">
      <h3 className="bazi-card-title bazi-card-title-left">Influence Network</h3>
      <GlitchText
        text="Drag circles"
        tag="p"
        wrapToWidth={false}
        scrambleOnMount={false}
        scrambleSignal={captionGlitchSignal}
        className="bazi-card-caption"
      />

      <div ref={containerRef} className="bazi-network-stage">
        {nodes.map((node) => {
          const point = getPosition(node.id);
          const radius = nodeRadius(node, maxGodWeight);
          const sizePx = radius * 2;
          const buttonSize = sizePx + NETWORK_BUTTON_PAD;
          const elementColor = ELEMENT_COLORS[influenceNodeElement(node.id, dayMasterElement)];
          const secondaryLabel = String(Math.round(node.weight * 10));
          const isDayMaster = node.id === DAY_MASTER_NODE_ID;

          return (
            <BaziPressableButton
              key={node.id}
              className={`bazi-network-node ${draggedIds.has(node.id) ? 'is-dragging' : ''}`}
              onClick={handleClick}
              onPointerDown={(event) => handlePointerDown(event, node.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => handlePointerUp(event, node.id)}
              onPointerCancel={(event) => handlePointerUp(event, node.id)}
              style={{
                left: '0px',
                top: '0px',
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                minWidth: `${buttonSize}px`,
                minHeight: `${buttonSize}px`,
                padding: `${Math.max(0.5, sizePx * 0.05)}px`,
                transform: `translate3d(${point.x - buttonSize / 2}px, ${point.y - buttonSize / 2}px, 0)`,
                backgroundColor: elementColor,
                color: 'var(--bazi-main-foreground)',
                transition: draggedIds.has(node.id) || isSimulating ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <span
                role="presentation"
                className={`bazi-network-node-content ${node.id !== DAY_MASTER_NODE_ID ? 'is-draggable' : ''}`}
              >
                {!isDayMaster ? (
                  <span className="bazi-network-node-value">
                    {secondaryLabel}
                  </span>
                ) : null}
              </span>
            </BaziPressableButton>
          );
        })}
      </div>
    </article>
  );
}
