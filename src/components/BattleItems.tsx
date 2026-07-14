import { ItemKind } from '../lib/game';

const ITEMS: { kind: ItemKind; name: string; icon: string; cost: number }[] = [
  { kind: 'log', name: 'Бревно', icon: '🪵', cost: 18 },
  { kind: 'potion', name: 'Зелье', icon: '🧪', cost: 22 },
  { kind: 'meteor', name: 'Метеорит', icon: '☄️', cost: 55 },
];

export function BattleItems({ coins, disabled, onUse }: { coins: number; disabled: boolean; onUse: (kind: ItemKind) => void }) {
  return <section className="battle-items"><div className="battle-items__title"><h2>Боевые предметы</h2><span>Используй в нужный момент</span></div>
    <div className="battle-items__grid">{ITEMS.map((item) => <button key={item.kind} disabled={disabled || coins < item.cost} onClick={() => onUse(item.kind)}>
      <i>{item.icon}</i><span><strong>{item.name}</strong><small>🪙 {item.cost}</small></span>
    </button>)}</div>
  </section>;
}
