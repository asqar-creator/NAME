import { useEffect, useState } from 'react';
import { Battlefield } from '../components/Battlefield';
import { MinionShop } from '../components/MinionShop';
import { BattleItems } from '../components/BattleItems';
import { useBattle } from '../lib/useBattle';
import { startGameMusic, stopGameMusic } from '../lib/gameAudio';
import { ClashAction, ClashRole, useClashRoom } from '../lib/useClashRoom';

export function GamePage({ onHome }: { onHome: () => void }) {
  const [mode, setMode] = useState<'bot' | 'local' | 'online'>('bot');
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [onlineRole, setOnlineRole] = useState<ClashRole>('host');
  const [soundOn, setSoundOn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [askarUnlocked, setAskarUnlocked] = useState(() => localStorage.getItem('clash-askar-sword-unlocked') === 'yes');
  const { game, summon, useItem, restart, replaceGame } = useBattle(mode === 'bot' ? 'bot' : 'local', mode === 'online' && onlineRole === 'guest');
  const applyOnlineAction = (action: ClashAction) => { if (action.type === 'summon') summon(action.index, action.side); else if (action.type === 'item') useItem(action.kind); else restart(); };
  const { connected, opponentOnline, sendAction, sendState } = useClashRoom(roomCode, onlineRole, applyOnlineAction, replaceGame);
  const finished = game.winner !== null;
  useEffect(() => () => stopGameMusic(), []);
  useEffect(() => { if (!finished) { setShowResult(false); return; } const delay = game.winner === 'player' ? 4200 : 0; const timer = window.setTimeout(() => setShowResult(true), delay); return () => window.clearTimeout(timer); }, [finished, game.winner]);
  useEffect(() => { if (game.winner === 'player' && !askarUnlocked) { localStorage.setItem('clash-askar-sword-unlocked', 'yes'); setAskarUnlocked(true); } }, [game.winner, askarUnlocked]);
  useEffect(() => { if (mode !== 'online' || onlineRole !== 'host' || !connected) return; const timer = window.setTimeout(() => sendState(game), 90); return () => window.clearTimeout(timer); }, [game, mode, onlineRole, connected, sendState]);
  const createOnlineRoom = () => { const code = Math.random().toString(36).slice(2, 8).toUpperCase(); setOnlineRole('host'); setRoomInput(code); setRoomCode(code); setMode('online'); restart(); };
  const joinOnlineRoom = () => { const code = roomInput.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase(); if (!code) return; setOnlineRole('guest'); setRoomInput(code); setRoomCode(code); setMode('online'); restart(); };
  const onlineSummon = (index: number) => { if (onlineRole === 'host') summon(index, 'player'); else sendAction({ type: 'summon', index, side: 'enemy' }); };

  return <main className="game-shell">
    <div className="game-toolbar"><button className="back-button" onClick={() => { stopGameMusic(); onHome(); }}>← Главная</button><button className="sound-button" onClick={() => { if (soundOn) stopGameMusic(); else startGameMusic(); setSoundOn(!soundOn); }}>{soundOn ? '🔊 Звук включён' : '🔇 Включить звук'}</button></div>
    <header className="game-header">
      <div><span className="eyebrow">АВТОБИТВА</span><h1>Битва баз</h1><p>Создавай армию, прорвись через линию и уничтожь красную крепость.</p></div>
      <div className="mode-switch">
        <button className={mode === 'bot' ? 'active' : ''} onClick={() => { setMode('bot'); restart(); }}>🤖 С ботом</button>
        <button className={mode === 'local' ? 'active' : ''} onClick={() => { setMode('local'); restart(); }}>👥 Вдвоём</button>
        <button className={mode === 'online' ? 'active' : ''} onClick={() => setOnlineOpen(true)}>🌐 Онлайн</button>
      </div>
    </header>
    <details className="game-story"><summary>📖 История «Клеш оф Минионс»</summary><p>Два королевства много лет хранили мир, пока Злой Аскар не похитил Кристалл Радости. Герой Аскар и его сестра Айжулдыз собрали армию минионов. Им нужно защитить синюю крепость, вернуть кристалл и остановить тёмную армию.</p></details>
    <Battlefield game={game} />
    {!(mode === 'online' && onlineRole === 'guest') && <BattleItems coins={game.coins} disabled={finished} onUse={(kind) => { useItem(kind); if (mode === 'online') sendAction({ type: 'item', kind }); }} />}
    <div className={`shops${mode === 'local' ? ' shops--two' : ''}`}>
      {mode !== 'online' && <MinionShop coins={game.coins} disabled={finished} askarUnlocked={askarUnlocked} onSummon={(index) => summon(index, 'player')} />}
      {mode === 'online' && <MinionShop title={onlineRole === 'host' ? 'Синий игрок — вы' : 'Красный игрок — вы'} enemy={onlineRole === 'guest'} coins={onlineRole === 'host' ? game.coins : game.enemyCoins} disabled={finished || !opponentOnline} askarUnlocked={onlineRole === 'host' && askarUnlocked} onSummon={onlineSummon} />}
      {mode === 'local' && <MinionShop title="Красный игрок" enemy coins={game.enemyCoins} disabled={finished} askarUnlocked={false} onSummon={(index) => summon(index, 'enemy')} />}
    </div>
    {mode === 'online' && <div className="clash-online-status">{connected ? opponentOnline ? `🟢 Соперник подключён · ${roomCode}` : `🟡 Ждём соперника · код ${roomCode}` : 'Подключение…'}</div>}
    {onlineOpen && <div className="tower-window"><section><button className="close" onClick={() => setOnlineOpen(false)}>×</button><h2>🌐 Битва баз онлайн</h2>{roomCode && mode === 'online' ? <><p>Код комнаты: <b>{roomCode}</b></p><p>{opponentOnline ? '✅ Второй игрок подключён!' : 'Отправь этот код другу.'}</p><button onClick={() => void navigator.clipboard?.writeText(roomCode)}>Копировать код</button><button onClick={() => { setRoomCode(''); setMode('bot'); setOnlineOpen(false); restart(); }}>Выйти</button></> : <><button onClick={createOnlineRoom}>Создать комнату</button><p>Или вставь код друга:</p><input value={roomInput} onChange={(event) => setRoomInput(event.target.value.toUpperCase())} maxLength={6} placeholder="ВСТАВЬ КОД" /><button onClick={joinOnlineRoom}>Войти по коду</button></>}</section></div>}
    {showResult && <div className="result" role="dialog" aria-modal="true"><div className="result__card">
      <span>{game.winner === 'player' ? '🏆' : '💥'}</span>
      <h2>{game.winner === 'player' ? 'Синий игрок победил!' : mode === 'local' ? 'Красный игрок победил!' : 'База разрушена'}</h2>
      <p>{game.winner === 'player' ? 'Вражеская крепость пала. Новый герой «Аскар с мечом» открыт в магазине!' : 'Собери новую армию и попробуй ещё раз.'}</p>
      <button onClick={restart}>Новая битва</button>
    </div></div>}
  </main>;
}
