import { CalendarDays, Clock3, Search, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import PreviousViewChart from '../PreviousViewChart';
import { HomeGame, resultIsCurrent, useHomepageResults } from '../../hooks/useHomepageResults';
import './home-experience.css';

type Theme = 'premium' | 'glass' | 'editorial';
type HomeExperienceProps = {
  theme: Theme;
  domain: string;
};
const gameName = (game?: HomeGame | null) => game?.nickName || game?.name || 'Scheduled game';
const latestView = (latest: any) => latest ? { name: latest.name || latest.gameName || 'Latest game', result: latest.result || latest.publishedNumber || '—', time: latest.time || 'Time not set', date: latest.formattedDate || 'Today' } : null;

function ResultCard({ game, next, sessionDate, onChart }: { game: HomeGame; next: boolean; sessionDate: string; onChart: () => void }) {
  const declared = Boolean(game.hasResult && game.result && resultIsCurrent(game, sessionDate));
  return <article className={`hx-game ${next ? 'is-next' : ''}`}>
    <div className="hx-game-top"><span className="hx-symbol" aria-hidden="true">5</span><span className={`hx-status ${declared ? 'declared' : 'upcoming'}`}>{declared ? '● Result declared' : next ? '◉ Up next' : '○ Upcoming'}</span></div>
    <h3>{gameName(game)}</h3><p className="hx-time"><Clock3 size={16} /> {game.resultTime || 'Time not set'}</p>
    <div className="hx-number" aria-live="polite">{declared ? game.result : <span>Awaiting result</span>}</div>
    <button className="hx-button" onClick={onChart} aria-label={`View ${gameName(game)} chart`}><Search size={17} /> View Chart</button>
  </article>;
}

export default function HomeExperience({ theme, domain }: HomeExperienceProps) {
  const data = useHomepageResults(); const latest = latestView(data.latestResult);
  const title = theme === 'glass' ? 'Results, at the speed of now.' : theme === 'editorial' ? "Today’s Results Board" : 'Live results. Clearly delivered.';
  const [domainName, domainExtension] = domain.split(/\.(.+)/);
  const [brandPrefix, brandBase = domainName] = domainName.split('-');
  const brandSuffix = domainExtension ? `${brandBase}.${domainExtension}` : brandBase;
  const scrollToViewChart = () => {
    document.getElementById('view-chart')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    document.title = domain;
    return () => {
      document.title = 'Satta Bazaar';
    };
  }, [domain]);

  return <div className={`hx hx-${theme}`}>
    {theme === 'editorial' ? <header className="hx-editorial-header">
      <div className="hx-editorial-utility"><span>India’s Live Results Journal</span><div className="hx-live"><i /> Results service online</div><span>{data.dateLabel}</span></div>
      <div className="hx-editorial-masthead">
        <Link to="/" className="hx-editorial-mark" aria-label={`${domain} home`}><span>{brandPrefix}</span><div><strong>{brandSuffix}</strong><small>The Royal Results Chronicle</small></div></Link>
        <div className="hx-editorial-seal" aria-hidden="true"><Trophy size={22}/><span>LIVE</span></div>
      </div>
      <nav className="hx-editorial-nav" aria-label="Primary navigation"><a href="#editorial-latest">Latest Result</a><a href="#editorial-board">Today’s Board</a><Link to="/archives?theme=editorial">Result Archives</Link></nav>
    </header> : <header className="hx-header"><Link className="hx-brand" to="/" aria-label={`${domain} home`}><span>{brandPrefix}</span><strong>{brandSuffix}</strong></Link><div className="hx-live"><i /> Live result service</div><Link to={`/archives?theme=${theme}`} className="hx-navlink">Archives</Link></header>}
    {theme === 'editorial' && <div className="hx-announcement">Verified live updates · Historical charts · Play responsibly · 18+ only</div>}
    <main>
      <section className="hx-hero" aria-labelledby={`${theme}-title`}>
        <div className="hx-intro"><p className="hx-kicker">{theme === 'editorial' ? 'Live Results' : `${domain} · Official Board`}</p><h1 id={`${theme}-title`}>{title}</h1><p>Accurate game results, current schedules and historical charts in one trusted destination.</p><div className="hx-date"><CalendarDays size={18} /> {data.dateLabel}<span>•</span><span className="hx-live"><i /> Live</span></div></div>
        <section className="hx-latest" aria-labelledby={`${theme}-latest`}><div className="hx-latest-label"><Trophy size={19}/><h2 id={`${theme}-latest`}>Latest Result</h2></div>
          <div className="hx-latest-body" aria-live="polite" aria-busy={data.loading}>
            {data.loading ? <div className="hx-skeleton"><i/><i/><i/></div> : latest ? <><div><strong>{latest.name}</strong><span>{latest.time} · {latest.date}</span></div><b>{latest.result}</b></> : <div className="hx-wait"><span className="hx-loader"/>Result will be available shortly.</div>}
          </div>
        </section>
        {theme === 'glass' && <div className="hx-tiles"><div><b>{data.games.length}</b><span>Scheduled games</span></div><div><b>{data.nextGame?.resultTime || '—'}</b><span>Next result</span></div></div>}
      </section>
      {data.error && <div className="hx-error" role="alert">{data.error}<button onClick={() => location.reload()}>Retry</button></div>}
      {data.nextGame && <aside className="hx-next"><div><Sparkles size={18}/><span>Next Game Announcement</span><strong>{gameName(data.nextGame)}</strong></div><div><small>Result time</small><b>{data.nextGame.resultTime || 'Time not set'}</b></div></aside>}
      <section className="hx-featured" aria-label="Game schedule"><p>Discover the schedule</p><div className="hx-feature-strip">{data.games.slice(0, 3).map(game => <button key={game._id} onClick={scrollToViewChart}><span>{gameName(game)}</span><small>{game.resultTime || 'Time pending'}</small></button>)}</div></section>
      <section className="hx-board" aria-labelledby={`${theme}-board`}><div className="hx-section-head"><div><p>Updated throughout the day</p><h2 id={`${theme}-board`}>Today’s Results Board</h2></div><span>{data.dateLabel}</span></div>
        {data.loading ? <div className="hx-grid" aria-label="Fetching the latest results"><div className="hx-game hx-loading"/><div className="hx-game hx-loading"/><div className="hx-game hx-loading"/></div> : data.games.length ? <div className="hx-grid">{data.games.map(game => <ResultCard key={game._id} game={game} next={data.nextGame?._id === game._id} sessionDate={data.sessionDate} onChart={scrollToViewChart}/>)}</div> : <p className="hx-empty">No scheduled games are available right now.</p>}
      </section>
      <div className="hx-filter"><PreviousViewChart games={data.games}/></div>
    </main>
    <footer className="hx-footer"><div className="hx-brand"><span>{brandPrefix}</span><strong>{brandSuffix}</strong></div><p>© 2026 {domain} Live Results. All Rights Reserved.</p><p><ShieldCheck size={15}/> Play Responsibly · 18+ Only · Gambling Can Be Addictive</p><nav aria-label="Legal"><a href="#terms">Terms &amp; Conditions</a><a href="#privacy">Privacy Policy</a><a href="#responsible">Responsible Gaming</a><Link to={`/archives?theme=${theme}`}>Archives</Link></nav></footer>
  </div>;
}
