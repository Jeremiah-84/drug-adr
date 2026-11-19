import { LV, ORDER, SYMPTOMS, TAG, type Level } from '../data';
import { drugView, topLevel, trBadge, watchCount } from '../derive';
import { useApp } from '../state';
import { Back, Badge, Chip, Heading } from '../ui';

const pillIcon = (color: string) => (
  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg)', border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <span style={{ width: 20, height: 11, borderRadius: 6, background: color }} />
  </div>
);

export function Results() {
  const { go, openDrug, t, L, F } = useApp();
  return (
    <div className="screen" style={{ gap: 16 }}>
      <Back />
      <Heading eyebrow="SCAN RESULT" title={t.found} sub={t.foundSub} size={24} />
      <div className="col" style={{ gap: 10 }}>
        {ORDER.map(id => {
          const d = drugView(id), top = LV[topLevel(d)];
          return (
            <button key={id} onClick={() => openDrug(id)} className="card hoverable row"
              style={{ padding: 16, gap: 14, border: '1px solid rgba(201,164,92,.14)' }}>
              {pillIcon(d.color)}
              <div className="col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{L(d.name)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{L(d.ing)} · {L(d.cls)}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Badge b={{ t: F('주의할 이상반응 {0}', watchCount(d)), c: top.c, bg: top.bg }} />
                  <span className="badge" style={{ fontWeight: 400, border: '1px solid rgba(241,234,217,.14)', color: 'var(--ink-body)' }}>{L(d.dose)}</span>
                </div>
              </div>
              <span className="chev">›</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-gold" style={{ flex: 1 }} onClick={() => go('schedule')}>{t.addSched}</button>
        <button className="btn-line" style={{ flex: 1 }} onClick={() => go('symptom')}>{t.bySym}</button>
      </div>
    </div>
  );
}

const DETAIL_TABS = [['adr', '이상반응'], ['organ', '신·간기능'], ['how', '복용법']] as const;

export function Detail() {
  const { s, set, go, t, L } = useApp();
  const d = drugView(s.drug);
  const organ = [
    { title: '신기능 저하', tag: d.renal[0], x: d.renal[1] },
    { title: '간기능 저하', tag: d.hepatic[0], x: d.hepatic[1] },
  ];
  return (
    <div className="screen">
      <Back />
      <div className="row" style={{ gap: 16 }}>
        <div style={{ width: 84, height: 84, borderRadius: 20, background: 'repeating-linear-gradient(135deg,#183a2c 0 7px,#143326 7px 14px)', border: '1px solid rgba(201,164,92,.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, flex: 'none' }}>
          <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 8.5, color: 'var(--faint)' }}>pill photo</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ letterSpacing: '.2em' }}>{d.en}</div>
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, marginTop: 4 }}>{L(d.name)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{L(d.ing)} · {L(d.cls)}</div>
        </div>
      </div>

      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid rgba(201,164,92,.18)' }}>
        {DETAIL_TABS.map(([k, l]) => {
          const on = s.dtab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => set({ dtab: k })}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0 11px', fontSize: 14, color: on ? 'var(--gold-light)' : 'var(--muted)', fontWeight: on ? 700 : 400, borderBottom: `2px solid ${on ? '#c9a45c' : 'transparent'}`, marginBottom: -1 }}>
              {L(l)}
            </button>
          );
        })}
      </div>

      {s.dtab === 'adr' && (
        <div className="col" style={{ gap: 10 }}>
          {d.adr.map(([n, lv, f]) => (
            <div key={n} className="row" style={{ borderRadius: 14, padding: '13px 14px', background: 'var(--card)', gap: 10 }}>
              <Badge b={trBadge(LV[lv], L)} style={{ padding: '3px 9px' }} />
              <span style={{ flex: 1, fontSize: 14 }}>{L(n)}</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{L(f)}</span>
            </div>
          ))}
          <div className="col" style={{ borderLeft: '2px solid #c9a45c', padding: '4px 0 4px 14px', marginTop: 6, gap: 6 }}>
            <span style={{ fontSize: 11.5, color: 'var(--gold)', fontWeight: 500 }}>{t.evidence}</span>
            <span className="serif" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)' }}>“{L(d.quote)}”</span>
            <a href="https://nedrug.mfds.go.kr/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>{t.source}</a>
          </div>
          <button className="btn-line" onClick={() => go('symptom')} style={{ height: 48, fontSize: 14, fontWeight: 400, marginTop: 6 }}>{t.compare}</button>
        </div>
      )}

      {s.dtab === 'organ' && (
        <div className="col" style={{ gap: 10 }}>
          {organ.map(o => {
            const b = TAG[o.tag];
            return (
              <div key={o.title} className="col" style={{ borderRadius: 16, padding: 16, background: 'var(--card)', gap: 8 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{L(o.title)}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: b.bg, color: b.c }}>{L(o.tag)}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-body)' }}>{L(o.x)}</div>
              </div>
            );
          })}
          <div style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.6 }}>{t.organNote}</div>
        </div>
      )}

      {s.dtab === 'how' && (
        <div className="col">
          {d.how.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(241,234,217,.08)' }}>
              <span style={{ width: 72, flex: 'none', fontSize: 12.5, color: 'var(--gold)' }}>{L(k)}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{L(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Symptom() {
  const { s, set, openDrug, t, L } = useApp();
  return (
    <div className="screen">
      <Back />
      <div>
        <div className="eyebrow">SYMPTOM CHECK</div>
        <div className="title">{t.symQ}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>{t.symSub}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(SYMPTOMS).map(n => {
          const on = s.sym.includes(n);
          return (
            <Chip key={n} on={on} style={{ padding: '8px 14px', fontSize: 13.5 }}
              onClick={() => set(x => ({ sym: on ? x.sym.filter(y => y !== n) : [...x.sym, n] }))}>{L(n)}</Chip>
          );
        })}
      </div>
      {s.sym.map(n => (
        <div key={n} className="col" style={{ gap: 8 }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold-light)' }}>{L(n)}</div>
          {SYMPTOMS[n].map(([id, lv]) => {
            const d = drugView(id);
            return (
              <button key={id} onClick={() => openDrug(id)} className="row" style={{ borderRadius: 14, padding: '13px 14px', background: 'var(--card)', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span style={{ flex: 1, fontSize: 14 }}>{L(d.name)}</span>
                <Badge b={trBadge(LV[lv], L)} style={{ padding: '3px 9px' }} />
              </button>
            );
          })}
        </div>
      ))}
      {s.sym.length === 0 && (
        <div style={{ border: '1px dashed rgba(201,164,92,.3)', borderRadius: 16, padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>{t.symEmpty}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 11, color: 'var(--muted)' }}>
        {([4, 3, 2, 1] as Level[]).map(k => (
          <span key={k} className="row" style={{ gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: LV[k].c }} />{L(LV[k].t)} · {L(LV[k].d)}
          </span>
        ))}
      </div>
    </div>
  );
}
