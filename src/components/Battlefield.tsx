import { GameState, MAX_BASE_HP, Side, Unit } from '../lib/game';

function HealthBar({ value }: { value: number }) {
  return <div className="health-bar"><span style={{ width: `${Math.max(0, value)}%` }} /></div>;
}

function Base({ side, hp }: { side: Side; hp: number }) {
  return <div className={`base3d base3d--${side}`}>
    <div className="base3d__status"><HealthBar value={hp / MAX_BASE_HP * 100} /><strong>{Math.max(0, hp)} HP</strong></div>
    <div className="tower3d"><div className="tower3d__roof" /><div className="tower3d__body"><span className="tower3d__window" /></div><div className="tower3d__door" /></div>
  </div>;
}

function Fighter({ unit }: { unit: Unit }) {
  if (unit.name === 'Дракон') return <div className={`fighter3d dragon3d dragon3d--${unit.side}`} style={{ left: `${unit.x}%` }}>
    <HealthBar value={unit.health / unit.hp * 100} /><div className="fighter3d__shadow" />
    <div className="dragon3d__model"><i className="dragon3d__wing dragon3d__wing--back" /><i className="dragon3d__tail" /><i className="dragon3d__body" /><i className="dragon3d__neck" /><i className="dragon3d__legs" /><i className="dragon3d__rider"><span /></i><i className="dragon3d__wing dragon3d__wing--front" /><i className="dragon3d__head"><span /><b /></i></div>
  </div>;
  const minionShape = ['Айжулдыз', 'Жансая', 'Мама', 'Папа', 'Аскар с мечом'].includes(unit.name) ? 'fighter3d--human-hero' : unit.id % 3 === 0 ? 'minion--one-eye' : unit.id % 3 === 1 ? 'minion--tall' : 'minion--short';
  return <div className={`fighter3d fighter3d--${unit.side} fighter3d--${unit.gender} ${minionShape}${unit.name === 'Драконий наездник' ? ' fighter3d--rider' : ''}${unit.name === 'Тень' ? ' fighter3d--shadow' : ''}${unit.name === 'Колдун теней' ? ' fighter3d--warlock' : ''}${unit.healer ? ' fighter3d--healer' : ''}${unit.name === 'Таранщик' ? ' fighter3d--ram' : ''}${unit.name === 'Каменный голем' ? ' fighter3d--golem' : ''}${unit.spectral ? ' fighter3d--ghost' : ''}${unit.name === 'Айжулдыз' ? ' fighter3d--aizhuldyz' : ''}${unit.name === 'Жансая' ? ' fighter3d--zhansaya' : ''}${unit.name === 'Мама' ? ' fighter3d--mother' : ''}${unit.name === 'Папа' ? ' fighter3d--father' : ''}${unit.name === 'Аскар с мечом' ? ' fighter3d--sword-askar' : ''}${(unit.ultimateTimer ?? 0) >= 7 ? ' fighter3d--ultimate' : ''}${unit.enraged ? ' fighter3d--enraged' : ''}${unit.crying ? ' fighter3d--crying' : ''}`} style={{ left: `${unit.x}%` }}>
    <HealthBar value={unit.health / unit.hp * 100} /><div className="fighter3d__shadow" />
    <div className="fighter3d__model"><span className="fighter3d__head"><i className="fighter3d__hair" /><i className="fighter3d__eyes" /><i className="fighter3d__nose" /><i className="fighter3d__mouth" /></span><span className="fighter3d__body" style={{ background: unit.color }}>{unit.name === 'Аскар с мечом' ? '★' : unit.icon}</span><span className="fighter3d__arm" style={{ background: unit.color }} />{unit.name === 'Аскар с мечом' && <span className="fighter3d__real-sword"><i /><b /><em /></span>}<span className="fighter3d__legs" /></div>
  </div>;
}

function AskarHero({ cooldown, evil = false, victory = false, defeated = false }: { cooldown: number; evil?: boolean; victory?: boolean; defeated?: boolean }) {
  return <div className={`askar-hero${evil ? ' askar-hero--evil' : ''}${victory ? ' askar-hero--finisher' : ''}${defeated ? ' askar-hero--defeated' : ''}`} aria-label={evil ? 'Злой Аскар' : 'Герой Аскар'}>
    <span className="askar-hero__title">{evil ? 'Злой Аскар' : 'Герой Аскар'}</span>
    <span className={`askar-hero__ban${cooldown <= 0 ? ' askar-hero__ban--ready' : ''}`}>{cooldown <= 0 ? '🔨 Бан готов' : `Бан: ${Math.ceil(cooldown)} с`}</span>
    <span className="askar-hero__head"><i className="askar-hero__hair" /><i className="askar-hero__eyes" /><i className="askar-hero__mouth" /></span>
    <span className="askar-hero__body">★</span><span className="askar-hero__sword">⚔</span>
  </div>;
}

export function Battlefield({ game }: { game: GameState }) {
  return <section className={`battlefield${game.winner === 'player' ? ' battlefield--victory' : ''}`} aria-label="Трёхмерное поле боя"><div className="world3d">
    <div className="sky3d"><div className="sun3d" /><div className="cloud3d cloud3d--one" /><div className="cloud3d cloud3d--two" /></div>
    <div className="mountains3d" /><div className="ground3d"><div className="lane3d" /></div>
    <Base side="player" hp={game.playerBase} /><Base side="enemy" hp={game.enemyBase} />
    <AskarHero cooldown={game.heroBanCooldown} victory={game.winner === 'player'} />
    <AskarHero cooldown={game.enemyHeroBanCooldown} evil defeated={game.winner === 'player'} />
    {game.winner === 'player' && <div className="aizhuldyz-final"><span>Айжулдыз</span><b>👧</b><i /></div>}
    {game.winner === 'player' && <div className="zhansaya-final"><span>Жансая</span><b>👧</b><i>🍜</i></div>}
    {game.winner === 'player' && <div className="mother-final"><span>Мама радуется!</span><b>👩</b><i>💗✨💗</i></div>}
    {game.winner === 'player' && <div className="father-final"><span>Папа</span><b>👨</b><i>👊</i></div>}
    {game.winner === 'player' && <div className="evil-family-final"><span>Злая Айжулдыз</span><b>👧</b><span>Злая Жансая</span><b>👧</b><span>Злая Мама</span><b>👩</b><span>Злой Папа</span><b>👨</b></div>}
    {game.winner === 'player' && <div className="askar-hunt"><span>Аскар выходит на охоту</span><b>🧑</b><i>⚔️</i></div>}
    {game.winner === 'player' && <span className="askar-final-orb"><i /></span>}
    {game.units.map((unit) => <Fighter key={unit.id} unit={unit} />)}
    {game.projectiles.map((shot) => <span key={shot.id} className={`projectile projectile--${shot.kind} projectile--${shot.side}`} style={{ left: `${shot.x}%` }} />)}
    {game.explosions.map((effect) => <span key={effect.id} className="bomb-explosion" style={{ left: `${effect.x}%` }}><i /></span>)}
    {game.effects.map((effect) => <span key={effect.id} className={`battle-effect battle-effect--${effect.kind} battle-effect--${effect.side}`} style={{ left: `${effect.x}%` }} />)}
    {game.fallenUnits.map((unit) => <div key={unit.id} className={`fallen-unit fallen-unit--${unit.side}`} style={{ left: `${unit.x}%` }}>
      <span className="fallen-unit__burst" /><span className="fallen-unit__body" style={{ background: unit.color }}>{unit.icon}</span>
    </div>)}
  </div></section>;
}
