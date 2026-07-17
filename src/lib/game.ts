export type Side = 'player' | 'enemy';
export type Winner = Side | null;
export type ProjectileKind = 'arrow' | 'fireball' | 'iceball' | 'bomb' | 'shadoworb' | 'joy' | 'kindness' | 'swordwave' | 'superswordwave';
export type CharacterGender = 'girl' | 'boy';

export type MinionKind = {
  name: string; icon: string; cost: number; hp: number;
  damage: number; speed: number; color: string;
  gender: CharacterGender;
  healer?: boolean;
  projectile?: ProjectileKind;
  spectral?: boolean;
};

export type Unit = MinionKind & {
  id: number; side: Side; x: number; health: number; attackTimer: number; summonTimer: number;
  crying?: boolean;
  cryingDefeated?: boolean;
  enraged?: boolean;
  calmed?: boolean;
  ultimateTimer?: number;
};

export type Projectile = {
  id: number; side: Side; x: number; damage: number; kind: ProjectileKind; hitsSpectral?: boolean; hitIds?: number[];
};

export type FallenUnit = {
  id: number; side: Side; x: number; color: string; icon: string; life: number;
};

export type Explosion = { id: number; x: number; life: number };
export type ItemKind = 'log' | 'potion' | 'meteor';
export type BattleEffect = { id: number; kind: ItemKind; side: Side; x: number; life: number };

export type GameState = {
  coins: number; enemyCoins: number; playerBase: number; enemyBase: number;
  units: Unit[]; projectiles: Projectile[]; fallenUnits: FallenUnit[]; explosions: Explosion[]; effects: BattleEffect[]; winner: Winner; nextId: number;
  coinTimer: number; baseTimer: number; enemyTimer: number;
  heroBanCooldown: number; enemyHeroBanCooldown: number;
};

export const MAX_BASE_HP = 100;
export const MINIONS: MinionKind[] = [
  { name: 'Разведчик', icon: '⚔️', cost: 8, hp: 6, damage: 1, speed: 4, color: '#59a9ff', gender: 'boy' },
  { name: 'Лучница', icon: '🏹', cost: 11, hp: 7, damage: 2, speed: 3.4, color: '#4fc48d', gender: 'girl', projectile: 'arrow' },
  { name: 'Страж', icon: '🛡️', cost: 16, hp: 14, damage: 2, speed: 2.2, color: '#9b7cff', gender: 'boy' },
  { name: 'Огненная волшебница', icon: '🔥', cost: 20, hp: 9, damage: 4, speed: 2.6, color: '#e56fc5', gender: 'girl', projectile: 'fireball' },
  { name: 'Берсерк', icon: '🪓', cost: 24, hp: 17, damage: 3, speed: 2.8, color: '#ef7356', gender: 'boy' },
  { name: 'Титан', icon: '🔨', cost: 28, hp: 24, damage: 4, speed: 1.4, color: '#ffb84d', gender: 'boy' },
  { name: 'Ниндзя', icon: '🥷', cost: 14, hp: 8, damage: 3, speed: 4.5, color: '#3f506b', gender: 'girl' },
  { name: 'Рыцарь', icon: '🗡️', cost: 19, hp: 16, damage: 3, speed: 2.3, color: '#7c91a8', gender: 'boy' },
  { name: 'Пиратка', icon: '🏴‍☠️', cost: 17, hp: 11, damage: 3, speed: 3.1, color: '#c96945', gender: 'girl' },
  { name: 'Друид', icon: '🌿', cost: 22, hp: 15, damage: 3, speed: 2.5, color: '#65a653', gender: 'boy' },
  { name: 'Ледяная волшебница', icon: '❄️', cost: 26, hp: 13, damage: 5, speed: 2.1, color: '#62c5df', gender: 'girl', projectile: 'iceball' },
  { name: 'Дракон', icon: '🐉', cost: 50, hp: 20, damage: 4, speed: 1.8, color: '#d84c43', gender: 'boy', projectile: 'fireball' },
  { name: 'Бомбардировщик', icon: '💣', cost: 30, hp: 10, damage: 4, speed: 2.4, color: '#59616c', gender: 'boy', projectile: 'bomb' },
  { name: 'Колдун теней', icon: '🔮', cost: 90, hp: 18, damage: 5, speed: 1.7, color: '#5b367e', gender: 'boy', projectile: 'shadoworb' },
  { name: 'Целительница', icon: '💚', cost: 28, hp: 12, damage: 0, speed: 2.5, color: '#e9f4ef', gender: 'girl', healer: true },
  { name: 'Таранщик', icon: '🪵', cost: 34, hp: 18, damage: 9, speed: 9, color: '#8b5a2b', gender: 'boy' },
  { name: 'Копейщица', icon: '➶', cost: 15, hp: 8, damage: 3, speed: 3.7, color: '#4e9a72', gender: 'girl', projectile: 'arrow' },
  { name: 'Каменный голем', icon: '🗿', cost: 42, hp: 38, damage: 5, speed: 1, color: '#777d82', gender: 'boy' },
  { name: 'Призрак', icon: '👻', cost: 36, hp: 16, damage: 4, speed: 3.2, color: '#b9e8ef', gender: 'boy', spectral: true },
  { name: 'Айжулдыз', icon: '💖', cost: 60, hp: 24, damage: 5, speed: 3, color: '#a84fd0', gender: 'girl', projectile: 'joy' },
  { name: 'Жансая', icon: '🌟', cost: 55, hp: 20, damage: 4, speed: 3.4, color: '#df7a43', gender: 'girl', projectile: 'joy' },
  { name: 'Мама', icon: '💗', cost: 75, hp: 22, damage: 0, speed: 2.4, color: '#d96583', gender: 'girl', healer: true },
  { name: 'Папа', icon: '💪', cost: 85, hp: 50, damage: 9, speed: 1.8, color: '#315e83', gender: 'boy' },
  { name: 'Аскар с мечом', icon: '⚔️', cost: 100, hp: 36, damage: 11, speed: 5.5, color: '#286dcc', gender: 'boy', projectile: 'swordwave' },
];

export const initialGame = (): GameState => ({
  coins: 20, enemyCoins: 20, playerBase: MAX_BASE_HP, enemyBase: MAX_BASE_HP,
  units: [], projectiles: [], fallenUnits: [], explosions: [], effects: [], winner: null, nextId: 1,
  coinTimer: 0, baseTimer: 0, enemyTimer: 0, heroBanCooldown: 0, enemyHeroBanCooldown: 0,
});

export function createUnit(kind: MinionKind, side: Side, id: number): Unit {
  return { ...kind, id, side, x: side === 'player' ? 8 : 92, health: kind.hp, attackTimer: 0, summonTimer: 0 };
}

export function createDragonRider(side: Side, id: number, x: number): Unit {
  return {
    name: 'Драконий наездник', icon: '💥', cost: 0, hp: 10, health: 10,
    damage: 7, speed: 6.5, color: '#356fa9', gender: 'boy',
    id, side, x, attackTimer: 0, summonTimer: 0,
  };
}

export function createShadow(side: Side, id: number, x: number): Unit {
  return {
    name: 'Тень', icon: '◉', cost: 0, hp: 7, health: 7, damage: 2,
    speed: 4.8, color: '#282038', gender: 'boy', id, side, x,
    attackTimer: 0, summonTimer: 0,
  };
}
