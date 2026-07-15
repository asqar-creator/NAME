import { useEffect, useState } from 'react';
import { CraftingTable, Recipe } from '../components/CraftingTable';

const PHASE_SECONDS = 18;
const INITIAL_TREES = [
  { id: 1, x: 12, y: 24 }, { id: 2, x: 28, y: 32 }, { id: 3, x: 36, y: 68 },
  { id: 4, x: 66, y: 25 }, { id: 5, x: 82, y: 34 }, { id: 6, x: 76, y: 72 },
  { id: 7, x: 18, y: 72 }, { id: 8, x: 55, y: 18 }, { id: 9, x: 91, y: 63 },
];

export function ForestPage({ onHome }: { onHome: () => void }) {
  const [night, setNight] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [time, setTime] = useState(PHASE_SECONDS);
  const [wood, setWood] = useState(4);
  const [fire, setFire] = useState(70);
  const [health, setHealth] = useState(100);
  const [message, setMessage] = useState('Собери дрова до наступления ночи');
  const [position, setPosition] = useState({ x: 43, y: 70 });
  const [deerPosition, setDeerPosition] = useState({ x: 8, y: 38 });
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [axeEquipped, setAxeEquipped] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [craftOpen, setCraftOpen] = useState(false);
  const [torches, setTorches] = useState(0);
  const [walls, setWalls] = useState(0);
  const [torchEquipped, setTorchEquipped] = useState(false);
  const [placedWalls, setPlacedWalls] = useState<{ id: number; x: number; y: number }[]>([]);
  const [seeds, setSeeds] = useState(0);
  const [saplings, setSaplings] = useState<{ id: number; x: number; y: number; plantedAt: number }[]>([]);
  const [bagCapacity, setBagCapacity] = useState(12);
  const [trees, setTrees] = useState(INITIAL_TREES);
  const [safeRadius, setSafeRadius] = useState(12);

  const move = (dx: number, dy: number) => setPosition((point) => ({
    x: Math.max(5, Math.min(92, point.x + dx)),
    y: Math.max(15, Math.min(82, point.y + dy)),
  }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -4], w: [0, -4], ц: [0, -4], ArrowDown: [0, 4], s: [0, 4], ы: [0, 4],
        ArrowLeft: [-4, 0], a: [-4, 0], ф: [-4, 0], ArrowRight: [4, 0], d: [4, 0], в: [4, 0],
      };
      const direction = moves[event.key];
      if (!direction) return;
      event.preventDefault();
      move(...direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime((value) => {
        if (value > 1) return value - 1;
        setIsDark((dark) => {
          if (dark) { setNight((current) => current + 1); setMessage('Наступил день — собирай припасы'); }
          else setMessage('Ночь началась. Не дай костру погаснуть!');
          return !dark;
        });
        return PHASE_SECONDS;
      });
      setFire((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isDark || night === 1) { setDeerPosition({ x: 8, y: 38 }); return; }
    const chase = window.setInterval(() => {
      setDeerPosition((deer) => {
        const next = {
          x: deer.x + Math.sign(position.x - deer.x) * 2.4,
          y: deer.y + Math.sign(position.y - deer.y) * 2.1,
        };
        const distanceToFire = Math.hypot(next.x - 52, next.y - 72);
        if (distanceToFire < safeRadius) {
          const angle = Math.atan2(next.y - 72, next.x - 52);
          return { x: 52 + Math.cos(angle) * safeRadius, y: 72 + Math.sin(angle) * safeRadius };
        }
        const playerInsideSafeZone = Math.hypot(position.x - 52, position.y - 72) < safeRadius;
        if (!playerInsideSafeZone && Math.hypot(next.x - position.x, next.y - position.y) < 8) {
          setHealth((value) => Math.max(0, value - 7));
          setMessage('Олень догнал тебя! Беги к яркому костру!');
        }
        return next;
      });
    }, 550);
    return () => window.clearInterval(chase);
  }, [isDark, fire, position, night, safeRadius]);

  useEffect(() => {
    const nearFire = Math.hypot(position.x - 52, position.y - 72) < 18;
    if (!nearFire || fire < 20 || health >= 100) return;
    const healing = window.setInterval(() => setHealth((value) => Math.min(100, value + 3)), 1800);
    return () => window.clearInterval(healing);
  }, [position, fire, health]);

  const gatherWood = () => {
    if (isDark) { setMessage('Ночью слишком опасно отходить от костра'); return; }
    if (!axeEquipped) { setMessage('Возьми топор из инвентаря'); return; }
    if (wood >= bagCapacity) { setMessage('Мешок заполнен'); return; }
    const nearest = trees.map((tree) => ({ ...tree, distance: Math.hypot(tree.x - position.x, tree.y - position.y) })).sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > 15) { setMessage('Подойди ближе к дереву'); return; }
    const collected = Math.min(3, bagCapacity - wood);
    setWood((value) => value + collected);
    setTrees((current) => current.filter((tree) => tree.id !== nearest.id));
    setSeeds((value) => value + 1);
    setMessage(`Ты срубил ${collected} бревна и нашёл семя`);
  };

  const fuelFire = () => {
    if (!wood) { setMessage('Сначала найди дрова'); return; }
    setWood((value) => value - 1);
    setSafeRadius((value) => Math.min(30, value + 2));
    setFire((value) => {
      const next = Math.min(100, value + 22);
      if (next === 100 && !mapExpanded) {
        setMapExpanded(true);
        setMessage('Костёр улучшен! Открылась новая часть леса');
      } else setMessage('Костёр разгорелся ярче');
      return next;
    });
  };

  const craft = (recipe: Recipe, cost: number) => {
    if (wood < cost) return;
    setWood((value) => value - cost);
    if (recipe === 'torch') setTorches((value) => value + 1);
    if (recipe === 'wall') setWalls((value) => value + 1);
    if (recipe === 'bag') setBagCapacity(20);
    setMessage('Предмет создан на столе для крафта');
  };

  const equipAxe = () => {
    setAxeEquipped((value) => !value);
    setTorchEquipped(false);
  };

  const equipTorch = () => {
    setTorchEquipped((value) => !value);
    setAxeEquipped(false);
  };

  const placeWall = () => {
    if (walls <= 0) return;
    setWalls((value) => value - 1);
    setPlacedWalls((current) => [...current, { id: Date.now(), x: Math.min(90, position.x + 6), y: position.y }]);
    setMessage('Деревянная стена установлена');
  };

  const plantSeed = () => {
    if (seeds <= 0) return;
    const id = Date.now();
    setSeeds((value) => value - 1);
    setSaplings((current) => [...current, { id, x: Math.min(90, position.x + 5), y: Math.min(80, position.y + 4), plantedAt: Date.now() }]);
    setMessage('Семя посажено. Подожди, пока дерево вырастет');
  };

  useEffect(() => {
    const growth = window.setInterval(() => {
      const ready = saplings.filter((sapling) => Date.now() - sapling.plantedAt >= 12000);
      if (!ready.length) return;
      setTrees((current) => [...current, ...ready.map((sapling) => ({ id: sapling.id, x: sapling.x, y: sapling.y }))]);
      setSaplings((current) => current.filter((sapling) => Date.now() - sapling.plantedAt < 12000));
      setMessage('Саженец вырос в большое дерево!');
    }, 1000);
    return () => window.clearInterval(growth);
  }, [saplings]);

  if (health <= 0) return <main className="forest-game forest-game--dead"><div className="forest-result"><h1>Лес забрал тебя</h1><p>Ты пережил {night - 1} ночей</p><button onClick={() => window.location.reload()}>Начать снова</button><button onClick={onHome}>Главная</button></div></main>;

  return <main className={`forest-game${isDark ? ' forest-game--night' : ''}`}>
    <header className="forest-hud"><button onClick={onHome}>← Главная</button><strong>{isDark ? `Ночь ${night}` : `День ${night}`} · {time} сек</strong><div className="forest-health"><span><i style={{ width: `${health}%` }} /></span><b>❤️ {health}</b></div><span>🪵 {wood}　🔥 {fire}%</span></header>
    <section className={`forest-world${mapExpanded ? ' forest-world--expanded' : ''}`}>
      <div className="forest-moon">{isDark ? '🌕' : '☀️'}</div>
      <div className="forest-trees">{trees.map((tree) => <span key={tree.id} className="forest-tree" style={{ left: `${tree.x}%`, top: `${tree.y}%` }}>🌲</span>)}</div>
      {saplings.map((sapling) => <span key={sapling.id} className="forest-sapling" style={{ left: `${sapling.x}%`, top: `${sapling.y}%` }}>🌱</span>)}
      <div className={`forest-player${torchEquipped ? ' forest-player--torch' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}>🧍{axeEquipped && <i>🪓</i>}{torchEquipped && <i>🔦</i>}</div>
      {placedWalls.map((wall) => <div key={wall.id} className="forest-placed-wall" style={{ left: `${wall.x}%`, top: `${wall.y}%` }}>🪵</div>)}
      <div className={`forest-deer${isDark ? ' forest-deer--visible' : ''}`} style={{ left: `${deerPosition.x}%`, top: `${deerPosition.y}%` }}><i className="forest-deer__antlers" /><i className="forest-deer__head"><span /></i><i className="forest-deer__body" /><i className="forest-deer__arms" /><i className="forest-deer__legs" /></div>
      <div className="forest-fire"><i style={{ opacity: Math.max(.15, fire / 100), scale: Math.max(.6, fire / 75) }}>🔥</i><span>Костёр</span></div>
      <div className="forest-safe-zone" style={{ width: `${safeRadius * 2}%`, opacity: Math.max(.25, fire / 100) }}><span>Безопасная зона</span></div>
      <button className="forest-craft-table" onClick={() => setCraftOpen(true)}><i>🛠️</i><span>Стол для крафта</span></button>
      <div className="forest-message">{message}</div>
      {mapExpanded && <div className="forest-new-zone"><b>Новая территория</b><span>🌲　🪨　🌲</span></div>}
    </section>
    <footer className="forest-actions"><button onClick={gatherWood}>🪓 Рубить дерево</button><button onClick={fuelFire}>🪵 Подкинуть бревно</button><button onClick={() => setInventoryOpen(!inventoryOpen)}>🎒 Инвентарь</button><button onClick={() => setCraftOpen(true)}>🛠️ Крафт</button><div className="forest-controls"><button onClick={() => move(-4, 0)}>←</button><span><button onClick={() => move(0, -4)}>↑</button><button onClick={() => move(0, 4)}>↓</button></span><button onClick={() => move(4, 0)}>→</button></div><div><b>Цель:</b> пережить 99 ночей</div></footer>
    {craftOpen && <CraftingTable wood={wood} bagUpgraded={bagCapacity > 12} onCraft={craft} onClose={() => setCraftOpen(false)} />}
    {inventoryOpen && <aside className="forest-inventory"><div className="forest-inventory__head"><h2>🧰 Инвентарь</h2><button onClick={() => setInventoryOpen(false)}>✕</button></div><h3>Предметы</h3><div className="forest-inventory__grid forest-inventory__items">
      <button className={axeEquipped ? 'equipped' : ''} onClick={equipAxe}><b>🪓</b><span>Топор</span><small>{axeEquipped ? 'В руках' : 'Взять'}</small></button>
      {torches > 0 && <button className={torchEquipped ? 'equipped' : ''} onClick={equipTorch}><b>🔦</b><span>Факел ×{torches}</span><small>{torchEquipped ? 'В руках' : 'Взять'}</small></button>}{walls > 0 && <button onClick={placeWall}><b>🧱</b><span>Стена ×{walls}</span><small>Поставить</small></button>}
      {seeds > 0 && <button onClick={plantSeed}><b>🌰</b><span>Семена ×{seeds}</span><small>Посадить</small></button>}
      </div><div className="forest-bag-title"><h3>🎒 Мешок</h3><span>Брёвна: {wood} / {bagCapacity}</span></div><div className="forest-inventory__grid forest-inventory__bag">
      {Array.from({ length: bagCapacity }, (_, index) => <div key={index} className={index < wood ? 'filled' : ''}>{index < wood ? '🪵' : ''}</div>)}
    </div></aside>}
  </main>;
}
