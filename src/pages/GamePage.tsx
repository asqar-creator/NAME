import { useEffect, useRef, useState } from 'react';
import { Battlefield } from '../components/Battlefield';
import { MinionShop } from '../components/MinionShop';
import { BattleItems } from '../components/BattleItems';
import { useBattle } from '../lib/useBattle';
import { startGameMusic, stopGameMusic } from '../lib/gameAudio';
import { ClashAction, ClashRole, useClashRoom } from '../lib/useClashRoom';
import { MINIONS } from '../lib/game';

export function GamePage({ onHome }: { onHome: () => void }) {
  const [mode, setMode] = useState<'bot' | 'local' | 'online'>('bot');
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [onlineRole, setOnlineRole] = useState<ClashRole>('host');
  const [soundOn, setSoundOn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [level, setLevel] = useState(() => Number(localStorage.getItem('clash-bot-level')) || 1);
  const [crystals, setCrystals] = useState(() => Number(localStorage.getItem('clash-crystals')) || 0);
  const [crystalShopOpen, setCrystalShopOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('clash-player-name') || 'Звезда');
  const [nameDraft, setNameDraft] = useState(() => localStorage.getItem('clash-player-name') || 'Звезда');
  const [ownedMinions, setOwnedMinions] = useState<string[]>(() => { const saved = localStorage.getItem('clash-owned-minions'); return saved ? JSON.parse(saved) as string[] : MINIONS.slice(0, 3).map((kind) => kind.name); });
  const levelAdvanced = useRef(false);
  const [askarUnlocked, setAskarUnlocked] = useState(() => MINIONS.filter((kind) => kind.name !== 'Аскар с мечом').every((kind) => ownedMinions.includes(kind.name)));
  const [askarUnlockNotice, setAskarUnlockNotice] = useState(false);
  const { game, summon, useItem, restart, replaceGame } = useBattle(mode === 'bot' ? 'bot' : 'local', mode === 'online' && onlineRole === 'guest', mode === 'bot' ? level : 1);
  const applyOnlineAction = (action: ClashAction) => { if (action.type === 'summon') summon(action.index, action.side); else if (action.type === 'item') useItem(action.kind, action.side); else restart(); };
  const { connected, opponentOnline, sendAction, sendState } = useClashRoom(roomCode, onlineRole, applyOnlineAction, replaceGame);
  const finished = game.winner !== null;
  useEffect(() => () => stopGameMusic(), []);
  useEffect(() => { if (!finished) { setShowResult(false); return; } const delay = game.winner === 'player' ? 4200 : 0; const timer = window.setTimeout(() => setShowResult(true), delay); return () => window.clearTimeout(timer); }, [finished, game.winner]);
  useEffect(() => { const allCollected = MINIONS.filter((kind) => kind.name !== 'Аскар с мечом').every((kind) => ownedMinions.includes(kind.name)); if (allCollected && !askarUnlocked) { localStorage.setItem('clash-askar-sword-unlocked', 'yes'); setAskarUnlocked(true); setAskarUnlockNotice(true); window.setTimeout(() => setAskarUnlockNotice(false), 4500); } }, [ownedMinions, askarUnlocked]);
  useEffect(() => { if (!game.winner) { levelAdvanced.current = false; return; } if (mode === 'bot' && game.winner === 'player' && !levelAdvanced.current) { levelAdvanced.current = true; const next = level + 1; localStorage.setItem('clash-bot-level', String(next)); setLevel(next); setCrystals((value) => { const reward = value + 5; localStorage.setItem('clash-crystals', String(reward)); return reward; }); } }, [game.winner, mode, level]);
  useEffect(() => { if (mode !== 'online' || onlineRole !== 'host' || !connected) return; const timer = window.setTimeout(() => sendState(game), 90); return () => window.clearTimeout(timer); }, [game, mode, onlineRole, connected, sendState]);
  const createOnlineRoom = () => { const code = Math.random().toString(36).slice(2, 8).toUpperCase(); setOnlineRole('host'); setRoomInput(code); setRoomCode(code); setMode('online'); restart(); };
  const joinOnlineRoom = () => { const code = roomInput.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase(); if (!code) return; setOnlineRole('guest'); setRoomInput(code); setRoomCode(code); setMode('online'); restart(); };
  const onlineSummon = (index: number) => { if (onlineRole === 'host') summon(index, 'player'); else sendAction({ type: 'summon', index, side: 'enemy' }); };
  const crystalPrice = (name: string, coinCost: number) => ({ Айжулдыз: 250, Жансая: 300, Мама: 400, Папа: 500 }[name] ?? Math.max(40, Math.ceil(coinCost / 10) * 10));
  const buyMinionForever = (name: string, price: number) => { if (crystals < price || ownedMinions.includes(name)) return; const next = [...ownedMinions, name]; setOwnedMinions(next); setCrystals((value) => { const balance = value - price; localStorage.setItem('clash-crystals', String(balance)); return balance; }); localStorage.setItem('clash-owned-minions', JSON.stringify(next)); };
  const savePlayerName = () => { const next = nameDraft.trim().slice(0, 18) || 'Игрок'; setPlayerName(next); setNameDraft(next); localStorage.setItem('clash-player-name', next); setNameOpen(false); };

  return <main className="game-shell">
    <div className="game-toolbar"><button className="back-button" onClick={() => { stopGameMusic(); onHome(); }}>← Главная</button><strong className="clash-crystals">💎 {crystals}</strong><button className="crystal-shop-button" onClick={() => setCrystalShopOpen(true)}>🛒 МАГАЗИН</button><button className="clash-online-button" onClick={() => setOnlineOpen(true)}>🌐 ИГРАТЬ ОНЛАЙН</button><button className="sound-button" onClick={() => { if (soundOn) stopGameMusic(); else startGameMusic(); setSoundOn(!soundOn); }}>{soundOn ? '🔊 Звук включён' : '🔇 Включить звук'}</button></div>
    <header className="game-header">
      <div><span className="eyebrow">АВТОБИТВА · УРОВЕНЬ {level}</span><h1>Битва баз</h1><p>Создавай армию, прорвись через линию и уничтожь красную крепость. Каждый уровень сложнее предыдущего.</p></div>
      <div className="mode-switch">
        <button className={mode === 'bot' ? 'active' : ''} onClick={() => { setMode('bot'); restart(); }}>🤖 С ботом</button>
        <button className={mode === 'local' ? 'active' : ''} onClick={() => { setMode('local'); restart(); }}>👥 Вдвоём</button>
        <button className={mode === 'online' ? 'active' : ''} onClick={() => setOnlineOpen(true)}>🌐 Онлайн</button>
      </div>
    </header>
    <details className="game-story"><summary>📖 Новая история «Клеш оф Минионс»</summary><p>В ночь Великого Затмения Злой Аскар оживил Красную крепость и отправил тёмных двойников семьи захватить все королевства. Герой Аскар, Айжулдыз, Жансая, Мама и Папа объединились с минионами. Теперь им предстоит выдержать последнюю битву, освободить Кристалл Радости и вернуть свет каждой земле.</p></details>
    <button className="player-name-button" onClick={() => setNameOpen(true)}>⭐ {playerName}</button>
    {askarUnlockNotice && <div className="step-success" role="status">⚔️ Аскар с мечом разблокирован! Ты собрал всех минионов и всю семью.</div>}
    <Battlefield game={game} playerName={playerName} />
    <BattleItems coins={mode === 'online' && onlineRole === 'guest' ? game.enemyCoins : game.coins} disabled={finished || (mode === 'online' && !opponentOnline)} onUse={(kind) => { if (mode === 'online' && onlineRole === 'guest') sendAction({ type: 'item', kind, side: 'enemy' }); else useItem(kind, 'player'); }} />
    <div className={`shops${mode === 'local' ? ' shops--two' : ''}`}>
      {mode !== 'online' && <MinionShop title={playerName} coins={game.coins} disabled={finished} askarUnlocked={askarUnlocked} ownedNames={ownedMinions} onSummon={(index) => summon(index, 'player')} />}
      {mode === 'online' && <MinionShop title={onlineRole === 'host' ? 'Синий игрок — вы' : 'Красный игрок — вы'} enemy={onlineRole === 'guest'} coins={onlineRole === 'host' ? game.coins : game.enemyCoins} disabled={finished || !opponentOnline} askarUnlocked={onlineRole === 'host' && askarUnlocked} ownedNames={ownedMinions} onSummon={onlineSummon} />}
      {mode === 'local' && <MinionShop title="Красный игрок" enemy coins={game.enemyCoins} disabled={finished} askarUnlocked={false} ownedNames={MINIONS.slice(0, 3).map((kind) => kind.name)} onSummon={(index) => summon(index, 'enemy')} />}
    </div>
    {mode === 'online' && <div className="clash-online-status">{connected ? opponentOnline ? `🟢 Соперник подключён · ${roomCode}` : `🟡 Ждём соперника · код ${roomCode}` : 'Подключение…'}</div>}
    {onlineOpen && <div className="tower-window"><section><button className="close" onClick={() => setOnlineOpen(false)}>×</button><h2>🌐 Битва баз онлайн</h2>{roomCode && mode === 'online' ? <><p>Код комнаты: <b>{roomCode}</b></p><p>{opponentOnline ? '✅ Второй игрок подключён!' : 'Отправь этот код другу.'}</p><button onClick={() => void navigator.clipboard?.writeText(roomCode)}>Копировать код</button><button onClick={() => { setRoomCode(''); setMode('bot'); setOnlineOpen(false); restart(); }}>Выйти</button></> : <><button onClick={createOnlineRoom}>Создать комнату</button><p>Или вставь код друга:</p><input value={roomInput} onChange={(event) => setRoomInput(event.target.value.toUpperCase())} maxLength={6} placeholder="ВСТАВЬ КОД" /><button onClick={joinOnlineRoom}>Войти по коду</button></>}</section></div>}
    {showResult && <div className="result" role="dialog" aria-modal="true"><div className="result__card">
      <span>{game.winner === 'player' ? '🏆' : '💥'}</span>
      <h2>{game.winner === 'player' ? 'Синий игрок победил!' : mode === 'local' ? 'Красный игрок победил!' : 'База разрушена'}</h2>
      <p>{game.winner === 'player' ? mode === 'bot' ? `🎉 Ура! Ты прошёл уровень ${Math.max(1, level - 1)} и получил 💎 5 кристаллов! Следующий уровень ${level} будет сложнее.` : '🎉 Ура! Вражеская крепость пала — ты победил!' : 'Попробуй снова: собери новую армию и защити свою базу.'}</p>
      <button onClick={restart}>Новая битва</button>
    </div></div>}
    {crystalShopOpen && <div className="tower-window"><section><button className="close" onClick={() => setCrystalShopOpen(false)}>×</button><h2>💎 Магазин кристаллов</h2><p>Твои кристаллы: <b>💎 {crystals}</b>. Семейные герои — самые редкие и дорогие.</p>{MINIONS.filter((kind) => kind.name !== 'Аскар с мечом').map((kind) => { const owned = ownedMinions.includes(kind.name); const price = crystalPrice(kind.name, kind.cost); return <div className="crystal-minion" key={kind.name}><span>{kind.icon} {kind.name}<small>❤ {kind.hp} · ⚔ {kind.damage}</small></span><button disabled={owned || crystals < price} onClick={() => buyMinionForever(kind.name, price)}>{owned ? 'Куплен' : `💎 ${price}`}</button></div>; })}</section></div>}
    {nameOpen && <div className="tower-window"><section><button className="close" onClick={() => setNameOpen(false)}>×</button><h2>⭐ Имя игрока</h2><p>Придумай имя, например «Звезда» или «Барсик». Бот останется Ботом.</p><input value={nameDraft} maxLength={18} onChange={(event) => setNameDraft(event.target.value)} placeholder="Твоё имя" /><button onClick={savePlayerName}>Сохранить имя</button></section></div>}
  </main>;
}
