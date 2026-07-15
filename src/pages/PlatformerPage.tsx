import { useEffect, useMemo, useRef, useState } from 'react';

type Hero = { x: number; y: number; vx: number; vy: number };
const PLATFORMS = [
  { x: 0, y: 88, w: 100 }, { x: 18, y: 70, w: 16 }, { x: 42, y: 56, w: 15 },
  { x: 66, y: 69, w: 12 }, { x: 82, y: 48, w: 13 },
];
const COINS = [{ x: 24, y: 62 }, { x: 48, y: 48 }, { x: 70, y: 61 }, { x: 87, y: 40 }];

export function PlatformerPage({ onHome }: { onHome: () => void }) {
  const [hero, setHero] = useState<Hero>({ x: 6, y: 78, vx: 0, vy: 0 });
  const [coins, setCoins] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [bossHealth, setBossHealth] = useState(0);
  const [fireballs, setFireballs] = useState<{ id: number; x: number; y: number }[]>([]);
  const keys = useRef(new Set<string>());
  const lastHit = useRef(0);
  const lastBossHit = useRef(0);
  const platforms = useMemo(() => PLATFORMS.map((platform, index) => ({ ...platform, w: index === 0 ? platform.w : Math.max(8, platform.w - (level - 1) * 1.1) })), [level]);
  const spikes = level >= 2 ? [{ x: 36, y: 84 }, ...(level >= 3 ? [{ x: 60, y: 84 }] : [])] : [];
  const bossLevel = level % 3 === 0;

  useEffect(() => setBossHealth(bossLevel ? 3 + Math.floor(level / 3) : 0), [level, bossLevel]);

  useEffect(() => {
    if (!bossLevel || bossHealth <= 0 || won) { setFireballs([]); return; }
    const attack = window.setInterval(() => setFireballs((current) => [...current, { id: Date.now(), x: 80, y: 68 }]), Math.max(700, 1700 - level * 90));
    return () => window.clearInterval(attack);
  }, [bossLevel, bossHealth, level, won]);

  useEffect(() => {
    const movement = window.setInterval(() => setFireballs((current) => current.map((ball) => ({ ...ball, x: ball.x - 1.6 - level * .08 })).filter((ball) => ball.x > 0)), 70);
    return () => window.clearInterval(movement);
  }, [level]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current.add(event.key.toLowerCase()); if (event.key.startsWith('Arrow')) event.preventDefault(); };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const loop = window.setInterval(() => setHero((current) => {
      if (won) return current;
      let vx = 0; let vy = current.vy + Math.min(1.05, .72 + level * .055);
      if (keys.current.has('a') || keys.current.has('arrowleft')) vx = -1.2;
      if (keys.current.has('d') || keys.current.has('arrowright')) vx = 1.2;
      const standing = platforms.some((platform) => current.x + 3 > platform.x && current.x < platform.x + platform.w && Math.abs(current.y + 10 - platform.y) < 2);
      if ((keys.current.has('w') || keys.current.has('arrowup') || keys.current.has(' ')) && standing) vy = -5.4;
      let x = Math.max(0, Math.min(96, current.x + vx)); let y = current.y + vy;
      for (const platform of platforms) {
        const crossed = current.y + 10 <= platform.y && y + 10 >= platform.y;
        if (crossed && x + 3 > platform.x && x < platform.x + platform.w && vy >= 0) { y = platform.y - 10; vy = 0; }
      }
      COINS.forEach((coin, index) => { if (!coins.includes(index) && Math.hypot(x - coin.x, y - coin.y) < 6) setCoins((found) => [...found, index]); });
      if (spikes.some((spike) => Math.abs(x - spike.x) < 4 && y > 74)) return { x: 6, y: 78, vx: 0, vy: 0 };
      const hitEnemy = Array.from({ length: Math.min(3, level) }, (_, index) => 53 + index * 15).some((enemyX) => Math.abs(x - enemyX) < 9 && y > 70);
      if (hitEnemy && Date.now() - lastHit.current > 1200) {
        lastHit.current = Date.now();
        setLives((value) => Math.max(0, value - 1));
        return { x: 6, y: 78, vx: 0, vy: 0 };
      }
      const hitByFire = fireballs.some((ball) => Math.abs(x - ball.x) < 5 && Math.abs(y - ball.y) < 9);
      if (hitByFire && Date.now() - lastHit.current > 1200) {
        lastHit.current = Date.now(); setLives((value) => Math.max(0, value - 1)); setFireballs([]); return { x: 6, y: 78, vx: 0, vy: 0 };
      }
      if (bossLevel && bossHealth > 0 && Math.abs(x - 84) < 8 && y > 48) {
        if (vy > 0 && y < 66 && Date.now() - lastBossHit.current > 500) {
          lastBossHit.current = Date.now(); setBossHealth((value) => Math.max(0, value - 1)); vy = -5; y = 48;
        } else if (Date.now() - lastHit.current > 1200) {
          lastHit.current = Date.now(); setLives((value) => Math.max(0, value - 1)); return { x: 6, y: 78, vx: 0, vy: 0 };
        }
      }
      if (x > 91 && y < 48 && (!bossLevel || bossHealth <= 0)) setWon(true);
      if (y > 100) return { x: 6, y: 78, vx: 0, vy: 0 };
      return { x, y, vx, vy };
    }), 32);
    return () => window.clearInterval(loop);
  }, [coins, won, level, platforms, bossLevel, bossHealth, fireballs]);

  const moveButton = (key: string, pressed: boolean) => pressed ? keys.current.add(key) : keys.current.delete(key);
  return <main className="platformer-page"><header><button onClick={onHome}>← Главная</button><h1>Приключение Прыгуна</h1><strong>Уровень {level}</strong><b>❤️ {lives}　🪙 {coins.length} / {COINS.length}</b></header>
    <section className="platformer-world">
      <div className="platformer-clouds">☁️　　　　☁️　　　　　　☁️</div><div className="platformer-hills" />
      {platforms.map((platform, index) => <div key={index} className="platform" style={{ left: `${platform.x}%`, top: `${platform.y}%`, width: `${platform.w}%` }} />)}
      {COINS.map((coin, index) => !coins.includes(index) && <i key={index} className="platform-coin" style={{ left: `${coin.x}%`, top: `${coin.y}%` }}>●</i>)}
      {Array.from({ length: Math.min(3, level) }, (_, index) => <div key={index} className="platform-enemy platform-goomba" style={{ left: `${48 + index * 15}%`, animationDuration: `${Math.max(.7, 2.2 - level * .25)}s` }}><i /><span /></div>)}{spikes.map((spike, index) => <div key={index} className="platform-spike" style={{ left: `${spike.x}%`, top: `${spike.y}%` }}>▲▲</div>)}<div className="platform-flag">🚩</div>
      {bossLevel && bossHealth > 0 && <div className="platform-boss platform-bowser"><div className="platform-boss__hp"><i style={{ width: `${bossHealth / (3 + Math.floor(level / 3)) * 100}%` }} /></div><u className="bowser-shell" /><span className="bowser-head"><i /><em /></span><strong className="bowser-body" /><b>БОУЗЕР</b></div>}
      {fireballs.map((ball) => <div key={ball.id} className="bowser-fireball" style={{ left: `${ball.x}%`, top: `${ball.y}%` }} />)}
      <div className={`platform-hero${Math.abs(hero.vy) > .2 ? ' platform-hero--jumping' : Math.abs(hero.vx) > .1 ? ' platform-hero--running' : ''}`} style={{ left: `${hero.x}%`, top: `${hero.y}%` }}><span><u /><em /></span><small className="hero-arms" /><b /></div>
      {won && <div className="platform-win"><h2>Уровень {level} пройден! 🏆</h2><button onClick={() => { setLevel((value) => value + 1); setHero({ x: 6, y: 78, vx: 0, vy: 0 }); setCoins([]); setWon(false); }}>Следующий уровень</button></div>}
      {lives <= 0 && <div className="platform-win"><h2>Гумбы победили!</h2><button onClick={() => { setLives(3); setLevel(1); setHero({ x: 6, y: 78, vx: 0, vy: 0 }); setCoins([]); }}>Начать заново</button></div>}
    </section>
    <footer className="platform-controls"><button onPointerDown={() => moveButton('a', true)} onPointerUp={() => moveButton('a', false)}>←</button><button onPointerDown={() => moveButton('w', true)} onPointerUp={() => moveButton('w', false)}>Прыжок</button><button onPointerDown={() => moveButton('d', true)} onPointerUp={() => moveButton('d', false)}>→</button><span>Управление: WASD или стрелки</span></footer>
  </main>;
}
