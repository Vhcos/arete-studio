// Node 18+ (tiene fetch nativo)
const BASE = process.env.BASE || 'http://localhost:3000';

const headers = { 'Content-Type': 'application/json' };
const payloadPlan = {
  input: {
    idea: 'cafetería de especialidad',
    ubicacion: 'Providencia',
    rubro: 'cafetería',
    ingresosMeta: 2000000,
    ticket: 3500,
    costoUnit: 1500,
    gastosFijos: 800000,
    marketingMensual: 200000,
  }
};
const payloadEval = {
  input: {
    idea: 'cafetería de especialidad',
    ubicacion: 'Providencia',
    rubro: 'cafetería',
    ingresosMeta: 2000000,
  },
  scores: { byKey: { problema: 7, segmento: 8, competencia: 5 } }
};

function fail(msg, extra) {
  console.error('❌', msg);
  if (extra) console.error(extra);
  process.exit(1);
}

function ok(msg) { console.log('✅', msg); }

(async () => {
  console.log(`\n🔎 Smoke test contra: ${BASE}\n`);

  // /api/plan
  const r1 = await fetch(`${BASE}/api/plan`, {
    method: 'POST', headers, body: JSON.stringify(payloadPlan)
  });
  const j1 = await r1.json().catch(() => ({}));
  if (!j1.ok) fail('api/plan respondió ok=false', j1);
  const plan100 = j1?.plan?.plan100 ?? '';
  if (typeof plan100 !== 'string' || plan100.trim().length === 0) {
    fail('plan.plan100 está vacío', j1);
  }
  ok('plan.plan100 OK (texto presente)');

  // /api/evaluate
  const r2 = await fetch(`${BASE}/api/evaluate`, {
    method: 'POST', headers, body: JSON.stringify(payloadEval)
  });
  const j2 = await r2.json().catch(() => ({}));
  if (!j2.ok) fail('api/evaluate no respondió correctamente', j2);

  const compText = j2?.standardReport?.sections?.competitionLocal ?? '';
  if (typeof compText !== 'string') fail('competitionLocal no es string', j2);
  ok('competitionLocal OK (string presente, puede ser breve)');

  const compIA = j2?.standardReport?.meta?.competenciaIA ?? [];
  if (!Array.isArray(compIA)) fail('meta.competenciaIA no es array', j2);
  ok(`competenciaIA OK (array con ${compIA.length} filas)`);

  console.log('\n🎉 Smoke test PASS\n');
})().catch(e => fail('Excepción en smoke test', e));
