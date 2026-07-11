import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { ArrowLeft } from 'lucide-react';
import GlitchText from '../GlitchText';
import { clamp, positiveModulo, useViewportSize } from './shared';
import {
  FREEWILL_ASSET_STRIDE_X,
  FREEWILL_ASSET_STRIDE_Y,
  FREEWILL_ASSETS,
  FREEWILL_BACKGROUND,
  FREEWILL_CLICK_MOVE_THRESHOLD_PX,
  FREEWILL_DEFAULT_DISPLAY_SCALE,
  FREEWILL_INITIAL_PAN,
  FREEWILL_SIGNAL_POP_DURATION_MS,
  FREEWILL_TILE_BUFFER_STEPS,
  type FreewillPan,
  type FreewillTile,
  type FreewillWipPopup,
} from './freewill/config';

export function FreewillSelectedWorkPage() {
  const shellRef = useRef<HTMLElement | null>(null);
  const animationTimeoutsRef = useRef<Map<string, number>>(new Map());
  const suppressNextTileClickRef = useRef(false);
  const viewport = useViewportSize();
  const viewportRef = useRef(viewport);
  const panRef = useRef<FreewillPan>(FREEWILL_INITIAL_PAN);
  const [pan, setPan] = useState<FreewillPan>(FREEWILL_INITIAL_PAN);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTileAnimations, setActiveTileAnimations] = useState<Record<string, number>>({});
  const [wipPopup, setWipPopup] = useState<FreewillWipPopup | null>(null);

  const syncPanSnapshot = useCallback((nextPan: FreewillPan) => {
    panRef.current = nextPan;
    setPan(nextPan);
  }, []);

  const [, panApi] = useSpring<FreewillPan>(() => ({
    x: FREEWILL_INITIAL_PAN.x,
    y: FREEWILL_INITIAL_PAN.y,
    onChange: ({ value }) => {
      syncPanSnapshot({
        x: value.x,
        y: value.y,
      });
    },
  }), [syncPanSnapshot]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => () => {
    animationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    animationTimeoutsRef.current.clear();
  }, []);

  const tileMetrics = useMemo(() => {
    const shortestSide = Math.min(viewport.width, viewport.height);
    const tileSize = viewport.width < 640
      ? clamp(viewport.width * 0.34, 116, 152)
      : clamp(shortestSide * 0.28, 156, 236);
    const gap = clamp(tileSize * 0.38, 42, 92);

    return {
      tileSize: Math.round(tileSize),
      step: Math.round(tileSize + gap),
    };
  }, [viewport.height, viewport.width]);

  const tiles = useMemo<FreewillTile[]>(() => {
    const { step } = tileMetrics;
    const halfWidth = viewport.width / 2;
    const halfHeight = viewport.height / 2;
    const buffer = step * FREEWILL_TILE_BUFFER_STEPS;
    const minCol = Math.floor((pan.x - halfWidth - buffer) / step);
    const maxCol = Math.ceil((pan.x + halfWidth + buffer) / step);
    const minRow = Math.floor((pan.y - halfHeight - buffer) / step);
    const maxRow = Math.ceil((pan.y + halfHeight + buffer) / step);
    const nextTiles: FreewillTile[] = [];

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const assetIndex = positiveModulo(
          col * FREEWILL_ASSET_STRIDE_X + row * FREEWILL_ASSET_STRIDE_Y,
          FREEWILL_ASSETS.length,
        );
        const asset = FREEWILL_ASSETS[assetIndex];

        if (!asset) {
          continue;
        }

        nextTiles.push({
          key: `${col}:${row}`,
          x: halfWidth + col * step - pan.x,
          y: halfHeight + row * step - pan.y,
          asset,
        });
      }
    }

    return nextTiles;
  }, [pan.x, pan.y, tileMetrics, viewport.height, viewport.width]);

  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      panApi.stop();

      const deltaScale = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? Math.max(viewportRef.current.width, viewportRef.current.height)
          : 1;

      const nextPan = {
        x: panRef.current.x + event.deltaX * deltaScale,
        y: panRef.current.y + event.deltaY * deltaScale,
      };

      syncPanSnapshot(nextPan);
      panApi.start({
        x: nextPan.x,
        y: nextPan.y,
        immediate: true,
      });
    };

    shell.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      shell.removeEventListener('wheel', handleWheel);
    };
  }, [panApi, syncPanSnapshot]);

  useEffect(() => {
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverscroll = htmlStyle.overscrollBehavior;
    const previousBodyOverscroll = bodyStyle.overscrollBehavior;

    htmlStyle.overscrollBehavior = 'none';
    bodyStyle.overscrollBehavior = 'none';

    return () => {
      htmlStyle.overscrollBehavior = previousHtmlOverscroll;
      bodyStyle.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  const navigateToSelectedWorks = useCallback(() => {
    if (window.location.pathname === '/selected-works') {
      return;
    }

    window.history.pushState({}, '', '/selected-works');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const triggerTileActivation = useCallback((tileKey: string, href: string | null, nextWipPopup: FreewillWipPopup | null) => {
    const animationId = Date.now();
    const existingTimeoutId = animationTimeoutsRef.current.get(tileKey);

    if (existingTimeoutId !== undefined) {
      window.clearTimeout(existingTimeoutId);
    }

    setActiveTileAnimations((currentAnimations) => ({
      ...currentAnimations,
      [tileKey]: animationId,
    }));

    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }

    if (nextWipPopup) {
      setWipPopup(nextWipPopup);
    }

    const timeoutId = window.setTimeout(() => {
      animationTimeoutsRef.current.delete(tileKey);
      setActiveTileAnimations((currentAnimations) => {
        if (currentAnimations[tileKey] !== animationId) {
          return currentAnimations;
        }

        const nextAnimations = { ...currentAnimations };
        delete nextAnimations[tileKey];
        return nextAnimations;
      });
    }, FREEWILL_SIGNAL_POP_DURATION_MS);

    animationTimeoutsRef.current.set(tileKey, timeoutId);
  }, []);

  useDrag(({
    cancel,
    delta: [deltaX, deltaY],
    direction: [directionX, directionY],
    event,
    first,
    last,
    movement: [movementX, movementY],
    velocity: [velocityX, velocityY],
  }) => {
    const targetElement = event.target instanceof Element ? event.target : null;

    if (targetElement?.closest('[data-freewill-control="true"]')) {
      cancel();
      setIsDragging(false);
      return;
    }

    if (Math.hypot(movementX, movementY) > FREEWILL_CLICK_MOVE_THRESHOLD_PX && event.cancelable) {
      event.preventDefault();
    }

    if (first) {
      suppressNextTileClickRef.current = false;
      panApi.stop();
      setIsDragging(true);
    }

    if (deltaX !== 0 || deltaY !== 0) {
      const nextPan = {
        x: panRef.current.x - deltaX,
        y: panRef.current.y - deltaY,
      };

      syncPanSnapshot(nextPan);
      panApi.start({
        x: nextPan.x,
        y: nextPan.y,
        immediate: true,
      });
    }

    if (!last) {
      return;
    }

    setIsDragging(false);

    const didDrag = Math.hypot(movementX, movementY) > FREEWILL_CLICK_MOVE_THRESHOLD_PX;
    suppressNextTileClickRef.current = didDrag;

    if (didDrag) {
      window.setTimeout(() => {
        suppressNextTileClickRef.current = false;
      }, 80);
    }

    const panVelocityX = -velocityX * directionX;
    const panVelocityY = -velocityY * directionY;

    if (!didDrag || Math.hypot(panVelocityX, panVelocityY) <= 0.01) {
      return;
    }

    panApi.start({
      x: panRef.current.x,
      y: panRef.current.y,
      immediate: false,
      config: (key) => ({
        decay: true,
        velocity: key === 'x' ? panVelocityX : panVelocityY,
      }),
    });
  }, {
    target: shellRef,
    eventOptions: { passive: false },
    pointer: {
      buttons: 1,
      keys: false,
    },
  });

  return (
    <main
      ref={shellRef}
      role="application"
      aria-label="The Freewill infinite artwork grid"
      data-disable-custom-cursor="true"
      className="fixed inset-0 h-[100dvh] min-h-[100dvh] overflow-hidden text-white"
      style={{
        background: FREEWILL_BACKGROUND,
        cursor: isDragging ? 'grabbing' : 'grab',
        overscrollBehavior: 'none',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as CSSProperties}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {tiles.map((tile) => {
          const displayScale = 'displayScale' in tile.asset
            ? tile.asset.displayScale
            : FREEWILL_DEFAULT_DISPLAY_SCALE;
          const tileHref = 'href' in tile.asset ? tile.asset.href : undefined;
          const tileWipTitle = 'wipTitle' in tile.asset ? tile.asset.wipTitle : undefined;
          const tileWipSrc = 'wipSrc' in tile.asset ? tile.asset.wipSrc : undefined;
          const tileWipPopup = tileWipTitle && tileWipSrc
            ? { title: tileWipTitle, src: tileWipSrc }
            : null;

          return (
            <div
              key={tile.key}
              className={`freewill-svg-tile absolute flex items-center justify-center ${activeTileAnimations[tile.key] !== undefined ? 'freewill-signal-pop-active' : ''}`}
              style={{
                height: tileMetrics.tileSize,
                left: 0,
                top: 0,
                transform: `translate3d(${(tile.x - tileMetrics.tileSize / 2).toFixed(2)}px, ${(tile.y - tileMetrics.tileSize / 2).toFixed(2)}px, 0)`,
                width: tileMetrics.tileSize,
                willChange: 'transform',
              }}
            >
              <span
                className="freewill-svg-hit-target"
                data-freewill-href={tileHref}
                data-freewill-tile-key={tile.key}
                data-freewill-wip-src={tileWipSrc}
                data-freewill-wip-title={tileWipTitle}
                onClick={(event) => {
                  event.stopPropagation();

                  if (suppressNextTileClickRef.current) {
                    suppressNextTileClickRef.current = false;
                    return;
                  }

                  triggerTileActivation(tile.key, tileHref ?? null, tileWipPopup);
                }}
                style={{
                  height: `${displayScale.height * 100}%`,
                  width: `${displayScale.width * 100}%`,
                }}
              >
                <img
                  key={`${tile.key}-${activeTileAnimations[tile.key] ?? 'idle'}`}
                  src={tile.asset.src}
                  alt=""
                  draggable={false}
                  className="freewill-svg-image block h-full w-full object-contain"
                />
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="absolute left-3 z-30 md:left-8"
        style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
        data-freewill-control="true"
      >
        <button
          type="button"
          onClick={navigateToSelectedWorks}
          className="group flex items-center gap-4 text-lg font-bold text-white transition-colors hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label="Back to Selected Works"
          data-freewill-control="true"
        >
          <div className="flex h-12 w-12 items-center justify-center border border-white/60 bg-[var(--freewill-background)] shadow-[0_0_0_1px_var(--freewill-shadow)] transition-all group-hover:border-white group-hover:bg-white group-hover:text-[var(--freewill-background)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </div>
          <GlitchText
            text="SW"
            wrapToWidth={false}
            className="font-mono text-sm tracking-widest"
          />
        </button>
      </div>

      {wipPopup && (
        <button
          type="button"
          className="freewill-wip-popup-overlay fixed inset-0 z-50 flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            setWipPopup(null);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          aria-label={`Close ${wipPopup.title} WIP popup`}
          data-freewill-control="true"
        >
          <img
            src={wipPopup.src}
            alt={`${wipPopup.title} WIP`}
            className="freewill-wip-popup-image"
            draggable={false}
          />
        </button>
      )}
    </main>
  );
}
