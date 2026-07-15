export type Recipe = 'torch' | 'wall' | 'bag';

const RECIPES: { id: Recipe; icon: string; name: string; cost: number }[] = [
  { id: 'torch', icon: '🔦', name: 'Факел', cost: 2 },
  { id: 'wall', icon: '🪵', name: 'Стена', cost: 4 },
  { id: 'bag', icon: '🎒', name: 'Большой мешок', cost: 6 },
];

export function CraftingTable({ wood, bagUpgraded, onCraft, onClose }: { wood: number; bagUpgraded: boolean; onCraft: (recipe: Recipe, cost: number) => void; onClose: () => void }) {
  return <aside className="craft-panel"><div className="craft-panel__head"><h2>🛠️ Стол для крафта</h2><button onClick={onClose}>✕</button></div><p>Древесина: 🪵 {wood}</p><div className="craft-panel__recipes">
    {RECIPES.map((recipe) => <button key={recipe.id} disabled={wood < recipe.cost || (recipe.id === 'bag' && bagUpgraded)} onClick={() => onCraft(recipe.id, recipe.cost)}>
      <i>{recipe.icon}</i><span><strong>{recipe.name}</strong><small>{recipe.id === 'bag' && bagUpgraded ? 'Уже создан' : `🪵 ${recipe.cost}`}</small></span>
    </button>)}
  </div></aside>;
}
