import { GameState, MINIONS, MinionKind } from './game';

const canBuy = (kind: MinionKind | undefined, coins: number): kind is MinionKind => Boolean(kind && kind.cost <= coins);

export function useBotSpell(game: GameState) {
  const attackers = game.units.filter((unit) => unit.side === 'player' && unit.name !== 'Тень');
  const dangerous = attackers.filter((unit) => unit.x >= 58);
  if (dangerous.length >= 5 && game.enemyCoins >= 55) {
    dangerous.forEach((unit) => { unit.health -= 8; });
    game.playerBase -= 5;
    game.enemyCoins -= 55;
    game.effects.push({ id: game.nextId++, kind: 'meteor', side: 'enemy', x: 28, life: 1.2 });
    return true;
  }
  if (dangerous.length >= 3 && game.enemyCoins >= 18) {
    dangerous.forEach((unit) => { unit.health -= 3; });
    game.enemyCoins -= 18;
    game.effects.push({ id: game.nextId++, kind: 'log', side: 'enemy', x: 50, life: 1.8 });
    return true;
  }
  return false;
}

export function chooseBotMinion(game: GameState, unlockedCount = MINIONS.length): MinionKind | null {
  const unlocked = MINIONS.slice(0, Math.max(3, unlockedCount));
  const pick = (name: string) => unlocked.find((kind) => kind.name === name);
  const players = game.units.filter((unit) => unit.side === 'player' && unit.name !== 'Тень');
  const allies = game.units.filter((unit) => unit.side === 'enemy' && unit.name !== 'Тень');
  const danger = players.filter((unit) => unit.x >= 60);
  const closeDanger = players.filter((unit) => unit.x >= 72);
  const playerRanged = players.filter((unit) => unit.projectile).length;
  const allyTanks = allies.filter((unit) => unit.hp >= 16 && !unit.healer);
  const hasHealer = allies.some((unit) => unit.healer);

  const bomber = pick('Бомбардировщик');
  if (closeDanger.length >= 3 && canBuy(bomber, game.enemyCoins)) return bomber;

  const iceMage = pick('Ледяная волшебница');
  if (players.some((unit) => unit.name === 'Дракон') && canBuy(iceMage, game.enemyCoins)) return iceMage;

  const ninja = pick('Ниндзя');
  if (playerRanged >= 2 && canBuy(ninja, game.enemyCoins)) return ninja;

  if (danger.length && !allyTanks.length) {
    const tank = [pick('Каменный голем'), pick('Титан'), pick('Страж')].find((kind) => canBuy(kind, game.enemyCoins));
    if (tank) return tank;
  }

  const healer = pick('Целительница');
  if (allies.length >= 2 && allyTanks.length > 0 && !hasHealer && canBuy(healer, game.enemyCoins)) return healer;

  const fireMage = pick('Огненная волшебница');
  if (allyTanks.length > 0 && canBuy(fireMage, game.enemyCoins) && allies.filter((unit) => unit.projectile).length < 2) return fireMage;

  const ram = pick('Таранщик');
  if (players.length <= 1 && allies.some((unit) => unit.x < 65) && canBuy(ram, game.enemyCoins)) return ram;

  const warlock = pick('Колдун теней');
  if (game.enemyCoins >= 90 && game.enemyBase > 45 && canBuy(warlock, game.enemyCoins)) return warlock;

  const swordAskar = pick('Аскар с мечом');
  if (unlocked.length === MINIONS.length && game.enemyCoins >= 100 && canBuy(swordAskar, game.enemyCoins)) return swordAskar;

  const dragon = pick('Дракон');
  if (game.enemyCoins >= 50 && game.enemyBase > 35 && canBuy(dragon, game.enemyCoins)) return dragon;

  if (!players.length && game.enemyCoins < 50 && game.enemyBase > 55) return null;
  const choices = unlocked.filter((kind) => kind.cost <= game.enemyCoins && kind.cost <= 34 && !kind.healer);
  return choices.sort((a, b) => (b.damage * 2.3 + b.hp * .3 + b.speed) - (a.damage * 2.3 + a.hp * .3 + a.speed))[0] ?? null;
}
