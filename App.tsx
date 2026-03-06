import React from 'react';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import GlitchText from './components/GlitchText';
import DistortionImage from './components/DistortionImage';
import NoiseOverlay from './components/NoiseOverlay';
import AudioVisualizer from './components/AudioVisualizer';
import { ARTWORKS } from './constants';
import { Play, ArrowDown, Hash } from 'lucide-react';

const TRACKS = [
  'Protocol: Wildfire',
  'The Apex Vector',
  'Lazarus Sequence (Bass Only)',
];

const HERO_BACKGROUND = {
  background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-primary) 48%, var(--bg-secondary) 100%)',
};

const AUDIO_BACKGROUND = {
  background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
};

const WARM_OVERLAY = {
  background:
    'radial-gradient(circle at center, rgba(201, 115, 56, 0.18) 0%, rgba(165, 77, 39, 0.08) 35%, rgba(40, 33, 25, 0) 70%)',
};

const HERO_GLOW = {
  background:
    'radial-gradient(circle at 76% 24%, rgba(201, 115, 56, 0.2) 0%, rgba(165, 77, 39, 0.06) 34%, rgba(40, 33, 25, 0) 72%)',
};

const CREAM_STROKE = {
  WebkitTextStroke: '2px var(--bg-light)',
};

const THIN_CREAM_STROKE = {
  WebkitTextStroke: '1px var(--bg-light)',
};

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen cursor-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CustomCursor />
      <NoiseOverlay />
      <Navigation />

      {/* SVG Filters (Hidden) */}
      <svg className="hidden">
        <defs>
          <filter id="noise-displacement">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.005" numOctaves="2" result="turbulence" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="15" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      {/* HERO SECTION */}
      <section
        id="hero"
        className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden border-b border-dashed border-[var(--border-soft)] px-6 pt-20 md:px-24"
        style={HERO_BACKGROUND}
      >
        <div className="absolute inset-0 -z-10 opacity-80" style={HERO_GLOW} />
        <div className="absolute inset-0 -z-10 opacity-70" style={WARM_OVERLAY} />

        <div className="max-w-7xl w-full mx-auto">
          <div className="mb-6 flex items-center gap-4 font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-secondary)]">
             <div className="h-2 w-2 rounded-none bg-[var(--accent-secondary)] animate-pulse" />
             <span>SYSTEM_ONLINE // V.2026</span>
          </div>

          <h1 className="select-none font-display text-[13vw] font-black leading-[0.8] tracking-tighter text-[var(--text-primary)]">
            <span className="block transition-colors duration-300 hover:text-[var(--accent-secondary)]">SOLAR</span>
            <span className="block pl-[8vw] relative z-10">
              <span className="absolute -left-12 top-1/2 hidden -translate-y-1/2 -rotate-90 origin-right font-mono text-sm font-normal tracking-widest text-[var(--text-secondary)] opacity-60 md:block">
                (CYBER_METAPHYSICS)
              </span>
              <GlitchText text="STATIC" />
            </span>
            <span className="block pr-[2vw] text-right text-transparent opacity-60" style={CREAM_STROKE}>
              RITUALS
            </span>
          </h1>

          <div className="mt-24 flex flex-col items-end justify-between gap-10 md:flex-row">
            <div className="max-w-lg">
              <p className="font-mono text-sm font-medium leading-relaxed text-[var(--text-secondary)] md:text-base">
                <span className="bg-[var(--bg-light)] px-1 text-[var(--text-dark)]">/// MISSION:</span> Injecting code into flesh.
                <br/>
                A digital archive of cyber-sigilism tattoos, visual artifacts, and industrial noise.
                <br/>
                Designed in Terra, Solar.
              </p>
            </div>
            
            <a href="#gallery" className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]">
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                <ArrowDown size={20} className="group-hover:animate-bounce" />
              </div>
              <span className="font-mono text-sm tracking-widest">ACCESS PROTOCOLS</span>
            </a>
          </div>
        </div>
        
        {/* Decorative Grid Background */}
        <div className="absolute top-0 right-0 hidden h-full w-1/4 border-l border-[var(--border-soft)] opacity-50 lg:block" />
        <div className="absolute bottom-20 left-0 h-[1px] w-full bg-[var(--border-soft)]" />
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="bg-[var(--bg-light)] px-6 py-32 text-[var(--text-dark)] md:px-24">
        <div className="max-w-7xl mx-auto">
           <div className="mb-24 flex items-baseline justify-between border-b-2 border-[var(--border-dark-strong)] pb-6">
              <h2 className="font-display text-6xl font-black tracking-tighter md:text-8xl">
                ARTIFACTS
              </h2>
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--accent-primary)] md:text-sm">
                [ DB_LOADED: {ARTWORKS.length} ]
              </span>
           </div>

           <div className="grid grid-cols-1 gap-x-8 gap-y-32 md:grid-cols-2 lg:grid-cols-3">
              {ARTWORKS.map((art, index) => (
                <div key={art.id} className={`group ${index === 1 ? 'md:mt-40' : ''}`}>
                  <div className="relative mb-8">
                    <div className="absolute -top-6 -left-6 -z-10 select-none font-mono text-5xl font-bold text-[var(--text-dark-ghost)] transition-colors group-hover:text-[var(--glow-accent)]">
                      {index < 9 ? `0${index + 1}` : index + 1}
                    </div>
                    <div className="relative overflow-hidden border border-[var(--border-dark-strong)] bg-[var(--bg-secondary)]">
                      <DistortionImage 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="aspect-[3/4] w-full grayscale contrast-125 transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:contrast-100"
                      />
                      <div className="absolute inset-0 bg-[var(--glow-accent)] opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                    
                    <div className="absolute bottom-0 right-0 flex translate-y-1/2 items-center gap-2 bg-[var(--bg-primary)] px-4 py-2 font-mono text-xs font-bold uppercase text-[var(--text-primary)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                       <Hash size={12} /> DECODE SIGNAL
                    </div>
                  </div>

                  <div className="border-l border-[var(--border-dark-strong)] pl-6 transition-all group-hover:border-[var(--accent-primary)]">
                    <div className="mb-3 flex items-baseline justify-between">
                       <h3 className="font-display text-xl font-bold uppercase tracking-wide">{art.title}</h3>
                       <span className="border border-[var(--border-dark)] bg-[var(--surface-light)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-dark-soft)]">SYS.v{art.year}</span>
                    </div>
                    <p className="font-mono text-xs uppercase leading-relaxed tracking-wide text-[var(--text-dark-soft)] transition-colors group-hover:text-[var(--text-dark)]">
                      {art.description}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* MARQUEE SEPARATOR */}
      <div
        className="flex select-none overflow-hidden whitespace-nowrap border-y border-[var(--accent-primary)] bg-[var(--bg-primary)] py-16 text-[var(--text-primary)]"
        style={{ boxShadow: '0 0 30px var(--glow-accent)' }}
      >
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-marquee mx-6 flex items-center gap-12 opacity-80">
            <span className="font-display text-5xl font-black italic">SYSTEM_OVERRIDE</span>
            <span className="animate-pulse font-mono text-2xl text-[var(--accent-secondary)]">///</span>
            <span className="font-display text-5xl font-black text-transparent" style={THIN_CREAM_STROKE}>WEAR_THE_STATIC</span>
            <span className="animate-pulse font-mono text-2xl text-[var(--accent-secondary)]">///</span>
            <span className="font-display text-5xl font-black">IGNITION_SEQUENCE</span>
            <span className="animate-pulse font-mono text-2xl text-[var(--accent-secondary)]">///</span>
          </div>
        ))}
      </div>

      {/* AUDIO SECTION */}
      <section
        id="audio"
        className="relative overflow-hidden px-6 py-32 text-[var(--text-primary)] md:px-24"
        style={AUDIO_BACKGROUND}
      >
         <div className="absolute inset-0 opacity-80" style={WARM_OVERLAY} />
         <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <div>
               <div className="mb-8 inline-block border border-[var(--accent-secondary)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--accent-secondary)]">
                 Resonance_Chamber // Terra_Lab
               </div>
               <h2 className="mb-8 font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">
                 Sonic <br/>
                 <span className="text-transparent" style={CREAM_STROKE}>Rituals</span>
               </h2>
               <p className="mb-12 max-w-md border-l-2 border-[var(--accent-primary)] pl-6 font-mono text-base leading-relaxed text-[var(--text-secondary)]">
                 Math-rock precision meets Shoegaze distortion. 
                 <br/><br/>
                 Auditory hallucinations designed to resonate with specific tattoo protocols. High-gain frequencies for the modern void.
               </p>
               
               <div className="space-y-2">
                 {TRACKS.map((track, i) => (
                   <div key={i} className="group flex cursor-pointer items-center gap-6 border border-[var(--border-soft)] bg-[var(--surface-tint)] p-4 transition-all duration-300 hover:border-[var(--bg-light)] hover:bg-[var(--bg-light)] hover:text-[var(--text-dark)]">
                      <div className="flex h-6 w-6 items-center justify-center text-[var(--accent-secondary)] transition-colors group-hover:text-[var(--accent-primary)]">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <span className="font-mono text-sm font-bold uppercase tracking-widest">{track}</span>
                      <span className="ml-auto font-mono text-xs opacity-50">0{i + 2}:4{i * 2}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="relative flex h-full min-h-[400px] items-center justify-center border border-[var(--border-soft)] bg-[var(--surface-tint)]">
               {/* Decorative background elements */}
               <div className="absolute right-0 top-0 p-4 font-mono text-[10px] text-[var(--text-secondary)]">
                 VISUALIZER_ACTIVE
               </div>
               <div className="absolute bottom-0 left-0 p-4 font-mono text-[10px] text-[var(--text-secondary)]">
                 INPUT: MIC_SOURCE
               </div>
               <AudioVisualizer />
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[var(--bg-primary)] px-6 pb-12 pt-32 text-[var(--text-primary)] md:px-24">
         <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-16 border-b border-[var(--border-soft)] pb-20 md:flex-row md:items-end">
            <div>
              <h2 className="select-none font-display text-[12vw] font-black leading-none tracking-tighter text-[var(--text-ghost)]">
                END_LOG
              </h2>
              <div className="mt-12 flex flex-col gap-2">
                <span className="mb-2 font-mono text-xs font-bold tracking-widest text-[var(--accent-secondary)]">/// INITIALIZE CONTACT</span>
                
                {/* Brand Account */}
                <a 
                  href="https://www.instagram.com/solar.static27/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-display text-3xl font-bold leading-tight transition-colors hover:text-[var(--accent-secondary)]">
                  @solar.static27
                </a>

                {/* Personal Account */}
                <a 
                  href="https://www.instagram.com/current_astro_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-display text-3xl font-bold leading-tight transition-colors hover:text-[var(--accent-secondary)]">
                  @current_astro_
                </a>

                <p className="mt-4 font-mono text-sm text-[var(--text-secondary)]">Terran, Solar // The Void</p>
              </div>
            </div>

            
         </div>
         <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] md:flex-row">
            <span>© {new Date().getFullYear()} SOLAR_STATIC_SYSTEMS</span>
            <span>ALL PROTOCOLS SECURED</span>
         </div>
      </footer>

      {/* Global CSS animation definitions */}
      <style>{`
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
        .animate-noise {
          animation: noise 0.5s steps(5) infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
