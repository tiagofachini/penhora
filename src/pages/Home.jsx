import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Camera, FileText, Shield, Zap,
  Smartphone, Cloud, MapPin, Scan, Calendar, Clock,
  LayoutDashboard, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const logoSrc = "https://horizons-cdn.hostinger.com/d89750d7-1f5d-466f-8dd9-087252acee70/2d8010627a52ee48131ebed25f5ffc09.png";

function useIsInView(ref, threshold = 0.3) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return visible;
}

// ── Feature 1: IA analisa foto ─────────────────────────────────────────────────
function AIPhotoDemo() {
  const ref = useRef(null);
  const inView = useIsInView(ref, 0.3);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!inView) { setPhase(0); return; }
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 3300);
    const t3 = setTimeout(() => { setPhase(0); setCycle(c => c + 1); }, 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView, cycle]);

  const fields = [
    { label: 'Produto',          value: 'TV Plana OLED 55"'  },
    { label: 'Marca',            value: 'SAMSUNG'             },
    { label: 'Modelo',           value: 'UN55S90CAUXPA'       },
    { label: 'Valor aprox.',     value: 'R$ 2.100,00'         },
    { label: 'Código de barras', value: '7891234567890'       },
  ];

  return (
    <div ref={ref} className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
      {/* Phone */}
      <div className="shrink-0 mx-auto md:mx-0">
        <div className="relative bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl border-[3px] border-gray-700 w-52">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-gray-900 rounded-b-xl z-20" />
          <div className="bg-black rounded-[2rem] overflow-hidden">
            <div className="relative flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800" style={{ minHeight: 340 }}>
              {/* TV mockup */}
              <div className="relative z-10">
                <div className="bg-gray-800 rounded-lg p-1.5 border border-gray-600 w-36 shadow-xl">
                  <div className="bg-slate-900 rounded overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-indigo-950 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-blue-200 text-[9px] font-bold tracking-widest">SAMSUNG</div>
                        <div className="text-blue-400/40 text-[6px] mt-0.5">OLED · 55"</div>
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 w-1/3 h-full bg-white/5" style={{ transform: 'skewX(6deg)' }} />
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className="w-0.5 h-2 bg-gray-600" />
                  </div>
                  <div className="h-1 bg-gray-700 rounded mx-auto" style={{ width: '55%' }} />
                </div>
              </div>

              {/* Scanning overlay — phase 1 */}
              <AnimatePresence>
                {phase === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20">
                    <div className="absolute inset-0 bg-blue-950/25" />
                    <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                    <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                    <div className="absolute bottom-12 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute bottom-12 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-400" />
                    <motion.div
                      className="absolute left-5 right-5 h-px"
                      style={{ background: 'linear-gradient(90deg,transparent,#60a5fa,transparent)', boxShadow: '0 0 8px 2px rgba(96,165,250,.55)' }}
                      animate={{ top: ['20%', '72%', '20%'] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                    />
                    <div className="absolute bottom-5 inset-x-0 flex justify-center">
                      <div className="bg-blue-950/90 border border-blue-500/30 text-blue-200 text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
                          animate={{ opacity: [1, 0.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.7 }}
                        />
                        Analisando com IA...
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Idle state */}
              {phase === 0 && (
                <div className="absolute bottom-5 inset-x-0 z-20 flex justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-white/50 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/75" />
                  </div>
                </div>
              )}

              <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-10">
                <Camera className="h-3.5 w-3.5 text-white/60" />
                <span className="text-white/50 text-[10px]">Identificar Bem</span>
                <div className="w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <motion.div
        animate={{ x: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="hidden md:block shrink-0"
      >
        <ArrowRight className="h-8 w-8 text-secondary" />
      </motion.div>

      {/* Result card */}
      <div className="flex-1 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {phase < 2 ? (
            <motion.div
              key="sk"
              animate={{ opacity: phase === 1 ? 0.2 : 0.5 }}
              className="bg-white rounded-2xl border border-border shadow-md p-5"
            >
              <div className="h-4 w-40 bg-muted rounded mb-4" />
              {fields.map((_, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="h-3 w-24 bg-muted/70 rounded shrink-0" />
                  <div className="h-3 bg-muted rounded flex-1" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="res"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-2 border-secondary/35 shadow-xl p-5"
            >
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-secondary">IA identificou o bem</div>
                  <div className="text-[11px] text-muted-foreground">Campos preenchidos automaticamente</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {fields.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[11px] text-muted-foreground w-28 shrink-0">{f.label}</span>
                    <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded flex-1 truncate">{f.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Feature 2: Leitor de código de barras ──────────────────────────────────────
function BarcodeDemo() {
  const ref = useRef(null);
  const inView = useIsInView(ref, 0.3);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!inView) { setPhase(0); return; }
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 2700);
    const t3 = setTimeout(() => { setPhase(0); setCycle(c => c + 1); }, 8500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView, cycle]);

  const bars = [3,1,4,1,2,3,1,5,1,2,4,1,3,1,2,4,1,3,2,1,4,1,2,3,1,4,2,1,3,1];

  return (
    <div ref={ref} className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
      {/* Viewfinder */}
      <div className="flex-1 w-full max-w-sm mx-auto md:mx-0">
        <div className="bg-gray-950 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2 border-b border-gray-800">
            <Scan className="h-3.5 w-3.5 text-secondary" />
            <span className="text-xs text-gray-400 font-medium">Câmera — Leitor de Código de Barras</span>
          </div>
          <div className="relative flex items-center justify-center py-10 px-6" style={{ minHeight: 170 }}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-px">
                {bars.map((w, i) => (
                  <div
                    key={i}
                    style={{ width: i % 2 === 0 ? Math.max(w - 1, 2) + 'px' : '1px', height: (36 + (i % 4) * 4) + 'px' }}
                    className={i % 2 === 0 ? 'bg-white rounded-sm' : 'bg-transparent'}
                  />
                ))}
              </div>
              <div className="text-gray-500 text-[9px] font-mono tracking-[0.2em] mt-1">7 8 9 1 2 3 4 5 6 7 8 9 0</div>
            </div>

            <AnimatePresence>
              {phase === 1 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-4"
                >
                  <div className="absolute inset-0 border border-dashed border-secondary/30 rounded-lg" />
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-secondary rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-secondary rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-secondary rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-secondary rounded-br-md" />
                  <motion.div
                    className="absolute left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg,transparent,#10b981,transparent)', boxShadow: '0 0 6px 2px rgba(16,185,129,.55)' }}
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                  />
                </motion.div>
              )}
              {phase === 2 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(16,185,129,0.08)' }}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-secondary text-xs font-bold">Código lido!</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <motion.div
        animate={{ x: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="hidden md:block shrink-0"
      >
        <ArrowRight className="h-8 w-8 text-secondary" />
      </motion.div>

      {/* Decoded result */}
      <div className="flex-1 w-full max-w-sm mx-auto md:mx-0">
        <AnimatePresence mode="wait">
          {phase < 2 ? (
            <motion.div key="sk" animate={{ opacity: phase === 1 ? 0.2 : 0.5 }} className="bg-white rounded-2xl border border-border shadow-md p-5">
              <div className="h-4 w-36 bg-muted rounded mb-4" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="h-3 w-20 bg-muted/70 rounded shrink-0" />
                  <div className="h-3 bg-muted rounded flex-1" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="res" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border-2 border-secondary/35 shadow-xl p-5">
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center">
                  <Scan className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-secondary">Código decodificado</div>
                  <div className="text-[11px] text-muted-foreground">Campo preenchido automaticamente</div>
                </div>
              </div>
              {[
                { label: 'Código EAN',    value: '7891234567890'          },
                { label: 'Produto',       value: 'Furadeira BOSCH GSB 450' },
                { label: 'Campo destino', value: 'Código de Barras'       },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.12 }} className="flex items-center gap-2 mb-2.5">
                  <span className="text-[11px] text-muted-foreground w-24 shrink-0">{f.label}</span>
                  <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded flex-1">{f.value}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Feature 3: Documento Auto de Penhora ──────────────────────────────────────
function DocumentMockup() {
  return (
    <div className="relative max-w-lg mx-auto">
      <div className="absolute inset-0 translate-x-3 translate-y-3 bg-gray-200 rounded-xl" />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-gray-100 rounded-xl" />
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Document header */}
        <div className="border-b-2 border-primary/10 p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/8 border border-primary/15 flex flex-col items-center justify-center shrink-0">
            <img src={logoSrc} alt="" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-primary text-sm tracking-wide">AUTO DE PENHORA E AVALIAÇÃO</div>
            <div className="text-muted-foreground text-[11px] mt-0.5">Processo nº 1234567-89.2024.8.26.0100</div>
            <div className="text-muted-foreground text-[11px]">Dr. João Silva — Oficial de Justiça Mat. 12345</div>
            <div className="text-muted-foreground text-[11px]">1ª Vara Cível — Foro Central João Mendes</div>
          </div>
          <div className="shrink-0 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full border border-secondary/20">PDF</div>
        </div>

        <div className="p-5">
          <div className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
            Aos <strong>06 de maio de 2025</strong>, na Rua das Flores, 123 — São Paulo/SP, eu, Oficial de Justiça, procedi à penhora dos seguintes bens avaliados conforme o Art. 838 do CPC:
          </div>

          {/* Items table */}
          <table className="w-full text-[10px] border-collapse mb-4">
            <thead>
              <tr className="bg-primary/6">
                <th className="border border-gray-200 px-2 py-1.5 text-left text-primary font-semibold">#</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left text-primary font-semibold">Bem Penhorado</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left text-primary font-semibold">Marca / Modelo</th>
                <th className="border border-gray-200 px-2 py-1.5 text-right text-primary font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: 1, bem: 'TV Plana OLED 55"',  marca: 'Samsung / UN55S90', valor: 'R$ 2.100' },
                { n: 2, bem: 'Notebook',            marca: 'Dell / Inspiron 15', valor: 'R$ 3.400' },
                { n: 3, bem: 'Furadeira',           marca: 'Bosch / GSB 450',    valor: 'R$ 280'   },
              ].map(row => (
                <tr key={row.n} className="even:bg-muted/30">
                  <td className="border border-gray-200 px-2 py-1.5 text-muted-foreground">{row.n}</td>
                  <td className="border border-gray-200 px-2 py-1.5 font-medium text-primary">{row.bem}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-muted-foreground">{row.marca}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right font-semibold text-primary">{row.valor}</td>
                </tr>
              ))}
              <tr className="bg-primary/6">
                <td colSpan={3} className="border border-gray-200 px-2 py-1.5 text-right font-bold text-primary">Total Avaliado:</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-bold text-secondary">R$ 5.780</td>
              </tr>
            </tbody>
          </table>

          {/* Photo strip */}
          <div className="flex items-center gap-2 mb-4">
            {['from-slate-300 to-slate-400', 'from-gray-200 to-gray-300', 'from-zinc-300 to-zinc-400'].map((g, i) => (
              <div key={i} className={`bg-gradient-to-br ${g} rounded w-14 h-10 flex items-center justify-center shrink-0`}>
                <Camera className="h-3.5 w-3.5 text-white/70" />
              </div>
            ))}
            <div className="text-[9px] text-muted-foreground">+ 8 fotos anexadas automaticamente</div>
          </div>

          {/* Signature + badge */}
          <div className="border-t border-gray-200 pt-3 flex items-end justify-between">
            <div>
              <div className="h-px w-36 bg-gray-400 mb-1" />
              <div className="text-[9px] text-muted-foreground">Assinatura do Oficial de Justiça</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-secondary/15 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-secondary" />
              </div>
              <span className="text-[9px] text-secondary font-bold">Gerado pelo Penhora.app</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature 4: Agenda com mapa ─────────────────────────────────────────────────
function AgendaMockup() {
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const events = [
    { day: 7,  label: 'Proc. #8921 — Vila Mariana',    time: '09:00' },
    { day: 12, label: 'Proc. #9034 — Moema',           time: '14:30' },
    { day: 19, label: 'Proc. #9105 — Pinheiros',       time: '10:00' },
  ];
  const today = 12;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">
      {/* Calendar header */}
      <div className="bg-primary px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-white/60 text-xs font-medium uppercase tracking-wide">Agenda de Diligências</div>
          <div className="text-white font-bold text-lg">Maio 2025</div>
        </div>
        <Calendar className="h-6 w-6 text-white/60" />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {days.map((d, i) => (
          <div key={i} className="text-center py-2 text-[10px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar grid — mini */}
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {Array.from({ length: 35 }, (_, i) => {
          const day = i - 2; // offset so day 1 = Thursday
          const d = day + 1;
          const isEvent = events.some(e => e.day === d);
          const isToday = d === today;
          if (d < 1 || d > 31) return <div key={i} className="bg-white h-8" />;
          return (
            <div key={i} className={`bg-white h-8 flex flex-col items-center justify-center relative ${isToday ? 'bg-primary/5' : ''}`}>
              <span className={`text-[11px] leading-none ${isToday ? 'w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold' : 'text-muted-foreground'}`}>{d}</span>
              {isEvent && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-secondary" />}
            </div>
          );
        })}
      </div>

      {/* Upcoming diligences */}
      <div className="p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Próximas diligências</div>
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-lg p-2 ${i === 1 ? 'bg-primary/5 border border-primary/15' : 'bg-muted/30'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                <span className="text-[11px] font-bold">{ev.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-primary truncate">{ev.label}</div>
                <div className="text-[10px] text-muted-foreground">{ev.time}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3 text-secondary" />
                <span className="text-[10px] text-secondary font-medium">Ver rota</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature 4: Map mockup ──────────────────────────────────────────────────────
function MapMockup() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden h-full" style={{ minHeight: 260 }}>
      {/* Map header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MapPin className="h-4 w-4 text-secondary" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-primary">Rua das Flores, 123 — Moema, SP</div>
          <div className="text-[10px] text-muted-foreground">12 min de carro · 4,2 km</div>
        </div>
        <div className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full">Navegar</div>
      </div>

      {/* Map visual */}
      <div className="relative overflow-hidden bg-slate-100" style={{ minHeight: 220 }}>
        {/* Streets grid simulation */}
        <svg width="100%" height="220" viewBox="0 0 320 220" className="absolute inset-0">
          <rect width="320" height="220" fill="#e8eedc" />
          {/* Blocks */}
          <rect x="0" y="0" width="90" height="65" fill="#d4dcc4" />
          <rect x="100" y="0" width="80" height="65" fill="#d4dcc4" />
          <rect x="190" y="0" width="130" height="65" fill="#d4dcc4" />
          <rect x="0" y="75" width="60" height="80" fill="#d4dcc4" />
          <rect x="70" y="75" width="110" height="80" fill="#d4dcc4" />
          <rect x="190" y="75" width="80" height="80" fill="#d4dcc4" />
          <rect x="280" y="75" width="40" height="80" fill="#d4dcc4" />
          <rect x="0" y="165" width="80" height="55" fill="#d4dcc4" />
          <rect x="90" y="165" width="110" height="55" fill="#d4dcc4" />
          <rect x="210" y="165" width="110" height="55" fill="#d4dcc4" />
          {/* Streets */}
          <rect x="0" y="65" width="320" height="10" fill="#f5f0e8" />
          <rect x="0" y="155" width="320" height="10" fill="#f5f0e8" />
          <rect x="90" y="0" width="10" height="220" fill="#f5f0e8" />
          <rect x="180" y="0" width="10" height="220" fill="#f5f0e8" />
          <rect x="270" y="0" width="10" height="220" fill="#f5f0e8" />
          {/* Main avenue */}
          <rect x="0" y="100" width="320" height="15" fill="#e8e0d0" opacity="0.7" />
          {/* Route line */}
          <polyline points="30,200 30,110 160,110 160,45" stroke="#1e40af" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" opacity="0.8" />
          {/* Destination pin */}
          <circle cx="160" cy="40" r="10" fill="#10b981" />
          <circle cx="160" cy="40" r="5" fill="white" />
          {/* Start pin */}
          <circle cx="30" cy="205" r="7" fill="#1e40af" />
          <circle cx="30" cy="205" r="3" fill="white" />
        </svg>

        {/* Distance badge */}
        <div className="absolute bottom-3 right-3 bg-white border border-border shadow rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-primary leading-none">4,2</div>
          <div className="text-[9px] text-muted-foreground">km</div>
        </div>
        <div className="absolute bottom-3 left-3 bg-white border border-border shadow rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-secondary leading-none">12</div>
          <div className="text-[9px] text-muted-foreground">min</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Home ──────────────────────────────────────────────────────────────────
const Home = () => {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Penhora.app",
    "headline": "Gestão Inteligente de Penhoras e Avaliações",
    "applicationCategory": "LegalSystem",
    "operatingSystem": "Web, iOS, Android",
    "description": "Ferramenta para Oficiais de Justiça. Realize penhoras, avaliações de bens e gere autos em PDF automaticamente conforme o CPC.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL",
      "seller": { "@type": "Organization", "name": "Penhora.app" }
    }
  };

  return (
    <>
      <Helmet>
        <title>Penhora.app.br - O melhor software para Gestão de Penhoras</title>
        <meta name="description" content="IA que identifica bens por foto, leitura de código de barras, geração automática de autos em PDF e agenda de diligências com mapa. O app essencial para Oficiais de Justiça." />
        <meta name="keywords" content="penhora, oficial de justiça, avaliação de bens, cpc 838, auto de penhora, gestão de mandados, tribunal, judiciário, app para oficiais, inteligência artificial" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://penhora.app.br/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://penhora.app.br/" />
        <meta property="og:title" content="Penhora.app.br | O App do Oficial de Justiça" />
        <meta property="og:description" content="IA que identifica bens por foto, código de barras e geração automática de autos. 70% menos tempo, 100% na nuvem." />
        <meta property="og:image" content={logoSrc} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://penhora.app.br/" />
        <meta property="twitter:title" content="Penhora.app.br | Gestão de Penhoras com IA" />
        <meta property="twitter:description" content="IA que identifica bens por foto e geração automática de autos. O app do Oficial de Justiça." />
        <meta property="twitter:image" content={logoSrc} />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <main className="bg-white">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">

              <div className="lg:w-1/2 text-center lg:text-left">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6 border border-secondary/20">
                    <span className="flex h-2 w-2 rounded-full bg-secondary mr-2" />
                    IA integrada + Leitura de código de barras
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
                    Penhoras feitas com <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">inteligência artificial</span>
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Fotografe o bem, a IA descreve. Escaneie o código de barras, o campo preenche. Clique em um botão, o auto sai em PDF. A ferramenta que o Oficial de Justiça moderno precisa.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 bg-accent text-primary hover:bg-accent/90 font-bold shadow-lg shadow-accent/20">
                      <Link to="/signup">Começar Gratuitamente</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 border-input hover:bg-secondary/5 hover:text-secondary text-primary">
                      <a href="#funcionalidades" className="flex items-center">
                        Ver funcionalidades <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-secondary mr-2" /> Conformidade CPC</div>
                    <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-secondary mr-2" /> Autos em PDF</div>
                    <div className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Gratuito e ilimitado</div>
                  </div>
                </motion.div>
              </div>

              {/* Hero mockup — fiel ao Dashboard real */}
              <div className="lg:w-1/2 w-full">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
                  <div className="bg-slate-50 rounded-2xl shadow-2xl border border-border overflow-hidden">

                    {/* Browser chrome */}
                    <div className="bg-white border-b border-border px-4 py-2.5 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="ml-3 bg-slate-100 border border-border rounded px-3 py-0.5 text-[11px] text-muted-foreground flex-1">
                        penhora.app.br/dashboard
                      </div>
                    </div>

                    {/* App shell */}
                    <div className="flex" style={{ height: 420 }}>

                      {/* Sidebar */}
                      <div className="w-44 bg-white border-r border-border p-3 shrink-0 hidden md:flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 mb-5 px-1 pt-1">
                          <img src={logoSrc} alt="" className="h-5 w-auto" />
                          <span className="font-bold text-[11px] text-slate-700 leading-tight">Penhora.app.br</span>
                        </div>
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard',  active: true  },
                          { icon: FileText,        label: 'Processos',  active: false },
                          { icon: Camera,          label: 'Bens',       active: false },
                          { icon: Calendar,        label: 'Agenda',     active: false },
                        ].map(({ icon: Icon, label, active }) => (
                          <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                            <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
                          </div>
                        ))}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">

                        {/* Page header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-800">Olá, Dr. João Silva!</div>
                            <div className="text-[10px] text-slate-400">Resumo das suas atividades</div>
                          </div>
                          <div className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                            <span className="text-base leading-none font-light">+</span> Nova Penhora
                          </div>
                        </div>

                        {/* Stat cards row */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Processos',    val: '12',       color: 'text-blue-600',   bg: 'bg-blue-50'   },
                            { label: 'Diligências',  val: '8',        color: 'text-green-600',  bg: 'bg-green-50'  },
                            { label: 'Bens',         val: '47',       color: 'text-amber-600',  bg: 'bg-amber-50'  },
                            { label: 'Total',        val: 'R$ 94k',   color: 'text-purple-600', bg: 'bg-purple-50' },
                          ].map((s, i) => (
                            <div key={i} className="bg-white rounded-lg border border-border p-2 shadow-sm">
                              <div className="text-[8px] text-slate-400 mb-0.5">{s.label}</div>
                              <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
                            </div>
                          ))}
                        </div>

                        {/* Próximas penhoras */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1 bg-blue-50 rounded">
                              <Calendar className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">Próximas Penhoras</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { day: 'Hoje', color: 'bg-red-100 text-red-700', proc: '1234567-89.2024', exec: 'Maria Souza', addr: 'Av. Paulista, 1000 — SP' },
                              { day: '13 mai', color: 'bg-blue-100 text-blue-700', proc: '9876543-21.2024', exec: 'João Ferreira', addr: 'Rua Augusta, 200 — SP' },
                            ].map((d, i) => (
                              <div key={i} className="bg-white rounded-lg border border-border p-2.5 shadow-sm">
                                <div className="flex items-start gap-2">
                                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${d.color}`}>{d.day}</div>
                                  <div className="min-w-0">
                                    <div className="text-[9px] font-semibold text-slate-800 truncate">{d.proc}</div>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      <div className="w-2 h-2 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate">{d.exec}</div>
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="h-2 w-2 text-slate-400 shrink-0" />
                                      <div className="text-[9px] text-slate-400 truncate">{d.addr}</div>
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-1.5">
                                      <MapPin className="h-2 w-2 text-green-500 shrink-0" />
                                      <span className="text-[9px] text-green-600 font-semibold">Ver rota no mapa</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bem sendo cadastrado — mini card com IA */}
                        <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-2.5 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                            <Camera className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-semibold text-slate-700">TV Plana OLED 55" · Samsung</div>
                            <div className="text-[8px] text-slate-400">Código: 7891234567890 · R$ 2.100,00</div>
                          </div>
                          <div className="shrink-0 bg-green-50 text-green-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-0.5">
                            <CheckCircle2 className="h-2 w-2" /> IA
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5 }}
                    className="absolute -right-6 top-14 bg-white p-3 rounded-xl shadow-xl border border-border hidden md:block"
                    style={{ maxWidth: 160 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-800">Auto gerado!</div>
                        <div className="text-[9px] text-slate-400">PDF pronto para assinar</div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-full rounded-full" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STAT STRIP ────────────────────────────────────────────────────── */}
        <section className="py-14 bg-primary/5 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '70%',       label: 'economia de tempo',        icon: Clock   },
                { value: '1 clique',  label: 'para gerar o auto em PDF', icon: FileText },
                { value: '100%',      label: 'seguro e acessível na nuvem', icon: Cloud  },
                { value: 'CPC',       label: 'Arts. 835, 838 e 872',     icon: Shield  },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-1">
                    <s.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-sm text-muted-foreground leading-snug max-w-[140px]">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE 1: IA por foto ────────────────────────────────────────── */}
        <section id="funcionalidades" className="py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                className="lg:w-5/12"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-secondary font-semibold text-sm tracking-wider uppercase">Inteligência Artificial</span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-5 leading-tight">
                  Fotografe o bem.<br />A IA descreve tudo.
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Tire uma foto do bem penhorado e o sistema usa a inteligência artificial da Anthropic para identificar automaticamente produto, marca, modelo e características técnicas — preenchendo o formulário sem digitar nada.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Identificação por foto com IA (Anthropic Claude)',
                    'Preenchimento automático: nome, marca e modelo',
                    'Descrição técnica em linguagem pericial (150–500 caracteres)',
                    'Sugestão de valor de mercado aproximado',
                    'Funciona em qualquer câmera — celular ou computador',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className="lg:w-7/12 w-full"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 border border-border shadow-sm">
                  <AIPhotoDemo />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FEATURE 2: Código de barras ───────────────────────────────────── */}
        <section className="py-28 bg-muted/20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
              <motion.div
                className="lg:w-7/12 w-full"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl p-8 border border-border shadow-sm">
                  <BarcodeDemo />
                </div>
              </motion.div>

              <motion.div
                className="lg:w-5/12"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-secondary font-semibold text-sm tracking-wider uppercase">Leitura de Código de Barras</span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-5 leading-tight">
                  Aponte a câmera.<br />O campo preenche.
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Sem precisar digitar nada — aponte a câmera do celular para o código de barras do produto e o sistema lê, decodifica e preenche o campo automaticamente no cadastro do bem.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Funciona no celular e no computador',
                    'Compatível com EAN-13, QR Code e outros formatos',
                    'Campo "Código de Barras" preenchido automaticamente',
                    'Integra com a análise de foto por IA',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FEATURE 3: Auto de penhora ────────────────────────────────────── */}
        <section className="py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div
                className="lg:w-5/12"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-secondary font-semibold text-sm tracking-wider uppercase">Geração de Documentos</span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-5 leading-tight">
                  Auto de penhora<br />gerado em 1 clique.
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Com todos os dados e fotos registrados, o sistema gera o Auto de Penhora e Avaliação em PDF de forma automática — já formatado com a logo e dados do Oficial de Justiça, pronto para assinar.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'PDF com logo e dados do Oficial de Justiça',
                    'Fotos dos bens inseridas automaticamente no documento',
                    'Tabela de bens com valores e descrições técnicas',
                    'Conformidade total com os arts. 835, 838 e 872 do CPC',
                    'Pronto para assinar e protocolar',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className="lg:w-7/12 w-full"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <DocumentMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FEATURE 4: Agenda + Mapa ──────────────────────────────────────── */}
        <section className="py-28 bg-muted/20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-secondary font-semibold text-sm tracking-wider uppercase">
                Agenda Inteligente
              </motion.span>
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                Agenda de penhoras com<br />mapa de direcionamento
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Visualize todas as suas diligências em um calendário organizado e acesse o mapa com a rota até o endereço — diretamente do celular, antes de sair para campo.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <AgendaMockup />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <MapMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FEATURES 5 + 6: Nuvem + Multiplataforma ──────────────────────── */}
        <section className="py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Seus dados sempre seguros,<br />onde você estiver
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo centralizado na nuvem com segurança de nível empresarial e acessível de qualquer dispositivo.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Cloud security card */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-white overflow-hidden relative"
              >
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -right-4 top-8 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Nuvem segura</h3>
                  <p className="text-white/95 mb-6 text-sm leading-relaxed">
                    Todos os processos, fotos e documentos criptografados e armazenados com segurança. Nunca mais perca um auto ou foto de diligência.
                  </p>
                  <div className="space-y-2.5">
                    {['Criptografia de ponta a ponta', 'Backup automático diário', 'Acesso por autenticação segura', 'Dados nunca compartilhados'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white">
                        <div className="w-4 h-4 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-2.5 w-2.5 text-secondary" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Multi-device card */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="bg-muted/40 rounded-3xl p-8 border border-border overflow-hidden relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <Smartphone className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Computador e celular</h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Interface responsiva que funciona perfeitamente no computador do escritório e no celular durante a diligência — tudo sincronizado em tempo real.
                </p>

                {/* Device mockup */}
                <div className="flex items-end gap-4 justify-center">
                  {/* Desktop */}
                  <div className="flex-1">
                    <div className="bg-white rounded-lg border border-border shadow-md overflow-hidden">
                      <div className="bg-muted px-2 py-1.5 flex items-center gap-1 border-b border-border">
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        </div>
                        <div className="flex-1 bg-white/70 rounded text-[7px] text-center text-muted-foreground ml-1 px-1">penhora.app.br</div>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="h-2 bg-primary/10 rounded w-full" />
                        <div className="grid grid-cols-3 gap-1">
                          {[1,2,3].map(i => <div key={i} className="h-5 bg-muted rounded" />)}
                        </div>
                        <div className="h-2 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-2 w-0.5 bg-border mx-auto" />
                    <div className="h-1.5 bg-border rounded mx-auto" style={{ width: '50%' }} />
                  </div>

                  {/* Phone */}
                  <div className="w-16">
                    <div className="bg-gray-900 rounded-2xl p-1 border-2 border-gray-700 shadow-md">
                      <div className="bg-black rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-b from-primary/90 to-primary p-2" style={{ minHeight: 90 }}>
                          <div className="h-1.5 bg-white/20 rounded mb-1" />
                          <div className="grid grid-cols-2 gap-1 mb-1">
                            <div className="h-4 bg-white/10 rounded" />
                            <div className="h-4 bg-white/10 rounded" />
                          </div>
                          <div className="h-2 bg-white/10 rounded" />
                          <div className="h-2 bg-white/10 rounded mt-1 w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-xs text-muted-foreground">Sincronizado em tempo real entre dispositivos</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FEATURE 7: Produtividade 70% ──────────────────────────────────── */}
        <section className="py-24 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30">
                    <Zap className="h-4 w-4 mr-2" /> Ganho real de produtividade
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                    <span className="text-accent">70%</span> menos tempo<br />em cada penhora
                  </h2>
                  <p className="text-xl text-white/90 max-w-2xl mx-auto">
                    Elimine o preenchimento manual, a digitação de descrições e a formatação de documentos. O que levava horas agora leva minutos.
                  </p>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Before */}
                <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Antes do Penhora.app</div>
                      <div className="text-white/70 text-xs">Processo manual e demorado</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { task: 'Fotografar e transferir fotos', time: '15 min' },
                      { task: 'Descrever cada bem manualmente', time: '30 min' },
                      { task: 'Digitar dados no documento', time: '20 min' },
                      { task: 'Formatar e revisar o auto', time: '25 min' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/90 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {t.task}
                        </div>
                        <span className="text-red-400 text-sm font-bold shrink-0 ml-2">{t.time}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="text-white font-semibold">Total por diligência</span>
                      <span className="text-red-400 font-bold text-lg">~90 min</span>
                    </div>
                  </div>
                </motion.div>

                {/* After */}
                <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Com o Penhora.app</div>
                      <div className="text-secondary text-xs">IA + automação integradas</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { task: 'Fotografar o bem (IA preenche tudo)', time: '1 min' },
                      { task: 'Escanear código de barras (automático)', time: '30 s' },
                      { task: 'Revisar campos preenchidos pela IA', time: '2 min' },
                      { task: 'Gerar o auto em PDF (1 clique)', time: '5 s' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/90 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                          {t.task}
                        </div>
                        <span className="text-secondary text-sm font-bold shrink-0 ml-2">{t.time}</span>
                      </div>
                    ))}
                    <div className="border-t border-secondary/20 pt-3 flex justify-between items-center">
                      <span className="text-white font-semibold">Total por diligência</span>
                      <span className="text-secondary font-bold text-lg">~5 min</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-primary mb-4">Como funciona</h2>
              <p className="text-lg text-muted-foreground">Do início ao auto assinado em minutos</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 relative max-w-3xl mx-auto">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-muted z-0" />
              {[
                { step: '01', title: 'Cadastre o Processo', desc: 'Insira os dados básicos do processo e o devedor em segundos.' },
                { step: '02', title: 'Fotografe e Escaneie', desc: 'A IA identifica os bens pelas fotos e o código de barras preenche automaticamente.' },
                { step: '03', title: 'Gere o Documento', desc: 'Clique em gerar e o auto em PDF sai pronto para assinar.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative z-10 text-center"
                >
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-secondary/25 flex items-center justify-center mx-auto mb-6 shadow-md">
                    <span className="text-3xl font-bold text-secondary">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm px-2 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="py-24 bg-gradient-to-br from-primary to-primary/90 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#085454_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Pronto para transformar suas penhoras?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Cadastre-se agora e comece a usar IA para identificar bens, gerar autos automaticamente e economizar horas em cada diligência.
              </p>
              <Button size="lg" asChild className="bg-accent text-primary hover:bg-accent/90 font-bold px-10 h-14 text-lg shadow-lg">
                <Link to="/signup">Começar Gratuitamente</Link>
              </Button>
              <p className="mt-6 text-sm text-gray-400">Acesso completo e ilimitado · Sem cartão de crédito</p>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
};

export default Home;
