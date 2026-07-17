import { useEffect, useState } from 'react';

type BaseElement = 'fire' | 'water' | 'earth' | 'air';
type ElementName = string;
type Elemental = { id: number; element: ElementName; level: number };
const info: Record<ElementName, { icon: string; name: string }> = { fire: { icon: '🔥', name: 'Огонь' }, water: { icon: '💧', name: 'Вода' }, earth: { icon: '🪨', name: 'Земля' }, air: { icon: '🌪️', name: 'Воздух' }, steam: { icon: '♨️', name: 'Пар' }, lava: { icon: '🌋', name: 'Лава' }, lightning: { icon: '⚡', name: 'Молния' }, mud: { icon: '🟤', name: 'Грязь' }, electricity: { icon: '🔋', name: 'Электричество' }, storm: { icon: '⛈️', name: 'Буря' }, obsidian: { icon: '💎', name: 'Обсидиан' }, cloud: { icon: '☁️', name: 'Облако' }, magnet: { icon: '🧲', name: 'Магнит' }, brick: { icon: '🧱', name: 'Кирпич' }, plasma: { icon: '💫', name: 'Плазма' }, life: { icon: '🌱', name: 'Жизнь' }, energy: { icon: '✨', name: 'Энергия' }, meteor: { icon: '☄️', name: 'Метеор' }, coal: { icon: '⚫', name: 'Уголь' } };
const elements: BaseElement[] = ['fire', 'water', 'earth', 'air'];
const recipes: Record<string, ElementName> = { 'fire+water': 'steam', 'earth+fire': 'lava', 'air+fire': 'lightning', 'earth+water': 'mud', 'air+water': 'electricity', 'air+earth': 'storm', 'lava+water': 'obsidian', 'air+steam': 'cloud', 'earth+electricity': 'magnet', 'fire+mud': 'brick', 'fire+storm': 'plasma', 'earth+steam': 'life', 'electricity+water': 'energy', 'lava+storm': 'meteor', 'fire+life': 'coal' };
const fusionWords = ['Солнечный', 'Лунный', 'Космический', 'Драконий', 'Теневой', 'Кристальный', 'Звёздный', 'Древний', 'Магический', 'Королевский'];
const fusionThings = ['кристалл', 'вихрь', 'голем', 'дух', 'дракон', 'сфера', 'шторм', 'титан', 'феникс'];
const fusionIcons = ['🌟','🌙','🪐','🐲','👻','💎','🌌','🧿','🔮','👑'];
const unlockedElements = Object.keys(info);
for (let number = 1, attempt = 0; Object.keys(recipes).length < 100; attempt++) {
  const left = unlockedElements[(attempt * 3 + 1) % unlockedElements.length];
  const right = unlockedElements[(attempt * 7 + 5) % unlockedElements.length];
  if (left === right) continue;
  const key = [left, right].sort().join('+');
  if (recipes[key]) continue;
  const result = `fusion_${number}`;
  recipes[key] = result;
  info[result] = { icon: fusionIcons[(number - 1) % fusionIcons.length], name: `${fusionWords[(number - 1) % fusionWords.length]} ${fusionThings[(number - 1) % fusionThings.length]} ${number}` };
  unlockedElements.push(result);
  number++;
}

export function ElementalMergePage({ onHome }: { onHome: () => void }) {
  const [units, setUnits] = useState<Elemental[]>([{ id: 1, element: 'fire', level: 1 }, { id: 2, element: 'fire', level: 1 }, { id: 3, element: 'water', level: 1 }, { id: 4, element: 'water', level: 1 }]);
  const [selected, setSelected] = useState<number | null>(null);
  const [coins, setCoins] = useState(60);
  const [wave, setWave] = useState(1);
  const [baseHp, setBaseHp] = useState(5);
  const [message, setMessage] = useState('Соедини двух одинаковых элементалей!');
  const [nextId, setNextId] = useState(5);
  const [battling, setBattling] = useState(false);
  const [chosenElement, setChosenElement] = useState<BaseElement>('fire');
  const [saveLoaded, setSaveLoaded] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const power = units.reduce((sum, unit) => sum + unit.level ** 2 * 3, 0);
  const enemyPower = 8 + wave * 7;
  const selectedUnit = units.find((unit) => unit.id === selected);
  const sellPrice = selectedUnit ? 7 * selectedUnit.level ** 2 : 0;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('elemental-merge-save');
      if (saved) {
        const data = JSON.parse(saved) as { units?: Elemental[]; coins?: number; wave?: number; baseHp?: number; nextId?: number; chosenElement?: BaseElement };
        if (Array.isArray(data.units)) setUnits(data.units);
        if (typeof data.coins === 'number') setCoins(data.coins);
        if (typeof data.wave === 'number') setWave(data.wave);
        if (typeof data.baseHp === 'number') setBaseHp(data.baseHp);
        if (typeof data.nextId === 'number') setNextId(data.nextId);
        if (data.chosenElement && elements.includes(data.chosenElement)) setChosenElement(data.chosenElement);
      }
    } catch { localStorage.removeItem('elemental-merge-save'); }
    setSaveLoaded(true);
  }, []);

  useEffect(() => {
    if (!saveLoaded) return;
    localStorage.setItem('elemental-merge-save', JSON.stringify({ units, coins, wave, baseHp, nextId, chosenElement }));
  }, [units, coins, wave, baseHp, nextId, chosenElement, saveLoaded]);

  const choose = (id: number) => {
    if (selected === null) return setSelected(id);
    if (selected === id) return setSelected(null);
    const first = units.find((unit) => unit.id === selected); const second = units.find((unit) => unit.id === id);
    const recipe = first && second ? recipes[[first.element, second.element].sort().join('+')] : undefined;
    const sameMerge = first && second && first.element === second.element && first.level === second.level;
    const hybridMerge = first && second && first.level >= 2 && second.level >= 2 && first.level === second.level && recipe;
    if (first && second && (sameMerge || hybridMerge)) {
      const resultElement = hybridMerge ? recipe : first.element;
      setUnits((current) => current.filter((unit) => unit.id !== first.id && unit.id !== second.id).concat({ ...first, element: resultElement, id: nextId, level: first.level + 1 }));
      setNextId((value) => value + 1); setMessage(hybridMerge ? `🌈 Новый элемент: ${info[resultElement].name}!` : `✨ ${info[first.element].name} усилен до ${first.level + 1} уровня!`);
    } else setMessage('Создай два разных элемента 2 уровня. Их слияние даст смешанного монстра 3 уровня!');
    setSelected(null);
  };
  const summon = () => { if (coins < 15 || units.length >= 12) return; setUnits((old) => [...old, { id: nextId, element: chosenElement, level: 1 }]); setNextId((v) => v + 1); setCoins((v) => v - 15); setMessage(`${info[chosenElement].icon} Призван элемент: ${info[chosenElement].name}`); };
  const sellSelected = () => { if (!selectedUnit || battling) return; setUnits((current) => current.filter((unit) => unit.id !== selectedUnit.id)); setCoins((amount) => amount + sellPrice); setMessage(`🪙 ${info[selectedUnit.element].name} продан! +${sellPrice} монет`); setSelected(null); };
  const battle = () => {
    if (battling) return; setBattling(true); setMessage('⚔️ Битва началась!');
    window.setTimeout(() => { if (power >= enemyPower) { const reward = 18 + wave * 3; setCoins((v) => v + reward); setWave((v) => v + 1); setMessage(`🏆 Победа! +${reward} монет`); } else { setBaseHp((v) => Math.max(0, v - 1)); setMessage('💥 Враг сильнее! База потеряла жизнь.'); } setBattling(false); }, 2200);
  };
  const restart = () => { setUnits([{ id: 1, element: 'fire', level: 1 }, { id: 2, element: 'fire', level: 1 }]); setCoins(60); setWave(1); setBaseHp(5); setNextId(3); setMessage('Новая игра!'); };

  return <main className="merge-page"><header className="merge-header"><button onClick={onHome}>← Все игры</button><div><small>ELEMENTAL</small><h1>MERGE</h1></div><strong className="merge-money"><small>Твои деньги</small><span>🪙 {coins}</span></strong></header>
    <details className="game-story game-story--merge"><summary>📖 Новая легенда элементов</summary><p>Алхимик Пустоты украл Первозданную Искру и превратил мир в бесконечную бурю. Только новый Хранитель умеет соединять стихии и пробуждать существ всё более высокого уровня. Открой 100 тайных рецептов, собери команду элементалей и создай силу, способную победить Пустоту.</p></details>
    <section className={`merge-arena${battling ? ' merge-arena--battle' : ''}`}><div className="merge-battle-units merge-battle-units--heroes">{units.slice(0,6).map((unit) => <span key={unit.id}>{info[unit.element].icon}</span>)}</div><div className="merge-battle-spells">💥⚡🔥💧</div><div className="merge-battle-units merge-battle-units--foes"><span>{wave % 5 === 0 ? '🐉' : '👾'}</span><span>👾</span></div><div className="merge-enemy"><span>{wave % 5 === 0 ? '🐉' : '👾'}</span><div><b>Волна {wave}</b><small>Сила: {enemyPower}</small></div></div><div className="merge-clash">⚡</div><div className="merge-army"><span>🏰</span><div><b>Твоя армия</b><small>Сила: {power} · Жизни: {'❤️'.repeat(baseHp)}</small></div></div></section>
    <p className="merge-message">{message}</p><button className="merge-recipe-button" onClick={() => setShowRecipes(true)}>📖 Книга рецептов</button><div className="merge-element-picker"><b>Выбери элемент:</b>{elements.map((element) => <button key={element} className={chosenElement === element ? `selected merge-pick--${element}` : ''} onClick={() => setChosenElement(element)}><span>{info[element].icon}</span>{info[element].name}</button>)}</div><section className="merge-board">{Array.from({ length: 12 }, (_, index) => { const unit = units[index]; return <button key={unit?.id ?? `empty-${index}`} className={`merge-slot${unit ? ` merge-slot--${unit.element}${unit.level >= 4 ? ' merge-slot--elite' : ''}${unit.level >= 8 ? ' merge-slot--legendary' : ''}` : ''}${selected === unit?.id ? ' selected' : ''}`} onClick={() => unit && choose(unit.id)} disabled={!unit}>{unit && <><span>{info[unit.element].icon}</span><b>LVL {unit.level}</b><i>{info[unit.element].name}</i></>}</button>; })}</section>
    <div className="merge-actions"><button onClick={summon} disabled={battling || coins < 15 || units.length >= 12}>✨ Призвать <small>15 🪙</small></button><button className="merge-sell" onClick={sellSelected} disabled={battling || !selectedUnit}>🪙 Продать {selectedUnit && <small>+{sellPrice} 🪙</small>}</button><button className="merge-fight" onClick={battle} disabled={battling || !units.length || baseHp <= 0}>{battling ? '💥 Битва...' : '⚔️ В бой!'}</button></div>
    {showRecipes && <div className="merge-recipes" onClick={() => setShowRecipes(false)}><section onClick={(event) => event.stopPropagation()}><button className="merge-recipes__close" onClick={() => setShowRecipes(false)}>×</button><span>🧪</span><h2>Книга рецептов</h2><p>Разные стихии можно совмещать с 3 уровня.</p><div>{Object.entries(recipes).map(([ingredients, result]) => { const [left, right] = ingredients.split('+') as [ElementName, ElementName]; return <article key={ingredients}><i>{info[left].icon}</i><b>+</b><i>{info[right].icon}</i><strong>→</strong><i>{info[result].icon}</i><span>{info[result].name}</span></article>; })}</div></section></div>}
    {baseHp <= 0 && <div className="merge-over"><div><span>💥</span><h2>База разрушена</h2><button onClick={restart}>Новая игра</button></div></div>}
  </main>;
}
