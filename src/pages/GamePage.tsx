import { useEffect, useState } from 'react';
import { Battlefield } from '../components/Battlefield';
import { MinionShop } from '../components/MinionShop';
import { BattleItems } from '../components/BattleItems';
import { useBattle } from '../lib/useBattle';
import { startGameMusic, stopGameMusic } from '../lib/gameAudio';

export function GamePage({ onHome }: { onHome: () => void }) {
  const [mode, setMode] = useState<'bot' | 'local'>('bot');
  const [soundOn, setSoundOn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [askarUnlocked, setAskarUnlocked] = useState(() => localStorage.getItem('clash-askar-sword-unlocked') === 'yes');
  const { game, summon, useItem, restart } = useBattle(mode);
  const finished = game.winner !== null;
  useEffect(() => () => stopGameMusic(), []);
  useEffect(() => { if (!finished) { setShowResult(false); return; } const delay = game.winner === 'player' ? 4200 : 0; const timer = window.setTimeout(() => setShowResult(true), delay); return () => window.clearTimeout(timer); }, [finished, game.winner]);
  useEffect(() => { if (game.winner === 'player' && !askarUnlocked) { localStorage.setItem('clash-askar-sword-unlocked', 'yes'); setAskarUnlocked(true); } }, [game.winner, askarUnlocked]);

  return <main className="game-shell">
    <div className="game-toolbar"><button className="back-button" onClick={() => { stopGameMusic(); onHome(); }}>← Главная</button><button className="sound-button" onClick={() => { if (soundOn) stopGameMusic(); else startGameMusic(); setSoundOn(!soundOn); }}>{soundOn ? '🔊 Звук включён' : '🔇 Включить звук'}</button></div>
    <header className="game-header">
      <div><span className="eyebrow">АВТОБИТВА</span><h1>Битва баз</h1><p>Создавай армию, прорвись через линию и уничтожь красную крепость.</p></div>
      <div className="mode-switch">
        <button className={mode === 'bot' ? 'active' : ''} onClick={() => { setMode('bot'); restart(); }}>🤖 С ботом</button>
        <button className={mode === 'local' ? 'active' : ''} onClick={() => { setMode('local'); restart(); }}>👥 Вдвоём</button>
      </div>
    </header>
    <details className="game-story"><summary>📖 История «Клеш оф Минионс»</summary><p>Два королевства много лет хранили мир, пока Злой Аскар не похитил Кристалл Радости. Герой Аскар и его сестра Айжулдыз собрали армию минионов. Им нужно защитить синюю крепость, вернуть кристалл и остановить тёмную армию.</p></details>
    <Battlefield game={game} />
    <BattleItems coins={game.coins} disabled={finished} onUse={useItem} />
    <div className={`shops${mode === 'local' ? ' shops--two' : ''}`}>
      <MinionShop coins={game.coins} disabled={finished} askarUnlocked={askarUnlocked} onSummon={(index) => summon(index, 'player')} />
      {mode === 'local' && <MinionShop title="Красный игрок" enemy coins={game.enemyCoins} disabled={finished} askarUnlocked={false} onSummon={(index) => summon(index, 'enemy')} />}
    </div>
    {showResult && <div className="result" role="dialog" aria-modal="true"><div className="result__card">
      <span>{game.winner === 'player' ? '🏆' : '💥'}</span>
      <h2>{game.winner === 'player' ? 'Синий игрок победил!' : mode === 'local' ? 'Красный игрок победил!' : 'База разрушена'}</h2>
      <p>{game.winner === 'player' ? 'Вражеская крепость пала. Новый герой «Аскар с мечом» открыт в магазине!' : 'Собери новую армию и попробуй ещё раз.'}</p>
      <button onClick={restart}>Новая битва</button>
    </div></div>}
  </main>;
}
