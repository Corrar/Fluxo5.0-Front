// ui.jsx — shared page primitives for the Fluxo Royale ERP pages.
const { useState: useStateUI } = React;

function tone(t, name) {
  const map = {
    accent: { bg: t.accentSoft, fg: t.accentText },
    blue:   { bg: 'rgba(37,99,235,.14)',  fg: '#3b82f6' },
    green:  { bg: 'rgba(16,185,129,.14)',  fg: '#10b981' },
    amber:  { bg: 'rgba(245,158,11,.16)',  fg: '#d97706' },
    red:    { bg: 'rgba(239,68,68,.14)',   fg: '#ef4444' },
    gray:   { bg: t.hover,                 fg: t.muted },
  };
  return map[name] || map.gray;
}

function Badge({ t, children, kind = 'gray', dot = false }) {
  const c = tone(t, kind);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.02em',
      padding: dot ? '4px 10px 4px 8px' : '4px 10px', borderRadius: 8, background: c.bg, color: c.fg, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.fg }} />}
      {children}
    </span>
  );
}

function Card({ t, children, style, hover, onClick }) {
  const [h, setH] = useStateUI(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => hover && setH(false)}
      style={{ background: t.panel, border: `1px solid ${h ? t.borderStrong : t.border}`, borderRadius: 16,
        boxShadow: h ? t.shadow : 'none', transition: 'border-color .15s, box-shadow .15s, transform .15s',
        transform: h ? 'translateY(-2px)' : 'none', ...style }}>
      {children}
    </div>
  );
}

function PageHeader({ t, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: t.text }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: t.muted }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
    </div>
  );
}

function Btn({ t, children, icon, kind = 'primary', onClick }) {
  const styles = {
    primary: { background: t.accent, color: t.onAccent, border: `1px solid ${t.accent}`, boxShadow: `0 4px 12px ${frHexToRgba(t.accent, 0.28)}` },
    ghost:   { background: t.panel, color: t.text, border: `1px solid ${t.border}` },
    soft:    { background: t.accentSoft, color: t.accentText, border: `1px solid transparent` },
  };
  return (
    <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: 9,
      height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, transition: 'filter .14s, background .14s', ...styles[kind] }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.04)'; if (kind !== 'primary') e.currentTarget.style.background = t.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; if (kind === 'ghost') e.currentTarget.style.background = t.panel; if (kind === 'soft') e.currentTarget.style.background = t.accentSoft; }}>
      {icon && <Icon name={icon} size={17} />}{children}
    </button>
  );
}

function KPI({ t, icon, label, value, sub, kind = 'accent', mini }) {
  const c = tone(t, kind);
  return (
    <Card t={t} hover style={{ padding: mini ? 16 : 20, flex: 1, minWidth: mini ? 150 : 190 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: t.muted, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: c.bg, color: c.fg, flexShrink: 0 }}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div style={{ fontSize: mini ? 22 : 28, fontWeight: 850, color: t.text, marginTop: 10, letterSpacing: '-.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// Simple data table
function DataTable({ t, columns, rows }) {
  return (
    <Card t={t} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }} className="fr-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: c.align || 'left', padding: '14px 18px', fontSize: 10.5, fontWeight: 700,
                  letterSpacing: '.08em', textTransform: 'uppercase', color: t.faint, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ transition: 'background .12s', cursor: 'default' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '13px 18px', textAlign: c.align || 'left', color: t.text,
                    borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.border}`, whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptyState({ t, title, sub, mascot }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 132, height: 132, marginBottom: 22 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accentSoft, filter: 'blur(8px)' }} />
        <img src={window.__asset('assets/egg.png')} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: t.text }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, color: t.muted, marginTop: 8, maxWidth: 420 }}>{sub}</div>}
    </div>
  );
}

// Mini CSS bar chart
function BarChart({ t, data, height = 180 }) {
  const max = Math.max(...data.map((d) => d.v)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted }}>{d.label2 || ''}</div>
          <div title={`${d.v}`} style={{ width: '100%', maxWidth: 38, height: `${(d.v / max) * 100}%`, minHeight: 4, borderRadius: '7px 7px 3px 3px',
            background: d.accent ? `linear-gradient(180deg, ${t.accent}, ${frHexToRgba(t.accent, 0.55)})` : t.hover, transition: 'height .4s cubic-bezier(.2,.8,.2,1)' }} />
          <div style={{ fontSize: 11, color: t.faint, fontWeight: 600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// Smooth path through points (Catmull-Rom → cubic bezier)
function frSmoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Smooth area/line chart with gradient fill. series: [{ data:[numbers], color, fill }]
function AreaChart({ t, series, labels, height = 150, max, showMaxLine = false, gridLines = 3 }) {
  const uid = useStateUI(() => 'ac' + Math.random().toString(36).slice(2, 8))[0];
  const W = 520, H = height, padT = 14, padB = labels ? 24 : 10, padX = 6;
  const allVals = series.flatMap((s) => s.data);
  const hi = max != null ? max : Math.max(...allVals, 1) * 1.12;
  const lo = Math.min(...allVals, 0);
  const span = hi - lo || 1;
  const n = series[0].data.length;
  const x = (i) => padX + (i / Math.max(n - 1, 1)) * (W - padX * 2);
  const y = (v) => padT + (1 - (v - lo) / span) * (H - padT - padB);
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', overflow: 'visible' }}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`${uid}-g${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={s.fill === false ? 0 : 0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {Array.from({ length: gridLines }).map((_, i) => {
          const yy = padT + (i / (gridLines - 1)) * (H - padT - padB);
          return <line key={i} x1={padX} y1={yy} x2={W - padX} y2={yy} stroke={t.border} strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />;
        })}
        {showMaxLine && <line x1={padX} y1={y(hi / 1.12)} x2={W - padX} y2={y(hi / 1.12)} stroke={series[0].color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55" />}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => [x(i), y(v)]);
          const line = frSmoothPath(pts);
          const area = `${line} L ${x(n - 1)},${H - padB} L ${x(0)},${H - padB} Z`;
          return (
            <g key={si}>
              {s.fill !== false && <path d={area} fill={`url(#${uid}-g${si})`} />}
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {s.dot !== false && <circle cx={x(n - 1)} cy={y(s.data[n - 1])} r="4" fill={s.color} stroke={t.panel} strokeWidth="2.5" />}
            </g>
          );
        })}
      </svg>
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 2 }}>
          {labels.map((l, i) => <span key={i} style={{ fontSize: 10.5, color: t.faint, fontWeight: 600 }}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

// SVG donut/ring. segs:[{label,value,color}], optional center {value,sub}
function RingChart({ t, segs, size = 140, thickness = 16, center, gap = 0.04 }) {
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2, C = 2 * Math.PI * r, cx = size / 2;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={t.hover} strokeWidth={thickness} />
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        {segs.map((s, i) => {
          const frac = s.value / total;
          const len = Math.max(frac - gap, 0.001) * C;
          const off = acc * C;
          acc += frac;
          return <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeLinecap="round" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} style={{ transition: 'stroke-dasharray .6s' }} />;
        })}
      </g>
      {center && (
        <>
          <text x={cx} y={cx - 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.2, fontWeight: 850, fill: t.text }}>{center.value}</text>
          {center.sub && <text x={cx} y={cx + size * 0.13} textAnchor="middle" style={{ fontSize: size * 0.085, fill: t.muted }}>{center.sub}</text>}
        </>
      )}
    </svg>
  );
}

// CADEADO reutilizável — renderiza NO LUGAR do conteúdo de abas/rotas mock ou incompletas.
// Contrato: a tela mock NÃO é montada por trás deste componente (nenhum seed carregado,
// nenhuma chamada de rede, nenhuma escrita). A interceptação acontece no roteador
// (renderPage, em pages_admin.jsx) ANTES de instanciar a página. Ver window.FR_LOCKED_PAGES.
function EmDesenvolvimento({ t, title, subtitle, tag = 'Em Desenvolvimento' }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', padding: '40px 20px' }}>
      <Card t={t} style={{ maxWidth: 460, width: '100%', padding: '44px 34px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 22px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accentSoft, filter: 'blur(7px)' }} />
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', background: t.accentSoft, color: t.accentText }}>
            <Icon name="lock" size={36} stroke={1.75} />
          </div>
        </div>
        <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.accentText, background: t.accentSoft, padding: '5px 12px', borderRadius: 999, marginBottom: 14 }}>{tag}</span>
        <div style={{ fontSize: 21, fontWeight: 850, color: t.text, letterSpacing: '-.01em' }}>{title || 'Em Desenvolvimento'}</div>
        <div style={{ fontSize: 13.5, color: t.muted, marginTop: 10, lineHeight: 1.5, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          {subtitle || 'Esta área ainda está em construção e será liberada em breve. O conteúdo fica indisponível até lá.'}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Badge, Card, PageHeader, Btn, KPI, DataTable, EmptyState, BarChart, AreaChart, RingChart, uiTone: tone, EmDesenvolvimento });
