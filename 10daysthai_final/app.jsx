// Main app — home + lesson views, header with theme toggle, mobile menu, tweaks panel

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "saffron",
  "thaiSize": 1,
  "showTOC": true,
  "exerciseStyle": "flashcards"
}/*EDITMODE-END*/;

const PALETTES = {
  saffron:   { accent: "#b3492e", soft: "#e9c9b8", ink: "#6b2613", gold: "#c08a3e", label: "Шафран" },
  indigo:    { accent: "#2f3aa3", soft: "#cdd1ed", ink: "#1c2475", gold: "#9c8252", label: "Индиго" },
  jade:      { accent: "#2c6e54", soft: "#cae0d2", ink: "#1d4836", gold: "#a8945a", label: "Нефрит" },
  ink:       { accent: "#1a1814", soft: "#d8cdb6", ink: "#000",    gold: "#8a7a55", label: "Тушь" },
};

function useThemePalette(theme, paletteKey) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const p = PALETTES[paletteKey] || PALETTES.saffron;
    document.documentElement.style.setProperty('--accent', p.accent);
    document.documentElement.style.setProperty('--accent-soft', p.soft);
    document.documentElement.style.setProperty('--accent-ink', p.ink);
    document.documentElement.style.setProperty('--gold', p.gold);
  }, [theme, paletteKey]);
}

// HOME VIEW
function HomeView({ onOpen, lang }) {
  const [glyphIdx, setGlyphIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setGlyphIdx(x => (x + 1) % 4), 1700);
    return () => clearInterval(id);
  }, []);

  const totalProgress = useMemo(() => {
    const real = LESSONS.filter(l => !l.special);
    return real.reduce((s,l) => s + l.progress, 0) / real.length;
  }, []);
  const tracksHeard = LESSONS.reduce((s,l) => s + Math.round(l.progress * l.tracks), 0);
  const tracksTotal = LESSONS.reduce((s,l) => s + l.tracks, 0);

  const t = (ru, en) => lang === 'EN' ? en : ru;

  return (
    <div className="canvas fade-in">
      <div className="hero">
        <div>
          <div className="eyebrow">{t('настольная книга · второе издание', 'a learner\'s field guide · second edition')}</div>
          <h1>{t(<>Читай по‑тайски<br/><em>за 10 дней</em></>, <>Read Thai<br/><em>in 10 days</em></>)}</h1>
          <p className="lede">{t(
            'Десять структурированных уроков, 85 нативных аудио‑треков и упражнения с обратной связью — чтобы за две недели вы видели в тайских буквах не каракули, а слова.',
            'Ten structured lessons, 85 native audio tracks and feedback-driven drills — so within two weeks Thai script reads as words, not squiggles.'
          )}</p>
          <div className="cta-row">
            <button className="btn" onClick={()=>onOpen({type:'lesson', id: 2})}>
              <Icon name="sparkles" size={14}/>
              {t('Продолжить · День 2', 'Continue · Day 2')}
              <Icon name="arrow" size={14}/>
            </button>
            <button className="btn ghost" onClick={()=>onOpen({type:'guide'})}>
              <Icon name="headphones" size={14}/>
              {t('Гид по произношению', 'Pronunciation guide')}
            </button>
          </div>
        </div>
        <div className="hero-plate" aria-hidden="true">
          <span className="corner tl">ก · ka</span>
          <span className="corner tr">мid · class</span>
          <span className="corner bl">low · 01</span>
          <span className="corner br">⏤ alphabet ⏤</span>
          <div className="glyph-stack">
            {['ก','ข','ค','ง'].map((g, i) => (
              <div key={i} className={`g ${i === glyphIdx ? 'lit' : ''}`}>{g}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="meta-strip">
        <div className="meta-item"><div className="ml">{t('всего уроков', 'lessons')}</div><div className="mv">10</div></div>
        <div className="meta-item"><div className="ml">{t('аудио‑треков', 'audio tracks')}</div><div className="mv">{tracksTotal}</div></div>
        <div className="meta-item"><div className="ml">{t('прослушано', 'heard')}</div><div className="mv"><em>{tracksHeard}</em></div></div>
        <div className="meta-item"><div className="ml">{t('твой прогресс', 'your progress')}</div><div className="mv"><em>{Math.round(totalProgress*100)}%</em></div></div>
        <div className="meta-item"><div className="ml">{t('ориентир', 'pace')}</div><div className="mv">~25 {t('мин/день','min/day')}</div></div>
      </div>

      <div className="sec-head">
        <h2><span className="num">§ I</span>{t('Уроки', 'Lessons')}</h2>
        <span className="right">{t('12 глав', '12 chapters')}</span>
      </div>
      <div className="lessons">
        {LESSONS.map((l, i) => {
          const numeric = !l.special;
          const idx = numeric ? LESSONS.filter((x,j) => !x.special && j <= i).length : null;
          return <LessonCard key={l.id} lesson={l} idx={idx ?? '—'} onClick={()=>onOpen({type:'lesson', id: l.id})}/>;
        })}
      </div>

      <div className="sec-head">
        <h2><span className="num">§ II</span>{t('Справочник', 'Reference')}</h2>
        <span className="right">{t('4 приложения', '4 appendices')}</span>
      </div>
      <div className="lessons">
        {APPENDIX.map((a, i) => (
          <button key={a.id} className="lesson" onClick={()=>onOpen({type:'appendix', id: a.id})}>
            <span className="l-num" style={{fontSize: 38, paddingTop: 6}}>{['I','II','III','IV'][i]}</span>
            <div className="l-content">
              <div className="l-tag">{t('приложение','appendix')}</div>
              <div className="l-title">{a.label}</div>
              <div className="l-meta"><span>{t('сводная таблица','reference table')}</span></div>
            </div>
            <div style={{alignSelf:'center', color:'var(--ink-3)'}}><Icon name="arrow" size={14}/></div>
          </button>
        ))}
      </div>

      <div className="spine">
        <span>Bangkok · Mae‑Sa · Made with <span className="heart">♥</span></span>
        <span>colophon · {t('второе издание','second edition')} · 2026</span>
      </div>
    </div>
  );
}

// LESSON VIEW (Day 1 detail)
function LessonView({ lesson, onOpen, lang, exerciseStyle }) {
  const t = (ru, en) => lang === 'EN' ? en : ru;
  const [activeSec, setActiveSec] = useState('intro');

  useEffect(() => {
    const ids = ['intro','consonants','vowels','tryit','spaces','exercise','summary'];
    const onScroll = () => {
      let cur = 'intro';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top < 140) cur = id;
      }
      setActiveSec(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tocItems = [
    { id: 'intro', label: 'Введение' },
    { id: 'consonants', label: 'Классные согласные' },
    { id: 'vowels', label: 'Долгие гласные' },
    { id: 'tryit', label: 'Попробуйте' },
    { id: 'spaces', label: 'Между нами — ни пробела' },
    { id: 'exercise', label: 'Тренировка' },
    { id: 'summary', label: 'Итоги дня' },
  ];

  return (
    <div className="lesson-view fade-in">
      <div className="lv-eyebrow">
        <span>{lesson.tag}</span>
        <span className="day">— {lesson.day}</span>
      </div>
      <h1 className="lv-title">{t(<>Система <em>классов</em></>, <>The class <em>system</em></>)}</h1>
      <p className="lv-deck">
        {lesson.deck || t(
          'Классы тайских согласных играют ключевую роль в определении тона каждого слога. Сегодня мы знакомимся с первой группой и семью долгими гласными — это половина того, что нужно, чтобы прочесть простую вывеску.',
          'Thai consonants come in classes — and the class decides a syllable\'s tone. Today: low‑class group 1, plus seven long vowels.'
        )}
      </p>

      <div className="lv-meta">
        <span>≈ <b>22 минуты</b></span>
        <span><b>4</b> аудио‑трека</span>
        <span><b>13</b> символов</span>
        <span><b>2</b> упражнения</span>
      </div>

      <article className="prose">
        <h3 id="intro"><span className="secnum">§ 1</span>Классные согласные</h3>
        <p className="drop">
          Классы тайских согласных играют ключевую роль в определении тона каждого слога — как мы узнаем в последующих главах. Существует <span className="thai-inline">3 класса</span>: <b>средний</b>, <b>высокий</b> и <b>низкий</b>. Низкий дополнительно делится на две подгруппы: группа 1 и группа 2.
        </p>
        <p>
          Каждый согласный принадлежит к одному из этих классов. Сегодня мы рассмотрим согласные «низкого класса 1» (LC1). Все согласные в тайском произносятся с гласным звуком <span className="thai-inline">‑อ</span> [‑or] в качестве их названия — например, буква <span className="thai-inline" style={{fontFamily:'var(--thai-loop)', fontSize:'1.15em'}}>น</span> называется /nor/.
        </p>

        <h3 id="consonants"><span className="secnum">§ 2</span>Низкий класс — группа 1</h3>
        <p>Семь согласных, с которых начнётся ваш путь. Нажмите на любую — услышите звук.</p>

        <CharGrid items={LC1} columns={7}/>

        <Player trackName="Трек 9 · LC1 · озвучка" duration={48}/>

        <blockquote className="note">
          Большинство тайских букв пишутся одним штрихом — всегда начинайте с «головки» (петельки). У некоторых букв головки нет — тогда просто пишите слева направо.
        </blockquote>

        <h3 id="vowels"><span className="secnum">§ 3</span>Долгая и короткая история</h3>
        <p>
          Долгие гласные произносятся с большей длительностью, чем краткие. Единственное различие между <i>ship</i> и <i>sheep</i> в стандартном английском — длительность 'ee'. То же и в тайском: длительность гласного меняет смысл слова.
        </p>
        <p>
          Позиция гласного внутри слога фиксирована: над, под, перед или после согласного. Символ <span style={{fontFamily:'var(--mono)'}}>(–)</span> в каждом гласном обозначает место, где располагается начальный согласный.
        </p>

        <CharGrid items={LONG_VOWELS} columns={6}/>

        <Player trackName="Трек 10 · долгие гласные" duration={32}/>

        <div className="practice-row">
          <VoiceTrainer/>
        </div>

        <div id="tryit" className="tryit">
          <div className="ti-eyebrow">Попробуйте · § 4</div>
          <h4>Прочитайте слоги вслух</h4>
          <p className="ti-deck">Сосредоточьтесь только на произношении — пока не пытайтесь переводить. Прочтите каждый слог сами, прежде чем нажать на карточку.</p>
          <SyllableTryIt items={SYL_PRACTICE}/>
          <Player trackName="Трек 11 · слоги" duration={42}/>
        </div>

        <h3 id="spaces"><span className="secnum">§ 5</span>Между нами — ни пробела</h3>
        <p>
          В тайском языке между словами нет пробелов. Пробел в тексте выполняет лишь роль точки или запятой, обозначая конец предложения или паузу. Вам придётся самостоятельно определять границы слогов.
        </p>
        <p>
          Но подождите — это не так сложно, как кажется! Большинство тайских слов имеют логичную структуру, которая ограничивает возможные варианты прочтения.
        </p>

        <div style={{display:'flex', justifyContent:'center', margin: '36px 0'}}>
          <div style={{
            fontFamily:'var(--thai-loop)', fontSize: 64, letterSpacing:'0.02em',
            color:'var(--ink)', position:'relative', padding: '8px 4px'
          }}>
            <span>รอ</span>
            <span style={{color:'var(--accent)', margin:'0 1px'}}>|</span>
            <span>นาย</span>
            <span style={{color:'var(--accent)', margin:'0 1px'}}>|</span>
            <span>มา</span>
          </div>
        </div>

        <div id="exercise" className="tryit">
          <div className="ti-eyebrow">Тренировка · § 6</div>
          <h4>{exerciseStyle === 'multichoice' ? 'Выбор из вариантов' : 'Карточки‑перевёртыши'}</h4>
          <p className="ti-deck">
            {exerciseStyle === 'multichoice'
              ? 'Услышьте звук — выберите правильный символ. Клавиатура: A · B · C · D.'
              : 'Тапните, чтобы перевернуть карточку. Оцените себя: снова, сложно, хорошо, легко (1–4).'}
          </p>
          {exerciseStyle === 'multichoice'
            ? <MultiChoice bank={MC_BANK}/>
            : <Flashcards items={LC1}/>}
        </div>

        <div id="summary" className="summary">
          <div className="stamp">✦ итоги дня · 6 ключевых пунктов</div>
          <h4>Что вы запомнили сегодня</h4>
          <ul>
            <li>Все 7 согласных LC1 и 6 долгих гласных в лицо.</li>
            <li>Согласные принадлежат к классам, и класс влияет на тон слога.</li>
            <li>У каждой буквы есть имя — это её собственный звук + ‑อ [‑or], напр. น называется /nor/.</li>
            <li>В тайском есть краткие и долгие гласные, и их позиция фиксирована.</li>
            <li>В финальной позиции ย звучит как [‑i], ว — как [‑o], а ร и ล меняют звучание на [‑n].</li>
            <li>В тайском между словами нет пробелов — пробел обозначает паузу или конец фразы.</li>
          </ul>
        </div>

        <div className="next-up">
          <div>
            <div className="nlabel">Завтра</div>
            <div className="nt">День 2 · <em>Вопрос жизни и смерти</em> — про живые и мёртвые слоги.</div>
          </div>
          <button className="btn" onClick={()=>onOpen({type:'lesson', id: 2})}>
            Открыть <Icon name="arrow" size={13}/>
          </button>
        </div>

        <div className="spine">
          <span><a onClick={()=>onOpen({type:'home'})} style={{color:'inherit', cursor:'pointer'}}><Icon name="arrowL" size={11}/> к оглавлению</a></span>
          <span>{lesson.day} · {lesson.title}</span>
        </div>
      </article>

      <aside className="toc">
        <div className="toc-label">в этой главе</div>
        {tocItems.map(it => (
          <a key={it.id} className={activeSec === it.id ? 'active' : ''}
             onClick={() => document.getElementById(it.id)?.scrollIntoView({behavior:'smooth', block:'start'})}>
            {it.label}
          </a>
        ))}
      </aside>
    </div>
  );
}

// APPENDIX VIEW
function AppendixView({ id, onOpen, lang }) {
  return (
    <div className="lesson-view fade-in">
      <div className="lv-eyebrow"><span>справочник</span><span className="day">— приложение I</span></div>
      <h1 className="lv-title">Сводка <em>тайских символов</em></h1>
      <p className="lv-deck">Все согласные сгруппированы по звучанию — как в начальной, так и в конечной позиции. Удобно для повторения.</p>
      <div className="lv-meta">
        <span><b>21</b> группа</span>
        <span><b>44</b> согласных</span>
        <span>сортировка по звуку</span>
      </div>
      <RefTable rows={APP1_CONSONANTS}/>
      <div className="spine">
        <span><a onClick={()=>onOpen({type:'home'})} style={{color:'inherit', cursor:'pointer'}}><Icon name="arrowL" size={11}/> к оглавлению</a></span>
        <span>приложение I · согласные</span>
      </div>
    </div>
  );
}

// GUIDE VIEW
function GuideView({ onOpen }) {
  return (
    <div className="lesson-view fade-in">
      <div className="lv-eyebrow"><span>начало</span><span className="day">— гид</span></div>
      <h1 className="lv-title">Гид по <em>произношению</em></h1>
      <p className="lv-deck">Как мы записываем тайские звуки в этой книге, и о чём договариваемся заранее.</p>
      <div className="lv-meta">
        <span><b>5</b> разделов</span>
        <span>≈ <b>8 мин</b> чтения</span>
      </div>
      <article className="prose">
        <h3><span className="secnum">§ 1</span>Транскрипция в этой книге</h3>
        <p className="drop">
          Мы используем латиницу там, где это помогает запомнить звук, и квадратные скобки <span style={{fontFamily:'var(--mono)'}}>[...]</span> — для строгой фонетической записи. Знак ː (как в [aː]) обозначает долгий гласный.
        </p>
        <h3><span className="secnum">§ 2</span>Тоны</h3>
        <p>В тайском пять тонов: средний, низкий, нисходящий, высокий и восходящий. Изменение тона меняет смысл слова.</p>
        <Player trackName="Трек 1 · 5 тонов" duration={28}/>
      </article>
      <div className="spine">
        <span><a onClick={()=>onOpen({type:'home'})} style={{color:'inherit', cursor:'pointer'}}><Icon name="arrowL" size={11}/> к оглавлению</a></span>
        <span>гид по произношению</span>
      </div>
    </div>
  );
}

// === MAIN APP ===
function App() {
  const [view, setView] = useState({ type: 'home' });
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('RU');
  const [menuOpen, setMenuOpen] = useState(false);
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  useThemePalette(theme, t.palette);

  // Apply Thai size globally
  useEffect(() => {
    const scale = t.thaiSize;
    document.documentElement.style.setProperty('--thai-scale', scale);
    // Inject a style override that scales .glyph elements
    let s = document.getElementById('thai-scale-style');
    if (!s) { s = document.createElement('style'); s.id = 'thai-scale-style'; document.head.appendChild(s); }
    s.textContent = `
      @media (min-width: 721px){
        .char-grid .ch .glyph{ font-size: ${56 * scale}px !important; }
        .syl .glyph{ font-size: ${32 * scale}px !important; }
        .card-face .glyph{ font-size: clamp(${120*scale}px, ${18*scale}vw, ${220*scale}px) !important; }
        .mc-q .glyph{ font-size: clamp(${120*scale}px, ${14*scale}vw, ${180*scale}px) !important; }
        .hero-plate .g{ font-size: clamp(${80*scale}px, ${12*scale}vw, ${160*scale}px) !important; }
      }
      @media (max-width: 720px){
        .char-grid .ch .glyph{ font-size: ${Math.round(40 * scale)}px !important; }
        .syl .glyph{ font-size: ${Math.round(26 * scale)}px !important; }
        .card-face .glyph{ font-size: clamp(${Math.round(90*scale)}px, ${Math.round(30*scale)}vw, ${Math.round(150*scale)}px) !important; }
        .mc-q .glyph{ font-size: clamp(${Math.round(90*scale)}px, ${Math.round(28*scale)}vw, ${Math.round(140*scale)}px) !important; }
        .hero-plate .g{ font-size: clamp(${Math.round(54*scale)}px, ${Math.round(16*scale)}vw, ${Math.round(100*scale)}px) !important; }
      }
    `;
  }, [t.thaiSize]);

  const onOpen = (v) => {
    setView(v);
    setMenuOpen(false);
    window.scrollTo({top: 0, behavior: 'instant'});
  };

  const lesson = useMemo(() => {
    if (view.type !== 'lesson') return null;
    return LESSONS.find(l => l.id === view.id) || LESSONS[0];
  }, [view]);

  const crumbs = (() => {
    if (view.type === 'home') return ['Читальня', 'Оглавление'];
    if (view.type === 'lesson') return ['Читальня', 'Уроки', lesson.day];
    if (view.type === 'appendix') return ['Читальня', 'Справочник', 'Прил. I'];
    if (view.type === 'guide') return ['Читальня', 'Начало', 'Гид'];
    return ['Читальня'];
  })();

  return (
    <>
      <div className={`rail-overlay ${menuOpen?'open':''}`} onClick={()=>setMenuOpen(false)}></div>
      <div className="app">
        <aside className={`rail ${menuOpen?'open':''}`}>
          <Brand/>
          <div className="nav-group">
            <div className="nav-label">Начало</div>
            {PROLOGUE.map(p => (
              <NavItem key={p.id} active={view.type === 'guide' && p.id === 'guide'}
                onClick={() => onOpen({type: p.id === 'guide' ? 'guide' : 'home'})}>
                {p.label}
              </NavItem>
            ))}
          </div>
          <div className="nav-group">
            <div className="nav-label">Уроки</div>
            {LESSONS.map((l, i) => {
              const idx = !l.special ? LESSONS.filter((x,j) => !x.special && j <= i).length : null;
              const done = l.progress >= 1;
              const active = view.type === 'lesson' && view.id === l.id;
              return (
                <NavItem key={l.id} active={active} done={done} num={idx}
                  onClick={() => onOpen({type:'lesson', id: l.id})}>
                  {l.special ? l.title : `${l.day}: ${l.title}`}
                </NavItem>
              );
            })}
          </div>
          <div className="nav-group">
            <div className="nav-label">Справочник</div>
            {APPENDIX.map((a, i) => (
              <NavItem key={a.id}
                active={view.type === 'appendix' && view.id === a.id}
                onClick={()=>onOpen({type:'appendix', id: a.id})}>
                Приложение {['I','II','III','IV'][i]}: {a.label}
              </NavItem>
            ))}
          </div>

          <div className="progress-card">
            <div className="pc-label">Твой путь</div>
            <div className="pc-num"><em>27%</em></div>
            <div className="pc-sub">11 из 85 треков · 2 урока в работе</div>
            <div className="progress-bar"><div style={{width: '27%'}}></div></div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <button className="icon-btn menu-toggle" onClick={()=>setMenuOpen(o=>!o)}>
                <Icon name={menuOpen?'close':'menu'} size={18}/>
              </button>
              <div className="crumbs">
                {crumbs.map((c, i) => (
                  <React.Fragment key={i}>
                    <span className={i===crumbs.length-1?'now':''}>{c}</span>
                    {i < crumbs.length - 1 && <span className="sep">/</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="top-actions">
              <div className="lang">
                <button className={lang==='RU'?'active':''} onClick={()=>setLang('RU')}>RU</button>
                <button className={lang==='EN'?'active':''} onClick={()=>setLang('EN')}>EN</button>
              </div>
              <div className="seg">
                <button className={`icon-btn ${theme==='light'?'active':''}`} onClick={()=>setTheme('light')} title="Светлая">
                  <Icon name="sun"/>
                </button>
                <button className={`icon-btn ${theme==='dark'?'active':''}`} onClick={()=>setTheme('dark')} title="Тёмная">
                  <Icon name="moon"/>
                </button>
              </div>
              <button className="icon-btn" onClick={()=>onOpen({type:'home'})} title="Главная">
                <Icon name="home"/>
              </button>
            </div>
          </div>

          {view.type === 'home' && <HomeView onOpen={onOpen} lang={lang}/>}
          {view.type === 'lesson' && <LessonView lesson={lesson} onOpen={onOpen} lang={lang} exerciseStyle={t.exerciseStyle}/>}
          {view.type === 'appendix' && <AppendixView id={view.id} onOpen={onOpen} lang={lang}/>}
          {view.type === 'guide' && <GuideView onOpen={onOpen}/>}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Палитра">
          <div className="palette-row">
            {Object.entries(PALETTES).map(([k, p]) => (
              <button key={k} className={`pal ${t.palette===k?'active':''}`}
                style={{background: p.accent}} onClick={()=>setT('palette', k)} title={p.label}/>
            ))}
          </div>
        </TweakSection>
        <TweakSection label="Тайские символы">
          <TweakSlider label="Размер" value={Math.round(t.thaiSize*100)} min={70} max={140} step={5} unit="%"
            onChange={(v)=>setT('thaiSize', v/100)}/>
        </TweakSection>
        <TweakSection label="Тренировка">
          <TweakRadio label="Стиль" value={t.exerciseStyle}
            options={['flashcards','multichoice']}
            onChange={(v)=>setT('exerciseStyle', v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
