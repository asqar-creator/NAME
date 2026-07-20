import { useState } from 'react';
import { MINIONS } from '../lib/game';

type MinionShopProps = {
  coins: number;
  disabled: boolean;
  title?: string;
  enemy?: boolean;
  askarUnlocked?: boolean;
  unlockedCount?: number;
  ownedNames?: string[];
  onSummon: (index: number) => void;
};

export function MinionShop({ coins, disabled, title = 'Синий игрок', enemy = false, askarUnlocked = false, unlockedCount, ownedNames, onSummon }: MinionShopProps) {
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const availableMinions = MINIONS.filter((kind) => (kind.name !== 'Аскар с мечом' || askarUnlocked) && (!ownedNames || ownedNames.includes(kind.name) || kind.name === 'Аскар с мечом'));
  const visibleMinions = unlockedCount === undefined ? availableMinions : availableMinions.slice(0, Math.max(3, unlockedCount));
  return <section className={`shop${enemy ? ' shop--enemy' : ''}`}>
    <div className="shop__title"><h2>🛒 Магазин минионов · {title}</h2><span>🪙 {coins} · +2 / сек</span></div>
    {unlockedCount !== undefined && visibleMinions.length < availableMinions.length && <p className="shop__unlock-hint">🔒 Победи на уровне — откроется ещё один персонаж</p>}
    {purchaseMessage && <p className="shop__purchase-message">✅ {purchaseMessage}</p>}
    <div className="shop__grid">{visibleMinions.map((kind) => { const index = MINIONS.indexOf(kind); return <button key={kind.name} className="minion-card" disabled={disabled || coins < kind.cost} onClick={() => { onSummon(index); setPurchaseMessage(`Ты купил: ${kind.name}!`); window.setTimeout(() => setPurchaseMessage(''), 1800); }}>
      <span className="minion-card__icon" style={{ background: kind.color }}>{kind.icon}</span>
      <span><strong>{kind.name}</strong><small>❤ {kind.hp} · ⚔ {kind.damage}</small></span>
      <b>Купить · 🪙 {kind.cost}</b>
    </button>; })}</div>
  </section>;
}
