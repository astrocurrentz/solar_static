import React from 'react';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import GlitchText from './components/GlitchText';
import DistortionImage from './components/DistortionImage';
import NoiseOverlay from './components/NoiseOverlay';
import AudioVisualizer from './components/AudioVisualizer';
import { ARTWORKS } from './constants';
import { Play, ArrowDown, Eye } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen cursor-none">
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
      <section id="hero" className="min-h-screen flex flex-col justify-center px-6 md:px-24 pt-20 relative border-b border-stone-300 border-dashed">
        <div className="max-w-6xl w-full mx-auto">
          <div className="mb-4 flex items-center gap-4 text-xs font-bold tracking-widest text-orange-600">
             <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
             <span>SIGNAL_DETECTED</span>
          </div>

          <h1 className="text-[12vw] leading-[0.85] font-black font-display tracking-tighter mix-blend-darken select-none">
            <span className="block hover:text-orange-600 transition-colors duration-300">DIGITAL</span>
            <span className="block pl-[10vw] relative">
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-lg font-mono font-normal tracking-widest opacity-50 -rotate-90 origin-right hidden md:block">
                (ERROR_404)
              </span>
              <GlitchText text="DECAY" />
            </span>
            <span className="block text-right pr-[5vw] text-outline text-transparent stroke-black stroke-2" style={{ WebkitTextStroke: '2px #1c1917' }}>
              AESTHETIC
            </span>
          </h1>

          <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-10">
            <p className="max-w-md text-sm md:text-base leading-relaxed font-mono text-stone-600">
              Exploring the beauty of malfunction. A curated collection of graphic distortion, semantic noise, and auditory hallucinations.
            </p>
            
            <a href="#gallery" className="group flex items-center gap-4 text-lg font-bold hover:text-orange-600 transition-colors">
              <div className="w-12 h-12 border border-current rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white transition-all">
                <ArrowDown size={20} className="group-hover:animate-bounce" />
              </div>
              <span>ENTER ARCHIVE</span>
            </a>
          </div>
        </div>
        
        {/* Decorative Grid Background */}
        <div className="absolute top-0 right-0 w-1/3 h-full border-l border-stone-200 -z-10 hidden lg:block" />
        <div className="absolute bottom-20 left-0 w-full h-[1px] bg-stone-300" />
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-32 px-6 md:px-24 bg-[#ebe9e1]">
        <div className="max-w-7xl mx-auto">
           <div className="flex items-baseline justify-between mb-20 border-b-2 border-stone-900 pb-6">
              <h2 className="text-6xl md:text-8xl font-display font-black">
                ARTIFACTS
              </h2>
              <span className="font-mono text-xs md:text-sm tracking-wider">
                [ {ARTWORKS.length} ITEMS FOUND ]
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
              {ARTWORKS.map((art, index) => (
                <div key={art.id} className={`group ${index === 1 ? 'md:mt-32' : ''}`}>
                  <div className="relative mb-6">
                    <div className="absolute -top-4 -left-4 font-mono text-4xl text-stone-200 font-bold -z-10 select-none group-hover:text-orange-200 transition-colors">
                      {art.id}
                    </div>
                    <DistortionImage 
                      src={art.imageUrl} 
                      alt={art.title} 
                      className="aspect-square w-full shadow-2xl shadow-stone-900/10 grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                       <Eye size={12} /> View Source
                    </div>
                  </div>

                  <div className="border-l-2 border-stone-300 pl-4 transition-all group-hover:border-orange-500">
                    <div className="flex justify-between items-baseline mb-2">
                       <h3 className="text-2xl font-bold font-display uppercase">{art.title}</h3>
                       <span className="text-xs font-mono bg-stone-200 px-2 py-0.5 rounded text-stone-600">{art.year}</span>
                    </div>
                    <p className="text-sm text-stone-600 font-mono leading-relaxed group-hover:text-stone-900">
                      {art.description}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* MARQUEE SEPARATOR */}
      <div className="py-12 bg-stone-900 text-[#f2f0ea] overflow-hidden whitespace-nowrap flex select-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-marquee flex items-center gap-8 mx-4">
            <span className="text-4xl font-display font-black italic">SYSTEM_FAILURE</span>
            <span className="text-xl font-mono text-orange-500">///</span>
            <span className="text-4xl font-display font-black text-transparent stroke-white" style={{ WebkitTextStroke: '1px #f2f0ea' }}>REBOOTING</span>
            <span className="text-xl font-mono text-orange-500">///</span>
          </div>
        ))}
      </div>

      {/* AUDIO SECTION */}
      <section id="audio" className="py-32 px-6 md:px-24">
         <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
               <div className="inline-block bg-orange-600 text-white px-2 py-1 text-xs font-bold mb-6">
                 SOUND_LAB_BETA
               </div>
               <h2 className="text-5xl md:text-7xl font-display font-black mb-8 leading-tight">
                 AUDITORY <br/>
                 <span className="text-stone-400">ILLUSIONS</span>
               </h2>
               <p className="text-lg font-mono text-stone-600 mb-10 leading-relaxed border-l border-orange-600 pl-6">
                 Generative soundscapes created through data bending and frequency modulation. 
                 Interact with the visualizer to simulate the corruption process.
               </p>
               
               <div className="space-y-4">
                 {['White Noise Therapy', 'Binary Sunset', 'Glitch Hop Protocol'].map((track, i) => (
                   <div key={i} className="flex items-center gap-4 group cursor-pointer border-b border-stone-200 pb-4 hover:border-orange-500 hover:pl-4 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Play size={12} fill="currentColor" />
                      </div>
                      <span className="font-bold font-mono uppercase group-hover:text-orange-600">{track}</span>
                      <span className="ml-auto text-xs text-stone-400">03:4{i}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="relative">
               {/* Abstract graphics behind */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl mix-blend-multiply" />
               <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-stone-200 rounded-full blur-3xl mix-blend-multiply" />
               
               <AudioVisualizer />
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-stone-900 text-[#f2f0ea] pt-24 pb-10 px-6 md:px-24">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-white/10 pb-24">
            <div>
              <h2 className="text-[10vw] leading-none font-black font-display text-white/10 select-none">
                END_LOG
              </h2>
              <div className="mt-8 flex flex-col gap-2">
                <a href="mailto:hello@glitch.art" className="text-2xl hover:text-orange-500 transition-colors font-mono">hello@glitch.art</a>
                <p className="text-stone-500 font-mono">Based in the Grid</p>
              </div>
            </div>

            <div className="flex gap-8 text-sm font-bold tracking-widest uppercase">
               <a href="#" className="hover:text-orange-500 hover:underline">Instagram</a>
               <a href="#" className="hover:text-orange-500 hover:underline">Twitter</a>
               <a href="#" className="hover:text-orange-500 hover:underline">Are.na</a>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-8 flex justify-between items-center text-[10px] text-stone-600 uppercase font-mono">
            <span>© {new Date().getFullYear()} SIGNAL_LOSS</span>
            <span>NO RIGHTS RESERVED</span>
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