import { useEffect, useMemo, useState } from 'react';

const gems = [{ x: 27, y: 29 }, { x: 72, y: 28 }, { x: 30, y: 48 }, { x: 68, y: 58 }, { x: 27, y: 69 }, { x: 74, y: 69 }, { x: 48, y: 38 }, { x: 40, y: 65 }, { x: 69, y: 39 }];
const makeBosses = (level: number) => Array.from({ length: level < 2 ? 0 : Math.min(3, 1 + Math.floor((level - 2) / 2)) }, (_, i) => ({ x: 25 + i * 25, y: 14 + i * 5 }));
type IslandBoss = { x: number; y: number; hp: number; maxHp: number; kind: 'captain' | 'demogorgon' } | null;
type Difficulty = 'easy' | 'normal' | 'hard';
const levelTime = (level: number, difficulty: Difficulty) => Math.max(20, 70 - (level - 1) * 7 + (difficulty === 'easy' ? 20 : difficulty === 'hard' ? -15 : 0));
const skins = [{ id: '🧑', name: 'Исследователь', cost: 0 }, { id: '🧙', name: 'Маг', cost: 5 }, { id: '🥷', name: 'Ниндзя', cost: 10 }, { id: '🦸', name: 'Супергерой', cost: 18 }];
const weapons = [{ id: '⚔️', name: 'Меч', cost: 0 }, { id: '🪓', name: 'Топор', cost: 8 }, { id: '🗡️', name: 'Золотой меч', cost: 15 }, { id: '🔱', name: 'Трезубец волн', cost: 60 }];

export function AdventurePage({ onHome }: { onHome: () => void }) {
  const [started, setStarted] = useState(false);
  const [player, setPlayer] = useState({ x: 50, y: 82 });
  const [collected, setCollected] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(70);
  const [gold, setGold] = useState(3);
  const [bosses, setBosses] = useState<{ x: number; y: number }[]>([]);
  const [attacking, setAttacking] = useState(false);
  const [drowned, setDrowned] = useState(false);
  const [islandBoss, setIslandBoss] = useState<IslandBoss>(null);
  const [crystalBank, setCrystalBank] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState(['🧑']);
  const [ownedWeapons, setOwnedWeapons] = useState(['⚔️']);
  const [skin, setSkin] = useState('🧑');
  const [weapon, setWeapon] = useState('⚔️');
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [finisher, setFinisher] = useState<{ x: number; y: number; kind: 'captain' | 'demogorgon' } | null>(null);
  const keys = useMemo(() => new Set<string>(), []);
  const activeGems = gems.slice(0, Math.min(gems.length, 4 + level));
  const bossTier = Math.max(1, Math.floor(level / 3));

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.add(event.key.toLowerCase());
      if (event.code === 'Space' && collected.length === activeGems.length) {
        event.preventDefault(); setAttacking(true); window.setTimeout(() => setAttacking(false), 220);
        const attackRange = weapon === '🔱' ? 28 : 13;
        setBosses((current) => {
          const target = current.map((boss, index) => ({ index, distance: Math.hypot(player.x - boss.x, player.y - boss.y) })).sort((a, b) => a.distance - b.distance)[0];
          return weapon === '🔱' ? current.filter((boss) => Math.hypot(player.x - boss.x, player.y - boss.y) >= attackRange) : target && target.distance < attackRange ? current.filter((_, index) => index !== target.index) : current;
        });
        setIslandBoss((boss) => boss && Math.hypot(player.x - boss.x, player.y - boss.y) < (weapon === '🔱' ? 28 : 15) ? { ...boss, hp: boss.hp - (weapon === '🔱' ? 2 : 1) } : boss);
      }
    };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const timer = window.setInterval(() => setPlayer((old) => {
      if (!started || gameOver) return old;
      if (drowned) return old;
      const dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      const dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
      const candidate = { x: Math.max(5, Math.min(95, old.x + dx * .95)), y: Math.max(8, Math.min(91, old.y + dy * .95)) };
      const onIsland = ((candidate.x - 50) / 44) ** 2 + ((candidate.y - 50) / 41) ** 2 <= 1;
      if (!onIsland) {
        setDrowned(true); setLives((amount) => { if (amount <= 1) setGameOver(true); return Math.max(0, amount - 1); });
        window.setTimeout(() => { setPlayer({ x: 50, y: 82 }); setDrowned(false); }, 900);
      }
      const next = candidate;
      setBosses((current) => current.map((boss) => {
        const speed = (.18 + level * .03) * (difficulty === 'easy' ? .72 : difficulty === 'hard' ? 1.38 : 1);
        const distance = Math.max(1, Math.hypot(next.x - boss.x, next.y - boss.y));
        return { x: boss.x + (next.x - boss.x) / distance * speed, y: boss.y + (next.y - boss.y) / distance * speed };
      }));
      setIslandBoss((boss) => {
        if (!boss || collected.length < activeGems.length) return boss;
        const distance = Math.max(1, Math.hypot(next.x - boss.x, next.y - boss.y));
        const speed = (.12 + level * .012) * (difficulty === 'easy' ? .72 : difficulty === 'hard' ? 1.38 : 1);
        return { ...boss, x: boss.x + (next.x - boss.x) / distance * speed, y: boss.y + (next.y - boss.y) / distance * speed };
      });
      return next;
    }), 40);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [keys, level, collected.length, activeGems.length, player, drowned, started, gameOver, difficulty, weapon]);

  useEffect(() => {
    if (!islandBoss || islandBoss.hp > 0) return;
    setFinisher({ x: islandBoss.x, y: islandBoss.y, kind: islandBoss.kind });
    setIslandBoss(null); window.setTimeout(() => setFinisher(null), 1100);
  }, [islandBoss]);

  useEffect(() => {
    if (won || !started || gameOver) return;
    const timer = window.setInterval(() => setTimeLeft((time) => {
      if (time <= 1) { setPlayer({ x: 50, y: 82 }); setCollected([]); return levelTime(level, difficulty); }
      return time - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [won, level, started, gameOver, difficulty]);

  useEffect(() => {
    activeGems.forEach((gem, index) => {
      if (!collected.includes(index) && Math.hypot(player.x - gem.x, player.y - gem.y) < 6) { setCollected((old) => [...old, index]); setCrystalBank((amount) => amount + 1); }
    });
    if (collected.length === activeGems.length && bosses.length === 0 && !islandBoss && Math.hypot(player.x - 50, player.y - 12) < 8) setWon(true);
  }, [player, collected, activeGems, bosses.length, islandBoss]);

  useEffect(() => {
    const caught = bosses.findIndex((boss) => Math.hypot(player.x - boss.x, player.y - boss.y) < 5);
    if (caught < 0) return;
    setLives((amount) => { if (amount <= 1) setGameOver(true); return Math.max(0, amount - 1); });
    setPlayer({ x: 50, y: 82 });
    setBosses((current) => current.map((boss, index) => index === caught ? { x: 18 + index * 30, y: 12 } : boss));
  }, [bosses, player]);

  useEffect(() => {
    if (!islandBoss || collected.length < activeGems.length || Math.hypot(player.x - islandBoss.x, player.y - islandBoss.y) >= 6) return;
    const damage = islandBoss.kind === 'demogorgon' ? 3 : Math.min(3, bossTier);
    setLives((amount) => { if (amount <= damage) setGameOver(true); return Math.max(0, amount - damage); });
    setIslandBoss((boss) => boss ? { ...boss, x: 50, y: 18 } : null);
  }, [islandBoss, player, collected.length, activeGems.length, bossTier]);

  const restart = () => { setPlayer({ x: 50, y: 82 }); setCollected([]); setLives(5); setGameOver(false); setTimeLeft(levelTime(level, difficulty)); setWon(false); };
  const nextLevel = () => { const next = level + 1; const tier = Math.floor(next / 3); const bossHp = 5 + tier * 5; const demogorgonHp = 18 + Math.floor(next / 10) * 8; setLevel(next); setLives(5); setGold((amount) => amount + level * 2); setBosses(makeBosses(next)); setIslandBoss(next % 10 === 0 ? { x: 50, y: 18, hp: demogorgonHp, maxHp: demogorgonHp, kind: 'demogorgon' } : next % 3 === 0 ? { x: 50, y: 18, hp: bossHp, maxHp: bossHp, kind: 'captain' } : null); setTimeLeft(levelTime(next, difficulty)); setPlayer({ x: 50, y: 82 }); setCollected([]); setWon(false); };
  const newGame = () => { setLevel(1); setLives(5); setGold(3); setBosses([]); setIslandBoss(null); setCollected([]); setPlayer({ x: 50, y: 82 }); setTimeLeft(levelTime(1, difficulty)); setWon(false); setGameOver(false); setStarted(true); };
  const buySkin = (item: typeof skins[number]) => { if (ownedSkins.includes(item.id)) return setSkin(item.id); if (crystalBank >= item.cost) { setCrystalBank((v) => v - item.cost); setOwnedSkins((v) => [...v, item.id]); setSkin(item.id); } };
  const buyWeapon = (item: typeof weapons[number]) => { if (ownedWeapons.includes(item.id)) return setWeapon(item.id); if (crystalBank >= item.cost) { setCrystalBank((v) => v - item.cost); setOwnedWeapons((v) => [...v, item.id]); setWeapon(item.id); } };
  return <main className="adventure-page">
    <header className="adventure-header"><button onClick={() => setStarted(false)}>☰ Меню</button><div><b>Уровень {level}</b><strong>❤️ {lives}/5&nbsp;&nbsp; 🪙 {gold}&nbsp;&nbsp; ⏳ {timeLeft} с&nbsp;&nbsp; 💎 {collected.length}/{activeGems.length}</strong><span>Остров сокровищ</span></div></header>
    <section className="adventure-world">
      <div className="adventure-camera" style={{ transform: `translate(${(50 - player.x) * .58}%, ${(50 - player.y) * .58}%) scale(1.7)` }}>
      <div className="adventure-sea" /><div className="adventure-island" />
      <div className="adventure-temple" style={{ left: '50%', top: '10%' }}><i />{collected.length < activeGems.length || bosses.length > 0 || islandBoss ? '🔒' : '🎁'}</div>
      {[{x:8,y:30},{x:86,y:38},{x:42,y:28},{x:55,y:66},{x:80,y:76},{x:22,y:37},{x:72,y:78},{x:35,y:82},{x:90,y:55},{x:62,y:22}].map((tree,i)=><span className="adventure-tree" key={i} style={{left:`${tree.x}%`,top:`${tree.y}%`}}>🌴</span>)}
      {activeGems.map((gem, index) => !collected.includes(index) && <span className="adventure-gem" key={index} style={{ left: `${gem.x}%`, top: `${gem.y}%` }}>💎</span>)}
      {bosses.map((boss, index) => <div className="adventure-boss adventure-pirate" key={index} style={{ left: `${boss.x}%`, top: `${boss.y}%` }}><i>ПИРАТ</i><span>🏴‍☠️</span><b>🪙</b></div>)}
      {islandBoss && collected.length === activeGems.length && <div className={`adventure-captain${islandBoss.kind === 'demogorgon' ? ' adventure-demogorgon' : ''}`} style={{ left: `${islandBoss.x}%`, top: `${islandBoss.y}%`, scale: islandBoss.kind === 'demogorgon' ? `${1.55 + Math.floor(level / 10) * .12}` : `${1 + (bossTier - 1) * .22}` }}><i><em style={{ width: `${islandBoss.hp / islandBoss.maxHp * 100}%` }} /></i><strong>{islandBoss.kind === 'demogorgon' ? `ДЕМОГОРГОН ★${Math.floor(level / 10)}` : `КАПИТАН ★${bossTier}`}</strong>{islandBoss.kind === 'demogorgon' ? <span className="demogorgon-model"><i className="demogorgon-head"><em/><em/><em/><em/><em/><b/></i><i className="demogorgon-body"/><i className="demogorgon-arm demogorgon-arm--left"/><i className="demogorgon-arm demogorgon-arm--right"/><i className="demogorgon-legs"/></span> : <span>{bossTier >= 3 ? '👹' : '🦹‍☠️'}</span>}<b>{islandBoss.kind === 'demogorgon' ? '☠' : '⚔️'}</b></div>}
      {finisher && <div className={`adventure-finisher adventure-finisher--${finisher.kind}`} style={{ left: `${finisher.x}%`, top: `${finisher.y}%` }}><i>ДОБИВАНИЕ!</i><span>{weapon}</span><b>✦</b></div>}
      <div className={`adventure-player${attacking ? ' adventure-player--attack' : ''}${attacking && weapon === '🔱' ? ' adventure-player--wave' : ''}${drowned ? ' adventure-player--drowned' : ''}`} style={{ left: `${player.x}%`, top: `${player.y}%` }}><i className="adventure-player__shadow"/><span>{drowned ? '🫧' : skin}</span>{collected.length === activeGems.length && !drowned && <b>{weapon}</b>}</div>
      </div>
      <div className="adventure-help">WASD или стрелки — движение<br/>{collected.length < activeGems.length ? `Собери ${activeGems.length} кристаллов, чтобы получить меч!` : islandBoss ? '☠️ БОСС-ФАЙТ! Бей капитана ПРОБЕЛОМ!' : bosses.length ? '⚔️ Нажимай ПРОБЕЛ рядом с пиратом!' : 'Все пираты побеждены — иди к храму!'}</div>
    </section>
    {won && <div className="adventure-win"><div><span>🏆</span><h2>Уровень {level} пройден!</h2><p>Следующий уровень будет сложнее.</p><button onClick={nextLevel}>Следующий уровень</button><button onClick={restart}>Повторить</button></div></div>}
    {gameOver && <div className="adventure-win adventure-lose"><div><span>💀</span><h2>Жизни закончились!</h2><p>Пираты победили. Попробуй ещё раз.</p><button onClick={restart}>Повторить уровень</button></div></div>}
    {!started && <div className="adventure-menu"><div className="adventure-menu__card"><span>🏴‍☠️ 🏝️</span><small>3D-ПРИКЛЮЧЕНИЕ</small><h1>Остров сокровищ</h1><div className="adventure-difficulty"><b>Сложность:</b>{(['easy','normal','hard'] as Difficulty[]).map((mode) => <button className={difficulty === mode ? 'selected' : ''} onClick={() => { setDifficulty(mode); setTimeLeft(levelTime(level, mode)); }} key={mode}>{mode === 'easy' ? '🌿 Легко' : mode === 'normal' ? '⚔️ Нормально' : '💀 Сложно'}</button>)}</div><div className="adventure-shop"><h3>💎 {crystalBank} &nbsp; Скины</h3><div>{skins.map((item) => <button className={skin === item.id ? 'selected' : ''} disabled={!ownedSkins.includes(item.id) && crystalBank < item.cost} onClick={() => buySkin(item)} key={item.name}><i>{item.id}</i><small>{item.name}</small><b>{ownedSkins.includes(item.id) ? 'Выбрать' : `💎 ${item.cost}`}</b></button>)}</div><h3>Оружие</h3><div>{weapons.map((item) => <button className={weapon === item.id ? 'selected' : ''} disabled={!ownedWeapons.includes(item.id) && crystalBank < item.cost} onClick={() => buyWeapon(item)} key={item.name}><i>{item.id}</i><small>{item.name}</small><b>{ownedWeapons.includes(item.id) ? 'Выбрать' : `💎 ${item.cost}`}</b></button>)}</div></div><div className="adventure-menu__controls"><b>WASD / Стрелки</b> — движение &nbsp; <b>Пробел</b> — удар</div><button onClick={() => setStarted(true)}>▶ Продолжить: уровень {level}</button><button className="adventure-menu__new" onClick={newGame}>↻ Новая игра</button><button className="adventure-menu__home" onClick={onHome}>Все игры</button></div></div>}
  </main>;
}
