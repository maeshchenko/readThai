// Reusable UI components
const { useState, useEffect, useRef, useMemo } = React;

// Icons
const Icon = ({ name, size = 16 }) => {
  const paths = {
    play: <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>,
    pause: <g fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></g>,
    mic: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></g>,
    sun: <g stroke="currentColor" strokeWidth="1.5" fill="none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/>,
    arrow: <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    arrowL: <path d="M19 12H5M11 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    home: <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    sparkles: <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" fill="currentColor"/>,
    headphones: <path d="M3 18v-6a9 9 0 0 1 18 0v6a2 2 0 0 1-2 2h-2v-7h4M3 18a2 2 0 0 0 2 2h2v-7H3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 5v14a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>,
    close: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>,
    check: <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    refresh: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
  );
};

// Brand mark
const Brand = () => (
  <div className="brand">
    <div className="brand-mark">Ч</div>
    <div className="brand-text">
      <span className="b1">Читай по‑тайски</span>
      <span className="b2">за 10 дней · Издание II</span>
    </div>
  </div>
);

// Sidebar nav item
const NavItem = ({ active, done, onClick, num, children }) => (
  <button className={`nav-item ${active?'active':''} ${done?'done':''}`} onClick={onClick}>
    {num != null
      ? <span className="nav-num">{String(num).padStart(2, '0')}</span>
      : <span className="nav-dot"></span>}
    <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{children}</span>
  </button>
);

// Progress ring
const Ring = ({ value = 0, size = 44 }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  const pct = Math.round(value * 100);
  return (
    <div className="ring">
      <svg viewBox="0 0 44 44">
        <circle className="track" cx="22" cy="22" r={r} />
        <circle className="fill" cx="22" cy="22" r={r}
          strokeDasharray={c} strokeDashoffset={off} />
        {value > 0 && <text x="22" y="22" textAnchor="middle" dominantBaseline="middle">{pct}</text>}
      </svg>
    </div>
  );
};

// Lesson card
const LessonCard = ({ lesson, onClick, idx }) => {
  const done = lesson.progress >= 1;
  const active = lesson.progress > 0 && !done;
  const hasNum = !lesson.special;
  return (
    <button className={`lesson ${done?'done':''} ${active?'active':''}`} onClick={onClick}>
      <span className="l-num">{hasNum ? String(idx).padStart(2,'0') : '✦'}</span>
      <div className="l-content">
        <div className="l-tag">{lesson.tag}</div>
        <div className="l-title">{lesson.title}</div>
        <div className="l-meta">
          <span>{lesson.tracks} аудио‑треков</span>
          <span className="dot"></span>
          <span>{lesson.items > 0 ? `${lesson.items} символов` : 'без упражнений'}</span>
          {done && (<><span className="dot"></span><span style={{color:'var(--sage)'}}>пройдено</span></>)}
        </div>
      </div>
      <Ring value={lesson.progress}/>
    </button>
  );
};

// Audio player — synthetic. Uses Web Audio API to produce a tone for "playback" feedback.
const useTone = () => {
  const ctxRef = useRef(null);
  const play = (freq = 320, dur = 0.12) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext||window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.005);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur + 0.02);
    } catch (e) {}
  };
  return play;
};

const Player = ({ trackName = "Трек 9", duration = 38 }) => {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT(x => {
      const n = x + 0.25 * speed;
      if (n >= duration) { setPlaying(false); return 0; }
      return n;
    }), 250);
    return () => clearInterval(id);
  }, [playing, speed, duration]);
  const pct = (t / duration) * 100;
  const fmt = (s) => {
    const m = Math.floor(s/60), ss = Math.floor(s%60);
    return `${m}:${ss.toString().padStart(2,'0')}`;
  };
  return (
    <div className="player">
      <button className="play" onClick={()=>setPlaying(p=>!p)} aria-label="Play">
        <Icon name={playing?'pause':'play'} size={14}/>
      </button>
      <div className="info">
        <div className="label"><span>трек</span><b>{trackName}</b></div>
        <div className="scrub" onClick={(e)=>{
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left)/r.width;
          setT(x*duration);
        }}>
          <div style={{width: pct + '%'}}></div>
        </div>
      </div>
      <div style={{display:'flex', gap:10, alignItems:'center'}}>
        <span className="time">{fmt(t)} / {fmt(duration)}</span>
        <button className="speed" onClick={()=>setSpeed(s => s===1?0.75: s===0.75?1.25: s===1.25?1.5: 1)}>{speed}×</button>
      </div>
    </div>
  );
};

// Character grid (consonants / vowels)
const CharGrid = ({ items, columns = 6 }) => {
  const [playing, setPlaying] = useState(null);
  const tone = useTone();
  return (
    <div className="char-grid" style={{'--cols': columns}}>
      {items.map((c, i) => (
        <button key={i} className={`ch ${playing===i?'playing':''}`}
          onClick={() => {
            tone(220 + i*30, 0.18);
            setPlaying(i);
            setTimeout(() => setPlaying(null), 1100);
          }}>
          <span className="pin">{(i+1).toString().padStart(2,'0')}</span>
          <span className="glyph">{c.glyph}</span>
          <span className="ipa">[{c.ipa}]</span>
          <span className="name">{c.name}</span>
          <span className="pulse"></span>
        </button>
      ))}
    </div>
  );
};

// Try-it syllable cards (tap to reveal answer)
const SyllableTryIt = ({ items }) => {
  const [revealed, setRevealed] = useState(new Set());
  const tone = useTone();
  return (
    <div className="syl-grid">
      {items.map((s, i) => {
        const r = revealed.has(i);
        return (
          <button key={i} className={`syl ${r?'revealed':''}`} onClick={() => {
            tone(280 + i*20, 0.22);
            setRevealed(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
          }}>
            <span className="reveal-cue">{r ? '✓' : 'tap'}</span>
            <span className="glyph">{s.glyph}</span>
            <span className="ipa">/{s.ipa}/</span>
            <span className="ru">{s.ru || '—'}</span>
          </button>
        );
      })}
    </div>
  );
};

// Reference table (appendix)
const RefTable = ({ rows }) => (
  <table className="ref-table">
    <thead>
      <tr><th>Согласный(е)</th><th>Начальный звук</th><th>Конечный звук</th></tr>
    </thead>
    <tbody>
      {rows.map((r,i) => (
        <tr key={i}>
          <td className="glyph-cell">{r.glyph}</td>
          <td className="ipa">{r.initial}</td>
          <td className="name">{r.final || '—'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// === Flashcard exercise ===
const Flashcards = ({ items }) => {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState({}); // i -> 'again'|'hard'|'good'|'easy'
  const tone = useTone();
  const c = items[i];
  const next = () => { setFlipped(false); setI(x => (x+1) % items.length); };
  const prev = () => { setFlipped(false); setI(x => (x-1+items.length) % items.length); };
  const judge = (k) => {
    setMarks(m => ({...m, [i]: k}));
    setTimeout(next, 200);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f=>!f); }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (['1','2','3','4'].includes(e.key)) judge(['again','hard','good','easy'][+e.key-1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div>
      <div className="deck-stage-card" onClick={()=>setFlipped(f=>!f)}>
        <div className={`card-3d ${flipped?'flipped':''}`}>
          <div className="card-face">
            <div className="pos">{String(i+1).padStart(2,'0')} · {String(items.length).padStart(2,'0')}</div>
            <button className="audio-mini" onClick={(e)=>{e.stopPropagation(); tone(240+i*40, 0.22);}} aria-label="Play">
              <Icon name="play" size={11}/>
            </button>
            <div className="glyph">{c.glyph}</div>
            <div className="hint">tap / space — перевернуть</div>
          </div>
          <div className="card-face back">
            <div className="pos">ответ</div>
            <button className="audio-mini" onClick={(e)=>{e.stopPropagation(); tone(240+i*40, 0.22);}} aria-label="Play">
              <Icon name="play" size={11}/>
            </button>
            <div>
              <div className="ipa">/{c.ipa}/</div>
              <div className="name">{c.name}</div>
              <div className="ru">{c.ru}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="deck-controls">
        <div className="group">
          <button className="pill-btn" onClick={prev}><Icon name="arrowL" size={12}/> назад</button>
          <button className="pill-btn" onClick={next}>дальше <Icon name="arrow" size={12}/></button>
        </div>
        <div className="deck-counter">карточка <b>{i+1}</b> из <b>{items.length}</b></div>
      </div>
      <div className="judge-row">
        {[['again','снова','1'],['hard','сложно','2'],['good','хорошо','3'],['easy','легко','4']].map(([k,l,key]) => (
          <button key={k} className={`judge ${k}`} onClick={()=>judge(k)}>
            <span>{l}</span>
            <span className="k">{key}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// === Multi-choice exercise ===
const MultiChoice = ({ bank }) => {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const tone = useTone();
  const q = bank[i % bank.length];
  const pick = (c) => {
    if (picked) return;
    setPicked(c);
    if (c === q.correct) {
      setScore(s => s+1);
      tone(440, 0.16); setTimeout(()=>tone(660, 0.18), 120);
    } else {
      tone(180, 0.22);
    }
    setTimeout(()=>{ setPicked(null); setI(n => n+1); }, 1100);
  };
  return (
    <div>
      <div className="mc-q">
        <div className="prompt">какой звук издаёт эта буква?</div>
        <div className="glyph">{q.glyph}</div>
        <button className="audio-inline" onClick={()=>tone(280+i*15, 0.22)}>
          <Icon name="play" size={11}/> прослушать
        </button>
      </div>
      <div className="choices">
        {q.choices.map((c, idx) => {
          let cls = '';
          if (picked) {
            if (c === q.correct) cls = 'correct';
            else if (c === picked) cls = 'wrong';
          }
          return (
            <button key={c+idx} className={`choice ${cls}`} onClick={()=>pick(c)} disabled={!!picked}>
              <span className="k">{String.fromCharCode(65+idx)}</span>
              {c}
            </button>
          );
        })}
      </div>
      <div className="deck-controls" style={{marginTop: 16}}>
        <div className="deck-counter">вопрос <b>{i+1}</b> · правильно <b>{score}</b></div>
        <button className="pill-btn" onClick={()=>{ setI(0); setPicked(null); setScore(0); }}>
          <Icon name="refresh" size={12}/> заново
        </button>
      </div>
    </div>
  );
};

// Voice trainer — book-style recording UI
const VoiceTrainer = () => {
  const [stage, setStage] = useState('idle'); // idle | armed | recording | recorded
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState(Array(28).fill(0));
  const [recordedLevels, setRecordedLevels] = useState([]);
  const [playing, setPlaying] = useState(null); // 'self' | 'sample' | null
  const [playPct, setPlayPct] = useState(0);
  const tone = useTone();
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage !== 'recording') return;
    setSecs(0); setLevels(Array(28).fill(0));
    timerRef.current = setInterval(() => {
      setSecs(s => s + 0.1);
      setLevels(arr => [...arr.slice(1), 0.25 + Math.random() * 0.75]);
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [stage]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPlayPct(p => {
      if (p >= 1) { setPlaying(null); return 0; }
      return p + 0.04;
    }), 80);
    return () => clearInterval(id);
  }, [playing]);

  const startRec = () => { tone(880, 0.08); setStage('recording'); };
  const stopRec = () => {
    clearInterval(timerRef.current);
    tone(440, 0.12);
    setRecordedLevels([...levels]);
    setStage('recorded');
  };
  const reset = () => { setStage('armed'); setSecs(0); setRecordedLevels([]); };
  const fmt = (s) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="voice-trainer">
      {stage === 'idle' && (
        <button className="vt-cta" onClick={()=>setStage('armed')}>
          <span className="vt-mic"><Icon name="mic" size={14}/></span>
          <span className="vt-cta-text">
            <span className="vt-cta-label">Тренировка голоса</span>
            <span className="vt-cta-sub">прочитайте звук вслух — проверим произношение</span>
          </span>
          <span className="vt-cta-arrow"><Icon name="arrow" size={13}/></span>
        </button>
      )}

      {stage === 'armed' && (
        <div className="vt-panel">
          <p className="vt-hint">Найдите тихое место, нажмите «начать запись», прочитайте вслух буквы, потом сравните с образцом.</p>
          <div className="vt-actions">
            <button className="vt-btn primary" onClick={startRec}>
              <Icon name="mic" size={13}/> начать запись
            </button>
            <button className="vt-btn ghost" onClick={()=>setStage('idle')}>отмена</button>
          </div>
          <div className="vt-privacy">
            <span className="lock">⌂</span>
            запись хранится только в памяти браузера и исчезнет после перезагрузки — на сервер ничего не отправляется.
          </div>
        </div>
      )}

      {stage === 'recording' && (
        <div className="vt-panel recording">
          <div className="vt-eyebrow rec"><span className="vt-pin live"></span> запись · {fmt(secs)}</div>
          <div className="vt-wave">
            {levels.map((v, i) => (
              <span key={i} className="bar" style={{height: `${Math.max(8, v*100)}%`}}/>
            ))}
          </div>
          <div className="vt-actions">
            <button className="vt-btn primary stop" onClick={stopRec}>
              <span className="stop-sq"></span> остановить
            </button>
            <span className="vt-meter">микрофон активен</span>
          </div>
        </div>
      )}

      {stage === 'recorded' && (
        <div className="vt-panel">
          <div className="vt-eyebrow"><span className="vt-pin done">✓</span> ваша запись · {fmt(secs)}</div>
          <div className="vt-track-solo">
            <button className={`vt-play ${playing==='self'?'playing':''}`}
              onClick={()=>{ tone(360, 0.18); setPlayPct(0); setPlaying(playing==='self'?null:'self'); }}>
              <Icon name={playing==='self'?'pause':'play'} size={12}/>
            </button>
            <div className="vt-wave static">
              {recordedLevels.map((v, i) => (
                <span key={i} className="bar"
                  style={{
                    height: `${Math.max(8, v*100)}%`,
                    opacity: playing==='self' ? (i/recordedLevels.length < playPct ? 1 : 0.35) : 0.85
                  }}/>
              ))}
            </div>
          </div>
          <p className="vt-hint" style={{margin:'6px 0 16px'}}>
            Прослушайте себя и образец — сравните на слух.
          </p>
          <div className="vt-actions">
            <button className="vt-btn primary" onClick={()=>{ setStage('recording'); }}>
              <Icon name="mic" size={13}/> записать ещё раз
            </button>
            <button className="vt-btn" onClick={()=>tone(280, 0.22)}>
              <Icon name="play" size={11}/> образец
            </button>
            <button className="vt-btn ghost" onClick={()=>{ tone(220, 0.1); }}>
              <Icon name="refresh" size={12}/> скачать
            </button>
            <button className="vt-btn ghost" onClick={reset}>сбросить</button>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  Icon, Brand, NavItem, Ring, LessonCard,
  Player, CharGrid, SyllableTryIt, RefTable,
  Flashcards, MultiChoice, VoiceTrainer, useTone,
});
