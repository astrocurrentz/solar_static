import React from 'react';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import GlitchText from './components/GlitchText';
import DistortionImage from './components/DistortionImage';
import NoiseOverlay from './components/NoiseOverlay';
import AudioVisualizer from './components/AudioVisualizer';
import { ARTWORKS } from './constants';
import { Play, ArrowDown, Eye, Hash } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen cursor-none bg-[#e5e5e5] selection:bg-orange-600 selection:text-white">
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
      <section id="hero" className="min-h-screen flex flex-col justify-center px-6 md:px-24 pt-20 relative border-b border-stone-400 border-dashed">
        <div className="max-w-7xl w-full mx-auto">
          <div className="mb-6 flex items-center gap-4 text-xs font-bold tracking-[0.2em] text-orange-600 font-mono">
             <div className="w-2 h-2 bg-orange-600 rounded-none animate-pulse" />
             <span>SYSTEM_ONLINE // V.2026</span>
          </div>

          <h1 className="text-[13vw] leading-[0.8] font-black font-display tracking-tighter mix-blend-darken select-none">
            <span className="block hover:text-orange-600 transition-colors duration-300">SOLAR</span>
            <span className="block pl-[8vw] relative z-10">
              <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-sm font-mono font-normal tracking-widest opacity-60 -rotate-90 origin-right hidden md:block text-stone-500">
                (CYBER_METAPHYSICS)
              </span>
              <GlitchText text="STATIC" />
            </span>
            <span className="block text-right pr-[2vw] text-outline text-transparent stroke-black stroke-2 opacity-80" style={{ WebkitTextStroke: '2px #1c1917' }}>
              RITUALS
            </span>
          </h1>

          <div className="mt-24 flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="max-w-lg">
              <p className="text-sm md:text-base leading-relaxed font-mono text-stone-700 font-medium">
                <span className="bg-black text-white px-1">/// MISSION:</span> Injecting code into flesh. 
                <br/>
                A digital archive of cyber-sigilism tattoos, visual artifacts, and industrial noise. 
                <br/>
                Designed in Terra, Solar.
              </p>
            </div>
            
            <a href="#gallery" className="group flex items-center gap-4 text-lg font-bold hover:text-orange-600 transition-colors">
              <div className="w-12 h-12 border border-current flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white transition-all bg-white">
                <ArrowDown size={20} className="group-hover:animate-bounce" />
              </div>
              <span className="font-mono tracking-widest text-sm">ACCESS PROTOCOLS</span>
            </a>
          </div>
        </div>
        
        {/* Decorative Grid Background */}
        <div className="absolute top-0 right-0 w-1/4 h-full border-l border-stone-300 -z-10 hidden lg:block opacity-50" />
        <div className="absolute bottom-20 left-0 w-full h-[1px] bg-stone-300" />
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-32 px-6 md:px-24 bg-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
           <div className="flex items-baseline justify-between mb-24 border-b-2 border-stone-900 pb-6">
              <h2 className="text-6xl md:text-8xl font-display font-black tracking-tighter">
                ARTIFACTS
              </h2>
              <span className="font-mono text-xs md:text-sm tracking-widest text-orange-600 font-bold">
                [ DB_LOADED: {ARTWORKS.length} ]
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-32">
              {ARTWORKS.map((art, index) => (
                <div key={art.id} className={`group ${index === 1 ? 'md:mt-40' : ''}`}>
                  <div className="relative mb-8">
                    <div className="absolute -top-6 -left-6 font-mono text-5xl text-stone-300 font-bold -z-10 select-none group-hover:text-orange-600/20 transition-colors">
                      {index < 9 ? `0${index + 1}` : index + 1}
                    </div>
                    <div className="relative overflow-hidden border border-stone-900 bg-stone-900">
                      <DistortionImage 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="aspect-[3/4] w-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 transition-all duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-orange-600/20 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-300" />
                    </div>
                    
                    <div className="absolute bottom-0 right-0 bg-black text-white px-4 py-2 text-xs font-bold font-mono uppercase translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                       <Hash size={12} /> DECODE SIGNAL
                    </div>
                  </div>

                  <div className="border-l border-stone-900 pl-6 transition-all group-hover:border-orange-600">
                    <div className="flex justify-between items-baseline mb-3">
                       <h3 className="text-xl font-bold font-display uppercase tracking-wide">{art.title}</h3>
                       <span className="text-[10px] font-mono border border-stone-400 px-1.5 py-0.5 text-stone-600">SYS.v{art.year}</span>
                    </div>
                    <p className="text-xs text-stone-600 font-mono leading-relaxed uppercase tracking-wide group-hover:text-stone-900">
                      {art.description}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* MARQUEE SEPARATOR */}
      <div className="py-16 bg-[#1c1917] text-[#e5e5e5] overflow-hidden whitespace-nowrap flex select-none border-y border-orange-600">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-marquee flex items-center gap-12 mx-6 opacity-80">
            <span className="text-5xl font-display font-black italic">SYSTEM_OVERRIDE</span>
            <span className="text-2xl font-mono text-orange-600 animate-pulse">///</span>
            <span className="text-5xl font-display font-black text-transparent stroke-white" style={{ WebkitTextStroke: '1px #e5e5e5' }}>WEAR_THE_STATIC</span>
            <span className="text-2xl font-mono text-orange-600 animate-pulse">///</span>
            <span className="text-5xl font-display font-black">IGNITION_SEQUENCE</span>
            <span className="text-2xl font-mono text-orange-600 animate-pulse">///</span>
          </div>
        ))}
      </div>

      {/* AUDIO SECTION */}
      <section id="audio" className="py-32 px-6 md:px-24 bg-[#e5e5e5] relative overflow-hidden">
         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
               <div className="inline-block border border-orange-600 text-orange-600 px-3 py-1 text-[10px] font-bold tracking-widest font-mono mb-8 uppercase">
                 Resonance_Chamber // Terra_Lab
               </div>
               <h2 className="text-6xl md:text-8xl font-display font-black mb-8 leading-[0.85] uppercase">
                 Sonic <br/>
                 <span className="text-transparent stroke-black" style={{ WebkitTextStroke: '2px #1c1917' }}>Rituals</span>
               </h2>
               <p className="text-base font-mono text-stone-700 mb-12 leading-relaxed border-l-2 border-orange-600 pl-6 max-w-md">
                 Math-rock precision meets Shoegaze distortion. 
                 <br/><br/>
                 Auditory hallucinations designed to resonate with specific tattoo protocols. High-gain frequencies for the modern void.
               </p>
               
               <div className="space-y-2">
                 {['Protocol: Wildfire', 'The Apex Vector', 'Lazarus Sequence (Bass Only)'].map((track, i) => (
                   <div key={i} className="flex items-center gap-6 group cursor-pointer border border-stone-300 p-4 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300">
                      <div className="w-6 h-6 flex items-center justify-center text-orange-600 group-hover:text-white transition-colors">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <span className="font-bold font-mono uppercase tracking-widest text-sm">{track}</span>
                      <span className="ml-auto text-xs font-mono opacity-50">0{i+2}:4{i*2}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="relative h-full min-h-[400px] flex items-center justify-center border border-stone-300 bg-stone-200/50">
               {/* Decorative background elements */}
               <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-stone-500">
                 VISUALIZER_ACTIVE
               </div>
               <div className="absolute bottom-0 left-0 p-4 font-mono text-[10px] text-stone-500">
                 INPUT: MIC_SOURCE
               </div>
               <AudioVisualizer />
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#111] text-[#e5e5e5] pt-32 pb-12 px-6 md:px-24">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-16 border-b border-white/20 pb-20">
            <div>
              <h2 className="text-[12vw] leading-none font-black font-display text-white/5 select-none tracking-tighter">
                END_LOG
              </h2>
              <div className="mt-12 flex flex-col gap-3">
                <span className="text-xs font-mono text-orange-600 font-bold tracking-widest">/// INITIALIZE CONTACT</span>
                <a 
                  href="https://www.instagram.com/solar.static27/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-3xl hover:text-orange-600 transition-colors font-display font-bold">
                  @solar.static27
                </a>
                <p className="text-stone-500 font-mono text-sm">Terran, Solar // The Void</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
                <div className="flex gap-8 text-xs font-bold tracking-[0.2em] uppercase font-mono">
                  <a href="#" className="hover:text-orange-600 transition-colors">Instagram</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Github</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Bookings</a>
                </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-stone-600 uppercase font-mono tracking-widest">
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