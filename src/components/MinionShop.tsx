import { MINIONS } from '../lib/game';

type MinionShopProps = {
  coins: number;
  disabled: boolean;
  title?: string;
  enemy?: boolean;
  onSummon: (index: number) => void;
};

export function MinionShop({ coins, disabled, title = 'Синий игрок', enemy = false, onSummon }: MinionShopProps) {
  return <section className={`shop${enemy ? ' shop--enemy' : ''}`}>
    <div className="shop__title"><h2>{title}</h2><span>🪙 {coins} · +2 / сек</span></div>
    <div className="shop__grid">{MINIONS.map((kind, index) => <button key={kind.name} className="minion-card" disabled={disabled || coins < kind.cost} onClick={() => onSummon(index)}>
      <span className="minion-card__icon" style={{ background: kind.color }}>{kind.icon}</span>
      <span><strong>{kind.name}</strong><small>❤ {kind.hp} · ⚔ {kind.damage}</small></span>
      <b>🪙 {kind.cost}</b>
    </button>)}</div>
  </section>;
}
