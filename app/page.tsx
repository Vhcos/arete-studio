'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities, @typescript-eslint/no-unused-vars */
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Download, Rocket, Settings, Sparkles } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { CSSProperties } from "react";
// ✅ ahora (funciona con tu estructura):
import type { StandardReport } from './types/report';
import { buildNonAIReport } from './lib/nonAI-report';
import type { AiPlan, CompetitiveRow, RegulationRow } from './types/plan';
import type { ChartPoint } from './types/report';


export function sanitizeTxt(s: string, max = 120) {
  return String(s ?? '')
    .replace(/[<>]/g, '')          // quita tags
    .replace(/\r?\n/g, ' ')         // saltos de línea -> espacio
    .replace(/\s{2,}/g, ' ')        // colapsa espacios múltiples
    .trim()
    .slice(0, max);
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeEmail(s: string) {
  // NO validamos aquí: solo limpiamos para que el usuario pueda escribir
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s/g, '')                  // fuera espacios
    .replace(/[^a-z0-9._%+\-@]/gi, '')   // solo chars permitidos
    .slice(0, 120);
}

// úsalo para mostrar el error:
export function isEmailValid(s: string) {
  return emailRe.test(s);
}


// === Renombres SOLO para UI (no toques las claves internas del cálculo) ===
const DISPLAY_RENAME: Record<string, string> = {
  'MC unitario': 'Margen de contribución',
  'Clientes P.E': 'Clientes en equilibrio',
  'Ventas P.E': 'Ventas en equilibrio',
  'Runway estimado': 'Autonomía de caja',
  'SAM12': 'Tamaño de mercado anual (SAM)',
  'CAC': 'Costo de marketing por cliente',
};

// (Opcional) renombres de hints / subtítulos si quieres armonizar también los textos de ayuda
const DISPLAY_HINTS: Record<string, string> = {
  'MC unitario': 'Margen de contribución por unidad vendida.',
  'Clientes P.E': 'Clientes mínimos para llegar al punto de equilibrio.',
  'Ventas P.E': 'Ventas mínimas para llegar al punto de equilibrio.',
  'Runway estimado': 'Meses que puedes operar con la caja disponible.',
  'SAM12': 'Tamaño de mercado atendible en 12 meses.',
  'CAC': 'Costo promedio para adquirir un cliente.',
};

function uiTitle(title: string) {
  return DISPLAY_RENAME[title] ?? title;
}
function uiHint(title: string, fallback: string) {
  return DISPLAY_HINTS[title] ?? fallback;
}


/**
 * ARETE (actualizado con UI azul y cambios de copy)
 * • Campos con **acento azul**: bordes y fondos suaves para guiar la vista.
 * • Cambios de etiquetas y ayudas solicitados por el usuario.
 * • LTV ahora usa **frecuencia anual** (veces que compra en 12 meses) × MC unit.
 */

// -------------------- Helpers GLOBALES useState--------------------
function formatCLPLike(s: string) {
  if (s == null) return "";
  s = String(s).replace(/\s+/g, "");
  const hasComma = s.includes(",");
  let intPart = s;
  let fracPart = "";
  if (hasComma) {
    const idx = s.indexOf(",");
    intPart = s.slice(0, idx);
    fracPart = s.slice(idx + 1).replace(/[^0-9]/g, "");
  }
  intPart = intPart.replace(/[^0-9]/g, "");
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasComma ? `${intPart},${fracPart}` : intPart;
}
function parseNumberCL(s: any) {
  if (typeof s === "number") return isNaN(s) ? 0 : s;
  if (typeof s !== "string") return 0;
  const n = parseFloat(s.replace(/\./g, "").replace(/,/g, "."));
  return isNaN(n) ? 0 : n;
}
function clamp(n: number, min = 0, max = 10) { return Math.max(min, Math.min(max, n)); }
function scaleRange(val: number, low: number, high: number) { if (high === low) return 0; const x = (val - low) / (high - low); return Math.max(0, Math.min(1, x)); }
function fmtCL(n:number){ return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n||0); }
function fmtNum(n:number){ return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(n||0); }
function toHSLA(hsl: string, alpha = 0.08){
  const m = /^hsl\(([^)]+)\)$/.exec(hsl?.trim()||'');
  return m ? `hsla(${m[1]} / ${alpha})` : hsl;
}
function capitalGap(capital: number, acumDeficit: number){
  const gap = Math.round(acumDeficit - capital);
  return { suficiente: gap <= 0, gap: Math.abs(gap) };
}

export default function AreteDemo() {
  const [primaryHue] = useState(215); // azul
  const accent = `hsl(${primaryHue} 90% 45%)`;
  const styleAccent: CSSProperties & Record<'--accent', string> = { '--accent': accent };
  const accentSoft = toHSLA(accent, 0.07);

  // -------------------- Formulario --------------------
  const [idea, setIdea] = useState("");
  const [ventajaTexto, setVentajaTexto] = useState("");
  const [rubro, setRubro] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  // Dinero / conteos
  const [capitalTrabajo, setCapitalTrabajo] = useState("");
  const [gastosFijos, setGastosFijos] = useState("");
  const [ingresosMeta, setIngresosMeta] = useState(""); // promedio 12m
  const [ticket, setTicket] = useState("");
  const [costoUnit, setCostoUnit] = useState("");
  const [cac, setCac] = useState("");
  const [frecuenciaAnual, setFrecuenciaAnual] = useState(6); // veces/año

  // --- NUEVOS estados (deben ir arriba, antes de usarlos) ---
  const [traficoMes, setTraficoMes] = useState('');        // visitas/leads por mes
  const [convPct, setConvPct] = useState('');              // % conversión
  const [marketingMensual, setMarketingMensual] = useState(''); // CLP/mes
  const [costoPct, setCostoPct] = useState('');            // % del precio
  // NUEVOS
  const [ventaAnual, setVentaAnual] = useState('');        // 10) Venta primer año (12m)
  const [inversionInicial, setInversionInicial] = useState(''); // 20) Inversión inicial

  // blandos / cualitativos (0–10)
  const [urgencia, setUrgencia] = useState(5);
  const [accesibilidad, setAccesibilidad] = useState(7);
  const [competencia, setCompetencia] = useState(6);
  const [experiencia, setExperiencia] = useState(5);
  const [pasion, setPasion] = useState(8);
  const [planesAlternativos, setPlanesAlternativos] = useState(6); // antes: riesgoControlado
  const [toleranciaRiesgo, setToleranciaRiesgo] = useState(6);
  const [testeoPrevio, setTesteoPrevio] = useState(5); // antes: traccionCualitativa
  const [redApoyo, setRedApoyo] = useState(5);

  // Supuestos y ajustes
  const [supuestos, setSupuestos] = useState("");
  const [clientesManual, setClientesManual] = useState<string>("");
  const [mesesPE, setMesesPE] = useState<number>(6);
  
  // Supuestos y ajustes IA
  const [aiPlan, setAiPlan] = useState<AiPlan | null>(null);


  // Email
  const [emailSending, setEmailSending] = useState(false);
  type SendOpts = { to?: string; silent?: boolean; reason?: string };


  async function sendReportEmail(args: {
     to?: string;
     reason?: string;
     report?: any;
     aiPlan?: any;
     silent?: boolean;
     user?: { projectName?: string; founderName?: string; email?: string; idea?: string; rubro?: string; ubicacion?: string; };
  }) {
     const res = await fetch('/api/email-report', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(args),
    });
     const j = await res.json();
     if (j.ok) {
       alert(j.to && j.to !== args.to ? 'Enviado (modo test) al correo.' : 'Informe enviado.');
     } else if (j.skipped) {
       alert('Email desactivado (skipped). Revisa variables de entorno.');
     } else {
       alert('No se pudo enviar el email.');
    }
   } 
  
  //Campos: Proyecto, Emprendedor y Email (obligatorio)
  const [projectName, setProjectName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [email, setEmail] = useState('');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailOK = emailRe.test(email);

  const isValidEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

  const canRunAI = useMemo(
   () =>
    isValidEmail(email) &&
    idea.trim().length >= 8 &&        // evita “Hola”
    rubro.trim().length > 0 &&
    ubicacion.trim().length > 0,
  [email, idea, rubro, ubicacion]
 );
   

   // Derivadas desde ventaAnual (si viene) o desde tu campo mensual legacy:
    const ventaAnualN      = parseNumberCL(ventaAnual);
    const ventaMensualCalc = ventaAnualN > 0 ? ventaAnualN / 12 : parseNumberCL(ingresosMeta);

  // -------------------- Cálculo --------------------
  const baseOut = useMemo(() => {
    const input = {
      idea, ventajaTexto, rubro, ubicacion,
      capitalTrabajo: parseNumberCL(capitalTrabajo),
      gastosFijos: parseNumberCL(gastosFijos),
      ingresosMeta: ventaMensualCalc,
      ticket: parseNumberCL(ticket), costoUnit: parseNumberCL(costoUnit),
      cac: parseNumberCL(cac), frecuenciaAnual: parseNumberCL(frecuenciaAnual),
      urgencia: parseNumberCL(urgencia), accesibilidad: parseNumberCL(accesibilidad), competencia: parseNumberCL(competencia),
      experiencia: parseNumberCL(experiencia), pasion: parseNumberCL(pasion), planesAlternativos: parseNumberCL(planesAlternativos), toleranciaRiesgo: parseNumberCL(toleranciaRiesgo),
      testeoPrevio: parseNumberCL(testeoPrevio), redApoyo: parseNumberCL(redApoyo),
      supuestos,
      clientesManual: parseNumberCL(clientesManual || 0),
      mesesPE,
      traficoMes:        parseNumberCL(traficoMes),
      convPct:           parseNumberCL(convPct),           // en %
      marketingMensual:  parseNumberCL(marketingMensual),  // CLP
      costoPct:          parseNumberCL(costoPct),          // en %
      inversionInicial: parseNumberCL(inversionInicial),
    } as const;
    return computeScores(input);
  }, [idea, ventajaTexto, rubro, ubicacion, capitalTrabajo, gastosFijos, ingresosMeta, ticket, costoUnit, cac, frecuenciaAnual, urgencia, accesibilidad, competencia, experiencia, pasion, planesAlternativos, toleranciaRiesgo, testeoPrevio, redApoyo, supuestos, clientesManual, mesesPE]);
  // ---- Informe SIN IA + IA ----
   const nonAIReport = useMemo(
     () => buildNonAIReport(baseOut.report.input, baseOut.report.meta),
     [baseOut]
   );
   const [aiReport, setAiReport] = useState<StandardReport | null>(null);


  const [iaData, setIaData] = useState<any>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const outputs = useMemo(() => applyIA(baseOut, iaData), [baseOut, iaData]);
  const scoreColor = colorFor(outputs.totalScore);
  const chartDataUI: ChartPoint[] = useMemo(
  () =>
    outputs.chartData.map((d: ChartPoint) => ({
      ...d,
      name: uiTitle(String(d.name)), // renombra para la UI
    })),
  [outputs.chartData]
);

  const TooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload || {};
    const clientes12 = d.clientes_12m || 0;
    const clientesUsr = d.clientes_usuario || 0;
    const deficit = d.deficit || 0;
    return (
      <div className="rounded-md border bg-white p-2 text-xs">
        <div className="font-medium">Mes {String(label).replace('M','')}</div>
        <div>12m P.E.: <strong>{fmtNum(clientes12)}</strong> clientes</div>
        <div>{mesesPE}m P.E.: <strong>{fmtNum(clientesUsr)}</strong> clientes</div>
        <div>Déficit: <strong>${fmtCL(deficit)}</strong></div>
      </div>
    );
  };

  async function handleEvaluateAI() {
   setIaLoading(true);
   try {
     const input = baseOut.report.input;
     const scores = {
       total: baseOut.totalScore,
       byKey: Object.fromEntries(baseOut.items.map((it: any) => [it.key, it.score])),
    };

     const res = await fetch('/api/evaluate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ input, scores }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    // guarda informe IA y dispara envío interno
    setAiReport(data.standardReport ?? null);

    // ==== Extra: pedir plan competitivo / regulatorio a la IA ====
    try {
     const resPlan = await fetch('/api/plan', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         input,                    // el mismo input que ya envías a /api/evaluate
         meta: { rubro, ubicacion, idea }, // contexto útil
       }),
     });

     const dataPlan = await resPlan.json();
     if (dataPlan?.ok && dataPlan.plan) {
       setAiPlan(dataPlan.plan);
     } else {
       console.warn('Plan IA no disponible:', dataPlan?.error || dataPlan);
     }

   } catch (e) {
     console.error('No se pudo obtener plan IA:', e);
   }

    // envía el email silencioso (si está configurado)
    void sendReportEmail({ silent: true, reason: 'evaluate-ia' });
    // guarda data IA para cálculos / visualizaciones extra
    // si sigues usando la fusión con IA
    setIaData(data);
  } catch (err) {
    console.error(err);
    alert('No se pudo usar IA. Revisa /api/evaluate y la API key.');
  } finally {
    setIaLoading(false);
  }
}

//----------------------FIN DE LOS USESTATE Y FUNCIONES----------------------


  // -------------------- Render --------------------
  return (
    <div className="min-h-screen p-6" style={styleAccent}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl shadow-sm" style={{ background: accent }}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
        <div className="flex items-start justify-between gap-4">
          </div>

            <h1 className="text-2xl font-bold tracking-tight">
             <span className="hidden sm:inline">Areté · Evalúa tu Idea de Negocio con IA</span>
             <span className="sm:hidden">Areté · Evalúa tu Idea de Negocio</span>
           </h1>
           <p className="text-sm text-muted-foreground -mt-1">
            Cumple tu propósito de la mejor manera
           </p>

          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
           <Button
             variant="outline"
             className="hidden sm:inline-flex"
             onClick={() => {
               const s = nonAIReport.sections;
               const txt = [
                 `Rubro: ${s.industryBrief}`,
                 `Competencia: ${s.competitionLocal}`,
                 `FODA + Mercado: ${s.swotAndMarket}`,
                 `Veredicto: ${s.finalVerdict}`,
                 `Score: ${nonAIReport.ranking.score}/100`
               ].join('\n');
               navigator.clipboard.writeText(txt);
               alert('Informe copiado al portapapeles.');
             }}
           >
             Copiar informe
          <div className="flex flex-wrap gap-2 sm:justify-end"></div>  
           </Button>
            <Button
               onClick={() =>
                  sendReportEmail({
                   to: email,               // correo del usuario
                   reason: 'user-asked',
                   report: aiReport ?? nonAIReport, // prioriza IA si ya está
                   aiPlan,                  // si ya generaste plan 100 palabras
                   user: { projectName, founderName, email, idea, rubro, ubicacion },
                })
               }
               disabled={!emailOK || emailSending}
            >
              Informe a mi email
            </Button>
            <Button onClick={handleEvaluateAI} disabled={!canRunAI || iaLoading}>Evaluar con IA</Button>
            <Button onClick={() => downloadJSON(outputs.report, `arete_result_${Date.now()}.json`)}><Download className="mr-2 h-4 w-4" /> Descargar Informe</Button>
          </div>
        </div>

        <Tabs defaultValue="form">
          <TabsList className="mt-2 w-full grid grid-cols-3 md:w-auto">
            <TabsTrigger value="form"><Settings className="h-4 w-4 mr-2" />Formulario</TabsTrigger>
            <TabsTrigger value="board"><Rocket className="h-4 w-4 mr-2" />Tablero</TabsTrigger>
            <TabsTrigger value="explain"><Sparkles className="h-4 w-4 mr-2" />Informe</TabsTrigger>
          </TabsList>

          {/* FORM */}
          <TabsContent value="form">
            <Card className="border-none shadow-sm">
                 <div>
                   <Label>Nombre del proyecto</Label>
                  <Input
                   value={projectName}
                   onChange={(e) => setProjectName(e.target.value)}                // crudo
                   onBlur={(e) => setProjectName(sanitizeTxt(e.target.value, 80))} // limpia al salir
                   placeholder="p. ej. Joyería de Autor"
                 />

                  <Label>Nombre del Emprendedor/a</Label>
                  <Input
                   value={founderName}
                   onChange={(e) => setFounderName(e.target.value)}                // crudo
                   onBlur={(e) => setFounderName(sanitizeTxt(e.target.value, 80))} // limpia al salir
                   placeholder="p. ej. Carola Plaza"
                 />
              
                  <Label>Email de Notificaciones</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                    onBlur={(e) => setEmail(sanitizeEmail(e.target.value))}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    inputMode="email"
                    spellCheck={false}
                    autoCapitalize="off"
                  />
                   {!emailOK && email.length > 0 && (
                     <p className="text-xs text-destructive mt-1">Escribe un email válido.</p>
                   )}
                </div>
            <CardHeader><CardTitle>Completa los cuadros esto te orientara con lo necesario para tu idea</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">   </div>
                <div className="md:col-span-3 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Idea (1–2 frases)</Label>
                  <Textarea rows={3} value={idea} onChange={e => setIdea(e.target.value)} className="border-2" style={{ borderColor: accent }} />
                </div>
                <div className="md:col-span-3 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Tu ventaja diferenciadora (texto)</Label>
                  <Textarea rows={3} value={ventajaTexto} onChange={e => setVentajaTexto(e.target.value)} className="border-2" style={{ borderColor: accent }} placeholder="¿Qué harás distinto o especial? tecnología, experiencia, costos, tiempo, marca, red, datos, etc." />
                  <p className="text-xs text-muted-foreground">La IA asignará una <strong>nota 1–10</strong> a esta ventaja al presionar "Evaluar con IA". Sin IA, usamos una heurística local.</p>
                </div>
                <div className="md:col-span-3 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Indica oportunidades y amenazas que pueden afectar tu negocio</Label>
                  <Textarea rows={3} value={supuestos} onChange={e => setSupuestos(e.target.value)} className="border-2" style={{ borderColor: accent }} />
                </div>
                <div className="md:col-span-2 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Rubro</Label>
                  <Input value={rubro} onChange={e => setRubro(e.target.value)} className="border-2" style={{ borderColor: accent }} placeholder="restaurant / almacén / asesorías / software / otro" />
                </div>
                <div className="md:col-span-1 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Ubicación</Label>
                  <Input value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="border-2" style={{ borderColor: accent }} placeholder="Comuna, Región, País" />
                </div>

                <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Inversión inicial ($)</Label> {/* 20) usuario */}
                  <Input
                    type="text" inputMode="numeric"
                    value={inversionInicial}
                    onChange={(e) => setInversionInicial(formatCLPLike(e.target.value))}
                    className="border-2" style={{ borderColor: accent }}/>
                 <p className="text-xs text-muted-foreground">
                     Ayuda: “Corresponde a todos los gastos que debes hacer 
                     antes de abrir tu negocio a los clientes “
                   </p>
               </div>
               <div className="md:col-span-2 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                 <Label>Capital de trabajo disponible… ($)</Label>
                 <Input
                    type="text" inputMode="numeric"
                    value={capitalTrabajo}
                    onChange={(e) => setCapitalTrabajo(formatCLPLike(e.target.value))}
                    className="border-2" style={{ borderColor: accent }}/>
                 <p className="text-xs text-muted-foreground">
                     "Ayuda: Corresponde al capital disponible que tienes para la puesta en marcha de tu negocio 
                     después de tu inversión inicial, o bien el capital disponible que cuentas hasta que tu negocio
                     llegue al punto de equilibrio.”
                   </p>
               </div>

                {/* === Volúmenes y ticket === */}
               <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                 <Label>Venta primer año (12 primeros meses) – $</Label> {/* 10) usuario */}
                 <Input
                   type="text" inputMode="numeric"
                   value={ventaAnual}
                   onChange={(e) => setVentaAnual(formatCLPLike(e.target.value))}
                   className="border-2" style={{ borderColor: accent }}
                 />
               </div>

               <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                 <Label>Ticket / tarifa promedio por cliente – $</Label> {/* 11) usuario */}
                 <Input
                   type="text" inputMode="numeric"
                   value={ticket}
                   onChange={(e) => setTicket(formatCLPLike(e.target.value))}
                   className="border-2" style={{ borderColor: accent }}
                 />
               </div>
                 
                 <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                <Label className="mt-2">Anota % de  Conversión de visitas se convierte en clientes: </Label>
                <Input type="number" step="0.1"
                  value={convPct}
                  onChange={e => setConvPct(e.target.value)}
                  className="border-2" style={{ borderColor: accent }} />
                <p className="text-xs text-muted-foreground">
                     Ayuda: “Porcentaje del tráfico mensual que compra. Si no tienes datos, 
                      usa 1% a 4 % (e-commerce), 3% a 10 % (tienda), 10% a 30 % (servicios).”
                   </p>
                </div>

               {(() => {
                 const vAnual   = parseNumberCL(ventaAnual);
                 const t        = parseNumberCL(ticket);
                 const ventaMensual      = (vAnual > 0 ? vAnual / 12 : 0);        // 13) calculado
                 const clientesAnuales   = (t > 0 ? vAnual / t : 0);              // 12) calculado
                 const clientesMensuales = (t > 0 ? clientesAnuales / 12 : 0);    // 14) calculado

                 return (
                   <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border-2 p-3" style={{ borderColor: accent, background: 'white' }}>
                       <div className="text-xs text-muted-foreground">Venta mensual (calculado)</div>
                       <div className="font-semibold">${fmtCL(ventaMensual)}</div>
                     </div>
                     <div className="rounded-xl border-2 p-3" style={{ borderColor: accent, background: 'white' }}>
                       <div className="text-xs text-muted-foreground">Clientes anuales (calculado)</div>
                       <div className="font-semibold">{fmtNum(clientesAnuales)}</div>
                     </div>
                     <div className="rounded-xl border-2 p-3" style={{ borderColor: accent, background: 'white' }}>
                       <div className="text-xs text-muted-foreground">Clientes mensuales (calculado)</div>
                       <div className="font-semibold">{fmtNum(clientesMensuales)}</div>
                       <div className="text-xs mt-1 text-muted-foreground">
                         Puedes ajustar manualmente:
                       </div>
                       <Input
                         type="text" inputMode="numeric"
                         value={clientesManual}
                         onChange={(e) => setClientesManual(formatCLPLike(e.target.value))}
                         placeholder="p.ej. 120"
                         className="mt-1"
                      />
                   </div>
                 </div>
                );
              })()}
                 {/* GASTOS Y COSTOS VARIABLES */}

                <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Gastos fijos mensuales ($)</Label>
                  <Input type="text" inputMode="numeric" value={gastosFijos} onChange={e => setGastosFijos(formatCLPLike(e.target.value))} className="border-2" style={{ borderColor: accent }} />
                </div>
                <div className="space-y-2 rounded-xl border-2 p-3"
                    style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Costo variable (% del precio, opcional)</Label>
                  <Input type="number" step="0.1"
                         value={costoPct}
                         onChange={e => setCostoPct(e.target.value)}
                         className="border-2" style={{ borderColor: accent }} />
                  <p className="text-xs text-muted-foreground">
                     Si no conoces el costo unitario exacto, ingresa un % del precio y lo calculamos automáticamente.
                   </p>
                </div>
                <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Costo variable unitario ($)</Label>
                  <Input type="text" inputMode="numeric" value={costoUnit} onChange={e => setCostoUnit(formatCLPLike(e.target.value))} className="border-2" style={{ borderColor: accent }} />
                </div>
                {(() => {
                  const price = parseNumberCL(ticket);
                  const costU = parseNumberCL(costoUnit);
                  const pct   = parseNumberCL(costoPct);
                  const costoDesdePct = (!costU || costU === 0) && pct > 0 ? price * (pct/100) : 0;
                  const costoUsado    = (costU && costU > 0) ? costU : costoDesdePct;
                  const mcUnitario    = Math.max(0, price - costoUsado); // 17) MC unitario

                  const gfMes   = parseNumberCL(gastosFijos);
                  const gfAnual = gfMes * 12;                              // 19) GF año (12m)

                 return (
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border-2 p-3" style={{ borderColor: accent, background: 'white' }}>
                        <div className="text-xs text-muted-foreground">Margen de contribución unitario (calculado)</div>
                        <div className="font-semibold">${fmtCL(mcUnitario)}</div>
                        <div className="text-[15px] text-muted-foreground mt-1">
                        Se calcula como <b>Ticket − Costo Variable</b>. Si no hay costo unitario, usa % del precio.
                        </div>
                     </div>
                     <div className="rounded-xl border-2 p-3" style={{ borderColor: accent, background: 'white' }}>
                       <div className="text-xs text-muted-foreground">Gastos fijos año (12meses)</div>
                        <div className="font-semibold">${fmtCL(gfAnual)}</div>
                     </div>
                   </div>
                 );
                })()}
                
                {/* CANALES & MARKETING (nuevo) */}
                <div className="md:col-span-3 space-y-2 rounded-xl border-2 p-3"
                 style={{ borderColor: accent, background: accentSoft }}>
                <Label>Tráfico mensual (visitas / leads): Personas únicas que llegan a tu web, tienda o canal y consultan en un mes</Label>
                <Input type="text" inputMode="numeric"
                  value={traficoMes}
                  onChange={e => setTraficoMes(formatCLPLike(e.target.value))}
                  className="border-2" style={{ borderColor: accent }} />
                  
                <Label className="mt-2">Gasto de marketing mensual – CLP</Label>
                <Input type="text" inputMode="numeric"
                  value={marketingMensual}
                  onChange={e => setMarketingMensual(formatCLPLike(e.target.value))}
                  className="border-2" style={{ borderColor: accent }} />

                {/* Derivados visibles (solo referencia, no editables) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                 <div className="rounded-md border bg-white p-2">
                   <div className="text-muted-foreground">Clientes estimados por marketing</div>
                   <div className="font-semibold">
                     {fmtNum((parseNumberCL(traficoMes) * (parseNumberCL(convPct)/100)) || 0)}
                   </div>
                 </div>
                 <div className="rounded-md border bg-white p-2">
                   <div className="text-muted-foreground">CAC estimado</div>
                   <div className="font-semibold">
                     {(() => {
                       const traf = parseNumberCL(traficoMes);
                       const conv = (parseNumberCL(convPct) / 100);
                       const cli  = traf * conv;
                       const mkt  = parseNumberCL(marketingMensual);
                       return cli > 0 ? `$${fmtCL(Math.round(mkt/cli))}` : '—';
                     })()}
                   </div>
                   <div className="text-xs text-muted-foreground">Se usa si no ingresas un CAC manual.</div>
                 </div>
                 <div className="rounded-md border bg-white p-2">
                   <div className="text-muted-foreground">LTV (aprox)</div>
                   <div className="font-semibold">
                     {(() => {
                       const price = parseNumberCL(ticket);
                       const cost  = parseNumberCL(costoUnit);
                       const mc    = Math.max(0, price - cost);
                       const freq  = parseNumberCL(frecuenciaAnual) || 6;
                       return `$${fmtCL(Math.round(mc * freq))}`;
                     })()}
                    </div>
                  </div>
                 </div>
                </div>

                      {/* CAC, Frecuencia, Riesgos */}
                <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Frecuencia de compra (anual)</Label>
                  <Input type="number" value={frecuenciaAnual} onChange={e => setFrecuenciaAnual(parseFloat(e.target.value) || 0)} className="border-2" style={{ borderColor: accent }} />
                  <p className="text-xs text-muted-foreground">Frecuencia = cuántas veces en un año cliente repite compras/servicio (para calcular LTV).</p>
                </div>
                
                
                <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>CAC (costo de adquisición por cliente, CLP)</Label>
                  <Input type="text" inputMode="numeric" value={cac} onChange={e => setCac(formatCLPLike(e.target.value))} className="border-2" style={{ borderColor: accent }} />
                  <p className="text-xs text-muted-foreground">CAC = cuánto te cuesta, en promedio, conseguir un cliente en campañas de marketing.</p>
                </div>

                <div className="md:col-span-1 space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
                  <Label>Indica tu estimación de llegada a punto de equilibrio (meses)</Label>
                  <select className="w-full border-2 rounded-md px-3 py-2" value={mesesPE} onChange={e => setMesesPE(parseInt(e.target.value))} style={{ borderColor: accent }}>
                    {[3,6,9,12].map(m => <option key={m} value={m}>{m} meses</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground">Se usa para la curva "{mesesPE}m P.E.". La ruta 12m usa ~8% de avance mensual.</p>
                </div>

                <div className="md:col-span-3 rounded-xl border-2 p-4" style={{ borderColor: accent, background: accentSoft }}>
                  <div className="font-medium">Califica de <strong>0 a 10</strong> cada ítem</div>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Tu idea resuelve un problema</strong>: 0 = poco, 10 = mucho.</li>
                    <li><strong>Competencia</strong>: cantidad/calidad de competidores (alto = mucha competencia).</li>
                    <li><strong>TU tolerancia al riesgo</strong>: cuánta volatilidad soportas.</li>
                    <li><strong>Testeo previo</strong>: entrevistas, lista de espera, reuniones, respuestas positivas, seguidores.</li>
                    <li><strong>Red de apoyo</strong>: mentores, socios, partners, contactos.</li>
                    <li><strong>Planes alternativos a las dificultades</strong>: mitigaciones listas si algo sale mal.</li>
                  </ul>
                </div>

                {/* Sliders */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <SliderField label="Tu idea resuelve un problema (0–10)" value={urgencia} onChange={setUrgencia} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="Accesibilidad al cliente (0–10)" value={accesibilidad} onChange={setAccesibilidad} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="Competencia (cantidad/calidad, 0–10 = alta)" value={competencia} onChange={setCompetencia} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="TU experiencia en el rubro (0–10)" value={experiencia} onChange={setExperiencia} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="TU pasión/compromiso con la idea (0–10)" value={pasion} onChange={setPasion} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="Planes alternativos a las dificultades (0–10)" value={planesAlternativos} onChange={setPlanesAlternativos} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="TU tolerancia al riesgo (0–10)" value={toleranciaRiesgo} onChange={setToleranciaRiesgo} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="Testeo previo (0–10)" value={testeoPrevio} onChange={setTesteoPrevio} accent={accent} accentSoft={accentSoft} />
                  <SliderField label="Red de apoyo (mentores/socios/contactos, 0–10)" value={redApoyo} onChange={setRedApoyo} accent={accent} accentSoft={accentSoft} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOARD */}
          <TabsContent value="board">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tablero de decisión</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={badgeClass(scoreColor)}>{Math.round(outputs.totalScore)} / 100</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="no-print mb-3">
                   <Button onClick={() => printOnly('tablero')}>Imprimir tablero</Button>
                  </div>
                  <section id="tablero" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 -mt-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="rounded-md px-2 py-0.5 bg-red-600 text-white">ROJO &lt; 40</span>
                    <span className="rounded-md px-2 py-0.5 bg-amber-500 text-white">ÁMBAR 40–69</span>
                    <span className="rounded-md px-2 py-0.5 bg-green-600 text-white">VERDE ≥ 70</span>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadarChart data={chartDataUI} outerRadius="80%">
                         <PolarGrid />
                         <PolarAngleAxis dataKey="name" />
                         <PolarRadiusAxis angle={30} domain={[0, 10]} />
                         <Radar name="Puntaje" dataKey="value" stroke={accent} fill={accent} fillOpacity={0.35} />
                       </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {outputs.items.map(
                     (it: { title: string; hint?: string; score: number; reason: string }, idx: number) => (
                      <div key={idx} className="rounded-xl border p-3 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">{uiTitle(String(it.title))}</div>
                            {it.hint && (
                               <div className="text-xs text-muted-foreground">
                                  {uiHint(String(it.title), String(it.hint))}
                               </div>
                            )}        
                          <Badge className={badgeClass(colorFor(it.score * 10))}>{it.score.toFixed(1)}/10</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{it.reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border-2 p-4" style={{ borderColor: accent, background: accentSoft }}>
                    <div className="font-medium mb-2">Curva hacia el punto de equilibrio (P.E.)</div>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={outputs.peCurve.data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis yAxisId="left" tickFormatter={(v)=>`${v}%`} domain={[0, 110]} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(v)=>`$${new Intl.NumberFormat('es-CL').format(v)}`} />
                          <Tooltip content={<TooltipContent />} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="%PE_12m" name="12m P.E." strokeDasharray="4 4" dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="%PE_usuario" name={`${mesesPE}m P.E.`} dot={false} />
                          <Bar yAxisId="right" dataKey="deficit" name="Déficit mensual" opacity={0.5} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Líneas: <strong>12m P.E.</strong> (ruta en 12 meses) y <strong>{mesesPE}m P.E.</strong> (tu plan). Barra = <strong>déficit mensual</strong> (MC total − Gastos fijos).
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border-2 p-4" style={{ borderColor: accent, background: accentSoft }}>
                    <div className="text-sm text-muted-foreground">Punto de equilibrio</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Margen de Contribución Unitario</div>
                        <div className="font-semibold">${fmtCL(outputs.pe.mcUnit)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Clientes en equilibrio</div>
                        <div className="font-semibold">{Number.isFinite(outputs.pe.clientsPE)? fmtNum(outputs.pe.clientsPE) : '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ventas en equilibrio</div>
                        <div className="font-semibold">${fmtCL(outputs.pe.ventasPE)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Autonomía de caja</div>
                        <div className="font-semibold">{Number.isFinite(outputs.pe.runwayMeses)? `${outputs.pe.runwayMeses.toFixed(1)} meses` : '—'}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Margen de contribución = Ventas − Costos de venta</strong>.<br/>
                      <strong>Autonomía de caja</strong> = Meses sin venta para cubrir gastos fijos con capital de trabajo.
                    </div>
                    <div className="mt-2 text-sm">
                      {(() => {
                        const cap = outputs.report.input.capitalTrabajo || 0;
                        const acu = outputs.peCurve.acumDeficitUsuario || 0;
                        const cg = capitalGap(cap, acu);
                        return (
                          <>
                            Capital actual: <strong>${fmtCL(cap)}</strong> · Déficit acumulado hasta P.E. (plan {mesesPE}m): <strong>${fmtCL(acu)}</strong><br/>
                            {cg.suficiente
                              ? <span className="text-green-700 font-medium">✔ Capital alcanza (superávit ${fmtCL(cg.gap)})</span>
                              : <span className="text-red-700 font-medium">✖ Falta capital: ${fmtCL(cg.gap)}</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">Veredicto</div>
                    <div className="text-xl font-bold mt-1" style={{ color: accent }}>{outputs.verdict.title}</div>
                    <p className="text-sm mt-1">{outputs.verdict.subtitle}</p>
                    <ul className="list-disc text-sm pl-5 mt-2 space-y-1">
                      {(outputs.verdict?.actions ?? []).map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                    ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">Top riesgos</div>
                    <ul className="list-disc text-sm pl-5 mt-2 space-y-1">
                      {(outputs.topRisks ?? []).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                     ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">Experimentos sugeridos (2 semanas)</div>
                    <ul className="list-disc text-sm pl-5 mt-2 space-y-1">
                      {(outputs.experiments ?? []).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
               </section> 
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORT */}
          <TabsContent value="explain">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Informe</CardTitle></CardHeader>
              <CardContent>
               <div className="no-print mb-4">
                 <Button
                   onClick={() => {
                     printOnly('informe');
                     void sendReportEmail({ silent: true, reason: 'print-informe' });
                   }}
                   disabled={emailSending}
                 >
                   Imprimir informe
                 </Button>
               </div>
               <div className="rounded-md border bg-white p-4 text-sm">
                  <div><span className="font-semibold">Proyecto:</span> {projectName || '—'}</div>
                  <div><span className="font-semibold">Emprendedor/a:</span> {founderName || '—'}</div>
                  <div><span className="font-semibold">Email:</span> {email || '—'}</div>
               </div>
               
               <div id="informe" className="space-y-6">
                 <div>
                   <h2 className="text-lg font-bold">Informe (SIN IA)</h2>
                   <ReportView report={nonAIReport} />
                 </div>

                 {aiReport && (
                   <>
                   <div>
                     <h2 className="text-lg font-bold">Evaluación (IA)</h2>
                      <ReportView report={aiReport} />
                   </div>

                    {/* Plan 100 palabras */}
                    {aiPlan && (
                     <>
                       <div className="mt-6 space-y-4">
                         <h3 className="text-lg font-bold mt-6">Plan (100 palabras)</h3>
                         <div className="rounded-md border bg-white p-4 text-sm leading-relaxed avoid-break">
                           {aiPlan.plan100}
                         </div>
                       </div>

                       {/* Botón copiar plan – fuera de impresión */}
                       <div className="no-print mt-3">
                         <button
                           className="mt-2 rounded-md border px-3 py-1 text-sm"
                           onClick={() => {
                             navigator.clipboard.writeText(aiPlan.plan100);
                             alert('Plan copiado.');
                           }}
                         >
                         Copiar plan
                       </button>
                     </div>

                    {/* Tablas IA */}
                   <h3 className="text-lg font-bold mt-6">Mapa competitivo</h3>
                   <div className="avoid-break">
                     <CompetitiveTable rows={aiPlan.competencia} />
                   </div>

                   <h3 className="text-lg font-bold mt-6">Checklist regulatorio</h3>
                   <div className="avoid-break">
                      <RegulationTable rows={aiPlan.regulacion} />
                   </div>
                 </>
               )}
            </>
      )}
               </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    
  );
}
// --------------------Render del bloque nuevo en el Informe (IA)--------------------

function CompetitiveTable({ rows }: { rows: CompetitiveRow[] }) {
  if (!rows?.length) return <p className="text-sm text-muted-foreground">Sin datos.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-2">Empresa</th>
            <th className="p-2">Ciudad/País</th>
            <th className="p-2">Segmento</th>
            <th className="p-2">Propuesta</th>
            <th className="p-2">Precio (ARPU)</th>
            <th className="p-2">Canal</th>
            <th className="p-2">Switching</th>
            <th className="p-2">Moat</th>
            <th className="p-2">Evidencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.empresa}</td>
              <td className="p-2">{r.ciudad}</td>
              <td className="p-2">{r.segmento}</td>
              <td className="p-2">{r.propuesta}</td>
              <td className="p-2">{r.precio}</td>
              <td className="p-2">{r.canal}</td>
              <td className="p-2">{r.switching_cost}</td>
              <td className="p-2">{r.moat}</td>
              <td className="p-2">{r.evidencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegulationTable({ rows }: { rows: RegulationRow[] }) {
  if (!rows?.length) return <p className="text-sm text-muted-foreground">Sin datos.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-2">Área</th>
            <th className="p-2">Qué aplica</th>
            <th className="p-2">Requisito</th>
            <th className="p-2">Plazo</th>
            <th className="p-2">Riesgo</th>
            <th className="p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.area}</td>
              <td className="p-2">{r.que_aplica}</td>
              <td className="p-2">{r.requisito}</td>
              <td className="p-2">{r.plazo}</td>
              <td className="p-2">{r.riesgo}</td>
              <td className="p-2">{r.accion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// -------------------- Componentes UI --------------------


function SliderField({ label, value, onChange, accent, accentSoft }: { label: string; value: number; onChange: (n: number) => void; accent: string; accentSoft: string; }) {
  return (
    <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
      <Label>{label}</Label>
      <input type="range" min={0} max={10} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
      <div className="text-xs text-muted-foreground">{value}</div>
    </div>
  );
}

function ClientesCalc({ ingresosMeta, ticket, clientesManual, onClientesManual, accent, accentSoft }: { ingresosMeta: string; ticket: string; clientesManual: string; onClientesManual: (v: string) => void; accent: string; accentSoft: string; }) {
  const calc = (() => {
    const meta = parseFloat(ingresosMeta.replace(/\./g, "").replace(/,/g, ".")) || 0;
    const t = parseFloat(ticket.replace(/\./g, "").replace(/,/g, ".")) || 0;
    if (t <= 0) return 0;
    return meta / t; // clientes/mes
  })();
  return (
    <div className="space-y-2 rounded-xl border-2 p-3" style={{ borderColor: accent, background: accentSoft }}>
      <Label>Clientes alcanzables por mes (calculado)</Label>
      <div className="text-sm text-muted-foreground">Se calcula como <strong>Venta mensual promedio ÷ Ticket</strong>. Puedes ajustar manualmente si tienes evidencia.</div>
      <div className="flex items-center gap-2">
        <Input value={Number.isFinite(calc)? (new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(calc)) : ''} disabled className="border-2" style={{ borderColor: accent }} />
        <span className="text-xs">≈ calculado</span>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Ajuste manual (opcional) – Clientes/mes</Label>
        <Input type="text" inputMode="numeric" value={clientesManual} onChange={e => onClientesManual(formatCLPLike(e.target.value))} className="border-2" style={{ borderColor: accent }} placeholder="p.ej. 120" />
      </div>
    </div>
  );
}



function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}




function badgeClass(color: "red" | "amber" | "green") { return color === "green" ? "bg-green-600" : color === "amber" ? "bg-amber-500" : "bg-red-600"; }
function colorFor(score0to100: number): "red" | "amber" | "green" { if (score0to100 < 40) return "red"; if (score0to100 < 70) return "amber"; return "green"; }

// -------------------- Scoring engine & PE --------------------
const WEIGHTS = {
  problema: 10,
  segmento: 8,
  valor: 10,
  modelo: 10,
  economia: 10,
  mercado: 8,
  competencia: 7,
  riesgos: 7,
  founderFit: 12,
  tolerancia: 8,
  sentimiento: 5,
  red: 5,
} as const;

function rubroBase(rubro: string) {
  const r = (rubro || "").toLowerCase();
  if (/rest/.test(r)) return { marginEsperado: [0.5, 0.75], notaCompetencia: 6 } as const;
  if (/almac|retail|tienda/.test(r)) return { marginEsperado: [0.15, 0.35], notaCompetencia: 7 } as const;
  if (/asesor|servicio|consult/.test(r)) return { marginEsperado: [0.6, 0.85], notaCompetencia: 5 } as const;
  if (/software|saas|app|plataforma/.test(r)) return { marginEsperado: [0.7, 0.9], notaCompetencia: 6 } as const;
  if (/manufact|f\u00E1brica|industrial/.test(r)) return { marginEsperado: [0.25, 0.45], notaCompetencia: 6 } as const;
  return { marginEsperado: [0.3, 0.6], notaCompetencia: 5 } as const;
}

function computeScores(input: any) {
  const base = rubroBase(input.rubro);

  // --- NUEVOS CÁLCULOS (antes no estaban) ---
  // Clientes por dos vías
  const clientsCalc     = input.ticket > 0 ? input.ingresosMeta / input.ticket : 0; // tu cálculo actual (meta/ticket)
  const trafico         = Math.max(0, input.traficoMes || 0);
  const conv            = Math.max(0, Math.min(1, (input.convPct || 0) / 100));
  const clientsFromMkt  = trafico * conv; // visitas/leads * conversión

  // Ajuste manual ya existente
  const clientsManual   = input.clientesManual && input.clientesManual > 0 ? input.clientesManual : undefined;

  // El que “rige” (preferencia: manual > marketing > meta)
  const clientsUsed     = typeof clientsManual === 'number'
   ? clientsManual
   : (clientsFromMkt > 0 ? clientsFromMkt : clientsCalc);

   // Precio y costo 
  const price = Math.max(0, input.ticket);
  // costo unitario: toma el unitario SI existe; si no, usa % del precio (opcional)
  let cost = Math.max(0, Math.min(input.costoUnit || 0, price));
  if ((!input.costoUnit || input.costoUnit === 0) && input.costoPct > 0) {
  cost = Math.max(0, Math.min(price * (input.costoPct / 100), price));
  }
  const mcUnit = Math.max(0, price - cost);
  const margin = price > 0 ? (price - cost) / price : 0;

  
  // CAC: usa el ingresado; si está vacío, calcula con marketing/clientsFromMkt
  const cacFromMkt = clientsFromMkt > 0 ? (input.marketingMensual || 0) / clientsFromMkt : 0;

  // --- PUNTOS que ya calculabas (se mantienen) ---
  const marginScore = clamp(scaleRange(margin, rubroBase(input.rubro).marginEsperado[0], rubroBase(input.rubro).marginEsperado[1]) * 10, 0, 10);


   // LTV con frecuencia anual (ya lo tenías; solo asegúrate de usar “mcUnit”):
  const ltv = (input.frecuenciaAnual > 0 ? input.frecuenciaAnual : 6) * mcUnit;
  const cac = Math.max(0, input.cac || cacFromMkt);

  // ratio usando el CAC “usado” (ingresado o estimado)
  const ltvCacRatio = cac > 0 ? ltv / cac : (ltv > 0 ? 3 : 0);
  const unitScore   = clamp(scaleRange(ltvCacRatio, 1, 3) * 10, 0, 10);

  // problema & valor
  const claridad = Math.min(2, (input.idea?.length || 0) / 140);
  const problemaScore = clamp((input.urgencia / 10) * 8 + claridad, 0, 10);

  const valorHeur = heuristicValor(input.ventajaTexto || "");
  const valorScore = clamp(valorHeur, 0, 10);

  const segmentoScore = clamp(input.accesibilidad, 0, 10);
  const sam12_user = Math.max(0, clientsUsed) * 12;
  const whyNowBoost = input.testeoPrevio / 10;
  const mercadoScore_user = clamp(scaleRange(sam12_user, 200, 5000) * 8 + whyNowBoost * 2, 0, 10);

  const compIntensity = clamp(input.competencia, 0, 10);
  const compScore = clamp(10 - (compIntensity - base['notaCompetencia']), 0, 10);

  const riesgosScore = clamp(input.planesAlternativos, 0, 10);

  const founderFit = clamp((input.experiencia * 0.6 + input.pasion * 0.4), 0, 10);

  const burnMensual = Math.max(0, input.gastosFijos || 0);
  const runwayMeses = burnMensual > 0 ? (Math.max(0, input.capitalTrabajo || 0) / burnMensual) : Infinity;
  const tolerancia = clamp((input.toleranciaRiesgo * 0.6 + Math.min(10, (runwayMeses / 12) * 10) * 0.4), 0, 10);
  const sentimiento = clamp(input.testeoPrevio, 0, 10);
  const red = clamp(input.redApoyo, 0, 10);

  const clientsPE = mcUnit > 0 ? (burnMensual / mcUnit) : Infinity;
  const ventasPE = Number.isFinite(clientsPE) ? clientsPE * price : 0;

  const peCurve = buildPECruve({ clientsPE, mcUnit, gastosFijos: burnMensual, mesesUsuario: input.mesesPE, precio: price });

  const items = [
    { key: "problema", title: "Problema y urgencia", hint: "Tu idea resuelve un problema: 0 = poco, 10 = mucho", score: problemaScore, reason: reasonProblema(input) },
    { key: "segmento", title: "Segmento beachhead", hint: "Qué tan alcanzable es tu cliente inicial", score: segmentoScore, reason: reasonSegmento(input) },
    { key: "valor", title: "Propuesta de valor (ventaja)", hint: "Evaluación de tu ventaja diferenciadora (IA puede ajustar)", score: valorScore, reason: reasonValor(input.ventajaTexto) },
    { key: "modelo", title: "Modelo de negocio (margen)", hint: "Margen bruto estimado con tu precio y costo", score: marginScore, reason: reasonModelo(price, cost, margin) },
    { key: "economia", title: "Economía unitaria (LTV/CAC)", hint: "LTV ≈ frecuencia anual × margen unitario; se divide por CAC", score: unitScore, reason: reasonEconomia(ltv, cac, ltvCacRatio) },
    { key: "mercado", title: "Tamaño de mercado (SAM)", hint: "Usuario: Clientes/mes (venta ÷ ticket). IA puede estimar y ajustar.", score: mercadoScore_user, reason: reasonMercadoWithBreakdown({ sam12_user, ingresosMeta: input.ingresosMeta, ticket: input.ticket, clientsUsed, clientsCalc, clientsManual }) },
    { key: "competencia", title: "Competencia (intensidad)", hint: "Cantidad/calidad de competidores en tu zona/canal", score: compScore, reason: reasonCompetencia(compIntensity, base['notaCompetencia']) },
    { key: "riesgos", title: "Planes alternativos a dificultades", hint: "Mitigaciones listas si algo sale mal", score: riesgosScore, reason: reasonRiesgos(input) },
    { key: "founderFit", title: "Founder–Idea fit", hint: "Tu experiencia + tu pasión/compromiso", score: founderFit, reason: reasonFounder(input) },
    { key: "tolerancia", title: "Tolerancia al riesgo / runway", hint: "Tu tolerancia + meses que puedes operar (capital / gastos fijos)", score: tolerancia, reason: reasonToleranciaCalc(runwayMeses) },
    { key: "sentimiento", title: "Testeo previo (señales)", hint: "Señales tempranas de interés (entrevistas, lista de espera)", score: sentimiento, reason: reasonSentimiento({ traccionCualitativa: input.testeoPrevio }) },
    { key: "red", title: "Red de apoyo", hint: "Mentores, socios y contactos útiles", score: red, reason: reasonRed(input) },
  ];

  const totalScore = Math.round(items.reduce((acc, it) => acc + (WEIGHTS[it.key as keyof typeof WEIGHTS] || 0) * (it.score / 10), 0));
  const verdict = buildVerdict(totalScore, input);
  const chartData: ChartPoint[] = items.map((it: any) => ({
     name: it.title.split(' ')[0],
     value: it.score,
  }));
  const meta = {
  clientsCalc, clientsManual: clientsManual ?? null, clientsUsed,
  clientsFromMkt, trafico, convPct: input.convPct,
  ingresosMeta: input.ingresosMeta, ticket: input.ticket,
  runwayMeses, mcUnit, clientsPE, ventasPE,
  ltv, cacUsado: cac, ltvCacRatio,
};
  const report = { input, items, totalScore, verdict, meta };
  const explainer = [
    `Score global: ${totalScore}/100 (${verdict.title}).`,
    `Resumen: ${verdict.subtitle}`,
    `Acciones sugeridas:`,
    ...verdict.actions.map(a => `• ${a}`),
    `\nP.E.: GF ${fmtCL(burnMensual)} / MC_unit ${fmtCL(mcUnit)} ⇒ Clientes P.E. ≈ ${Number.isFinite(clientsPE)? fmtNum(clientsPE):'—'} · Venta P.E. ≈ $${fmtCL(ventasPE)}.`,
    `Mercado: venta mensual $${fmtCL(input.ingresosMeta)} ÷ ticket $${fmtCL(input.ticket)} ⇒ ${fmtNum(clientsCalc)}/mes ${clientsManual?`(ajuste ${fmtNum(clientsManual)}/mes) `:''}→ SAM12 ${fmtNum(sam12_user)}.`,
  ].join("\n");

  const topRisks = deriveTopRisks({ ...input, riesgoControlado: input.planesAlternativos }, { mcUnit, runwayMeses, clientsCalc });
  const experiments = suggestExperiments({ ...input, traccionCualitativa: input.testeoPrevio });

  return { totalScore, items, chartData, verdict, report, explainer, topRisks, experiments, pe: { mcUnit, clientsPE, ventasPE, runwayMeses }, peCurve };
}

function heuristicValor(text: string) {
  const t = (text || "").toLowerCase();
  const score = Math.min(6, (t.length / 180) * 6);
  const signals = ["únic", "diferenc", "exclus", "patent", "propiedad", "marca", "comunid", "red", "datos", "ia", "autom", "software", "logística", "cost", "tiempo", "mejor", "rápid", "barat"];
  let bonus = 0; for (const s of signals) { if (t.includes(s)) { bonus += 1; if (bonus >= 4) break; } }
  return clamp(score + bonus, 0, 10);
}

// -------------------- Reason helpers --------------------
function reasonProblema(i: any) { return i.urgencia >= 7 ? "Dolor sentido y urgente" : i.urgencia >= 4 ? "Dolor moderado" : "Dolor bajo"; }
function reasonSegmento(i: any) { return i.accesibilidad >= 7 ? "Cliente bien ubicado y alcanzable" : i.accesibilidad >= 4 ? "Accesibilidad media" : "Difícil alcanzar al cliente"; }
function reasonValor(text: string) { const len = (text || "").length; const keywords = ["únic", "diferenc", "exclus", "patent", "propiedad", "marca", "red", "datos", "ia", "automat"]; const hits = keywords.filter(k => (text || "").toLowerCase().includes(k)).length; if (len < 40) return "Ventaja poco específica; explica qué te hace distinto"; if (hits >= 2) return "Ventaja diferenciadora concreta"; return "Ventaja descrita; podría ser más específica"; }
function reasonModelo(price: number, cost: number, margin: number) { if (price <= 0) return "Define precio"; if (price <= cost) return "El precio no cubre el costo unitario"; return `Margen bruto ${(margin * 100).toFixed(0)}%`; }
function reasonEconomia(ltv: number, cac: number, ratio: number) { if (cac === 0) return "Sin CAC declarado; usar prueba de canal"; return `LTV/CAC ≈ ${ratio.toFixed(1)} (LTV ≈ frecuencia × MC)`; }
function reasonMercadoWithBreakdown({ sam12_user, ingresosMeta, ticket, clientsUsed, clientsCalc, clientsManual }:{ sam12_user:number; ingresosMeta:number; ticket:number; clientsUsed:number; clientsCalc:number; clientsManual?:number; }){
  const a = `Usuario: Venta ${fmtCL(ingresosMeta)} / Ticket ${fmtCL(ticket)} ⇒ ${fmtNum(clientsCalc)}/mes`;
  const b = clientsManual? ` (ajuste manual: ${fmtNum(clientsManual)}/mes)` : '';
  return `${a}${b} · SAM12 ≈ ${fmtNum(sam12_user)}`;
}
function reasonCompetencia(intensity: number, base: number) { if (intensity >= 8) return "Mercado muy competitivo; refuerza ventaja"; if (intensity <= 3) return "Baja competencia; valida demanda"; return "Competencia moderada"; }
function reasonRiesgos(i: any) { return i.planesAlternativos >= 7 ? "Planes alternativos claros" : i.planesAlternativos >= 4 ? "Mitigación parcial" : "Fortalece planes alternativos"; }
function reasonFounder(i: any) { const m = (i.experiencia + i.pasion) / 2; return m >= 7 ? "Buen encaje fundador-idea" : m >= 4 ? "Encaje regular; complementa" : "Bajo encaje; busca apoyo"; }
function reasonToleranciaCalc(runway: number) { return Number.isFinite(runway) ? (runway >= 6 ? "Runway razonable" : runway >= 3 ? "Runway ajustado" : "Runway corto; ajusta costos o capital") : "Define capital y gastos fijos"; }
function reasonSentimiento(i: any) { return i.traccionCualitativa >= 7 ? "Señales tempranas favorables" : i.traccionCualitativa >= 4 ? "Señales mixtas" : "Aún sin señales sólidas"; }
function reasonRed(i: any) { return i.redApoyo >= 7 ? "Buena red de apoyo" : i.redApoyo >= 4 ? "Red moderada" : "Activa mentores/partners"; }

function buildVerdict(score: number, i: any) { if (score < 40) return { title: "ROJO – Pausar", subtitle: "Necesita replanteo antes de invertir", actions: ["Reducir supuestos críticos", "Probar problema con 5–10 entrevistas", "Ajustar modelo o segmento"] }; if (score < 70) return { title: "ÁMBAR – Ajustar", subtitle: "Hay potencial si reduces incertidumbre clave", actions: ["Ejecutar 2 experimentos (2 semanas)", "Aumentar margen o ticket", "Validar canal con CAC real"] }; return { title: "VERDE – Avanzar", subtitle: "Condiciones razonables para un MVP/soft‑launch", actions: ["Desarrollar MVP enfocado", "Definir métricas de éxito", "Plan de adquisición inicial"] };
}

function deriveTopRisks(i: any, meta: { mcUnit: number; runwayMeses: number; clientsCalc: number; }) {
  const r = [] as string[];
  if (i.ticket <= i.costoUnit) r.push("Precio ≤ costo unitario");
  if (meta.mcUnit <= 0) r.push("Margen de contribución ≤ 0 (revisar precio/costo)");
  if (!Number.isFinite(meta.runwayMeses) || meta.runwayMeses < 4) r.push("Runway corto (<4 meses)");
  if (i.accesibilidad < 5) r.push("Difícil alcanzar al cliente");
  if (heuristicValor(i.ventajaTexto || "") < 5) r.push("Ventaja poco diferenciada");
  if (meta.clientsCalc < 30) r.push("Clientes/mes muy bajo; revisa meta o ticket");
  if (i.testeoPrevio < 5) r.push("Pocas señales de demanda");
  return r.length ? r : ["Riesgos no críticos declarados"];
}

function suggestExperiments(i: any) {
  const ex = [] as string[];
  ex.push("Landing con captura de interés (CTR > 3%)");
  if (/rest/.test((i.rubro || '').toLowerCase())) ex.push("Pop‑up de menú piloto 1 día (ventas > 50% aforo)");
  if (/almac|retail|tienda/.test((i.rubro || '').toLowerCase())) ex.push("Test de mix y margen con 20 SKUs en 1 semana");
  if (/asesor|consult/.test((i.rubro || '').toLowerCase())) ex.push("Ofrecer 5 auditorías gratis por referidos");
  if (i.cac === 0) ex.push("Medir CAC en 2 canales (FB/IG o Google) con $100k");
  if (i.accesibilidad < 6) ex.push("Entrevistas con 10 potenciales clientes para mapear canal");
  return ex.slice(0, 3);
}

function buildPECruve({ clientsPE, mcUnit, gastosFijos, mesesUsuario, precio }: { clientsPE: number; mcUnit: number; gastosFijos: number; mesesUsuario: number; precio: number; }) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const stepUser = Math.round(100 / Math.max(1, mesesUsuario));
  const pctUser = months.map(m => Math.min(100, stepUser * m));
  const pct12 = months.map(m => Math.min(100, Math.round(8 * m)));

  function makeRow(pct: number) {
    if (!Number.isFinite(clientsPE) || clientsPE <= 0) return { clientesMes: 0, mcTotal: 0, deficit: gastosFijos };
    const clientesMes = (clientsPE * pct) / 100;
    const mcTotal = clientesMes * mcUnit;
    const deficit = Math.max(0, gastosFijos - mcTotal);
    return { clientesMes, mcTotal, deficit };
  }

    const data = months.map((m: number, idx: number) => {
    const u = makeRow(pctUser[idx]);
    const t = makeRow(pct12[idx]);
    return {
      mes: `M${m}`,
      "%PE_usuario": pctUser[idx],
      "%PE_12m": pct12[idx],
      deficit: u.deficit,
      clientes_usuario: u.clientesMes,
      clientes_12m: t.clientesMes,
      venta_usuario: u.clientesMes * precio,
    };
  });
  const acumDeficitUsuario = data.reduce((acc, r) => acc + r.deficit, 0);
  const capitalSuficiente = acumDeficitUsuario <= 0 ? true : undefined;
  return { data, acumDeficitUsuario, capitalSuficiente };
}
type Key = keyof typeof WEIGHTS;

type EvalItem = {
  key: Key;
  title: string;
  score: number;
  reason?: string;
  hint?: string;
};

function applyIA(baseOut: any, ia: any) {
  if (!ia) return baseOut;

  const byKey: Partial<Record<Key, number>> = ia?.scores?.byKey ?? {};
  const reasons: Partial<Record<Key, string>> = ia?.reasons ?? {};
  const hints: Partial<Record<Key, string>> = ia?.hints ?? {};
  const meta = ia?.meta ?? {};

  // 1) No pisar score si IA no entrega número
  const items: EvalItem[] = (baseOut.items as EvalItem[]).map((it) => {
    const hasNum = typeof byKey[it.key] === 'number' && Number.isFinite(byKey[it.key]!);
    const score = hasNum ? Math.max(0, Math.min(10, byKey[it.key]!)) : it.score;
    return {
      ...it,
      score,
      reason: reasons[it.key] ?? it.reason,
      hint:   hints[it.key]   ?? it.hint,
    };
  });

  // 2) Ajuste de texto fila “mercado” (opcional, conserva tu lógica)
  const idxM = items.findIndex((x) => x.key === 'mercado');
  if (idxM >= 0) {
    const prev = items[idxM];
    // … tu armado de userTxt / iaTxt aquí …
    const userTxt = prev.reason || '';
    const iaTxt = meta.samMonthly_est ? ` IA: Estimación IA = ${meta.samMonthly_est}/mes. Supuestos: ${meta.assumptionsText || ''}` : '';
    items[idxM] = { ...prev, reason: `${userTxt}${iaTxt ? ' ·' + iaTxt : ''}`, hint: prev.hint };
  }

  // 3) Totales (tipados)
  const totalScore = Math.round(
    items.reduce((acc: number, it: EvalItem) => {
      const w = (WEIGHTS as Record<Key, number>)[it.key] ?? 0;
      return acc + w * (it.score / 10);
    }, 0)
  );

  const chartData = items.map((it) => ({ name: it.title.split(' ')[0], value: it.score }));

  // 4) ¡OJO! No tocar report.ranking.score del informe base
  return {
    ...baseOut,
    items,
    chartData,
    totalScore,
    verdict: ia?.verdict || baseOut.verdict,
    // deja el score original
    report: { ...(baseOut.report ?? {}), ranking: { ...(baseOut.report?.ranking ?? {}) } },
  };
}



// -------------------- Smoke tests (console) --------------------
(function runAreteSmokeTests() {
  try {
    console.log("[Arete] Running smoke tests…");
    console.assert(colorFor(39) === 'red', 'colorFor(39) should be red');
    console.assert(colorFor(40) === 'amber', 'colorFor(40) should be amber');
    console.assert(colorFor(69) === 'amber', 'colorFor(69) should be amber');
    console.assert(colorFor(70) === 'green', 'colorFor(70) should be green');

    console.assert(formatCLPLike('25000000') === '25.000.000', 'formatCLPLike should add thousand separators');
    console.assert(parseNumberCL('25.500,75') === 25500.75, 'parseNumberCL should parse CL format');
    console.assert(parseNumberCL(formatCLPLike('1234567')) === 1234567, 'roundtrip format/parse');

    const cg = capitalGap(12000000, 9800000);
    console.assert(cg.suficiente && cg.gap === 2200000, 'capitalGap should compute superávit 2.200.000');

    const baseInput: any = { idea: 'x', ventajaTexto: 'y', rubro: 'otro', ubicacion: 'Chile', capitalTrabajo: 12000000, gastosFijos: 4000000, ingresosMeta: 5000000,
      ticket: 8500, costoUnit: 4500, cac: 100000, frecuenciaAnual: 6,
      urgencia: 5, accesibilidad: 5, competencia: 5, experiencia: 5, pasion: 5, planesAlternativos: 5, toleranciaRiesgo: 5,
      testeoPrevio: 5, redApoyo: 5, supuestos: '', clientesManual: 0, mesesPE: 6 };
    const out = computeScores(baseInput);
    const clients = out.report.meta.clientsCalc;
    console.assert(Math.abs(clients - (5000000/8500)) < 0.001, 'clientsCalc should equal meta/ticket');

    const outManual = computeScores({ ...baseInput, clientesManual: 100 });
    console.assert(outManual.report.meta.clientsUsed === 100, 'clientsUsed should respect manual override');

    console.assert(out.pe.mcUnit === 4000, 'MC unit should be 4000');
    console.assert(Math.round(out.pe.clientsPE) === 1000, 'Clients PE should be 1000');

    console.assert(Math.abs(out.pe.runwayMeses - 3) < 0.001, 'Runway months should be 3');

    const curve = out.peCurve.data;
    console.assert(curve[0]["%PE_usuario"] === Math.round(100/6), 'First month ~17% when mesesPE=6');

    const ia = { meta: { samMonthly_est: 120, assumptionsText: 'conversión 2.5%, ticket medio 9k' } } as any;
    const merged = applyIA(out, ia);
    const m = merged.items.find((x: any) => x.key === 'mercado');
    console.assert(/IA:/.test(m.reason), 'Mercado reason should include IA part when provided');

    console.log("[Arete] Smoke tests passed");
  } catch (e) { console.warn('[Arete] Smoke tests exception', e); }
})();

function downloadJSON(obj: any, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printOnly(target: 'tablero' | 'informe') {
  const cls = target === 'tablero' ? 'print-tablero' : 'print-informe';
  const body = document.body;
  body.classList.add(cls);

  // pequeño delay para asegurar reflow antes de imprimir
  setTimeout(() => {
    window.print();
  }, 50);

  const cleanup = () => {
    body.classList.remove(cls);
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
}


function ReportView({ report }:{ report: StandardReport }) {
  const s = report.sections;
  return (
    <div className="rounded-xl border p-4 bg-white/5">
      <Item t="Rubro">{s.industryBrief}</Item>
      <Item t="Competencia local ($)">{s.competitionLocal}</Item>
      <Item t="FODA + Tamaño de Mercado">{s.swotAndMarket}</Item>
      <Item t="Veredicto con 3 proximos pasos">{s.finalVerdict}</Item>
      <div className="mt-3 text-xs text-muted-foreground">
        Score: {report.ranking.score}/100 · {report.ranking.constraintsOK ? '✓ Consistente' : '⚠︎ Revisar campos'}
      </div>
    </div>
  );
}
function Item({t, children}:{t:string; children:React.ReactNode}){
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold opacity-80">{t}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
