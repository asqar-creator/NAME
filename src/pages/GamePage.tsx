import { useEffect, useState } from 'react';
import { Battlefield } from '../components/Battlefield';
import { MinionShop } from '../components/MinionShop';
import { BattleItems } from '../components/BattleItems';
import { useBattle } from '../lib/useBattle';
import { playMinionVoice, startGameMusic, stopGameMusic } from '../lib/gameAudio';

export function GamePage({ onHome }: { onHome: () => void }) {
  const [mode, setMode] = useState<'bot' | 'local'>('bot');
  const [soundOn, setSoundOn] = useState(false);
  const { game, summon, useItem, restart } = useBattle(mode);
  const finished = game.winner !== null;
  useEffect(() => () => stopGameMusic(), []);

  return <main className="game-shell">
    <div className="game-toolbar"><button className="back-button" onClick={() => { stopGameMusic(); onHome(); }}>← Главная</button><button className="sound-button" onClick={() => { if (soundOn) stopGameMusic(); else startGameMusic(); setSoundOn(!soundOn); }}>{soundOn ? '🔊 Звук включён' : '🔇 Включить звук'}</button></div>
    <header className="game-header">
      <div><span className="eyebrow">АВТОБИТВА</span><h1>Битва баз</h1><p>Создавай армию, прорвись через линию и уничтожь красную крепость.</p></div>
      <div className="mode-switch">
        <button className={mode === 'bot' ? 'active' : ''} onClick={() => { setMode('bot'); restart(); }}>🤖 С ботом</button>
        <button className={mode === 'local' ? 'active' : ''} onClick={() => { setMode('local'); restart(); }}>👥 Вдвоём</button>
      </div>
    </header>
    <Battlefield game={game} />
    <BattleItems coins={game.coins} disabled={finished} onUse={useItem} />
    <div className={`shops${mode === 'local' ? ' shops--two' : ''}`}>
      <MinionShop coins={game.coins} disabled={finished} onSummon={(index) => { summon(index, 'player'); if (soundOn) playMinionVoice(); }} />
      {mode === 'local' && <MinionShop title="Красный игрок" enemy coins={game.enemyCoins} disabled={finished} onSummon={(index) => { summon(index, 'enemy'); if (soundOn) playMinionVoice(); }} />}
    </div>
    {finished && <div className="result" role="dialog" aria-modal="true"><div className="result__card">
      <span>{game.winner === 'player' ? '🏆' : '💥'}</span>
      <h2>{game.winner === 'player' ? 'Синий игрок победил!' : mode === 'local' ? 'Красный игрок победил!' : 'База разрушена'}</h2>
      <p>{game.winner === 'player' ? 'Вражеская крепость пала.' : 'Собери новую армию и попробуй ещё раз.'}</p>
      <button onClick={restart}>Новая битва</button>
    </div></div>}
  </main>;
}
