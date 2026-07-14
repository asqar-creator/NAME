import { GameState, MINIONS, MinionKind } from './game';

function minion(name: string) {
  return MINIONS.find((kind) => kind.name === name);
}

function affordable(kind: MinionKind | undefined, coins: number): kind is MinionKind {
  return kind !== undefined && kind.cost <= coins;
}

export function chooseBotMinion(game: GameState): MinionKind | null {
  const attackers = game.units.filter((unit) => unit.side === 'player');
  const danger = attackers.filter((unit) => unit.x >= 62);
  const nearbyGroup = danger.filter((unit) => unit.x >= 72);
  const hasDragon = attackers.some((unit) => unit.name === 'Дракон');
  const rangedArmy = attackers.filter((unit) => unit.projectile).length;

  const bomber = minion('Бомбардировщик');
  if (nearbyGroup.length >= 3 && affordable(bomber, game.enemyCoins)) return bomber;

  const iceMage = minion('Ледяная волшебница');
  if (hasDragon && affordable(iceMage, game.enemyCoins)) return iceMage;

  const ninja = minion('Ниндзя');
  if (rangedArmy >= 2 && affordable(ninja, game.enemyCoins)) return ninja;

  if (danger.length > 0) {
    const defenders = [minion('Титан'), minion('Страж'), minion('Рыцарь')]
      .filter((kind): kind is MinionKind => affordable(kind, game.enemyCoins));
    if (defenders.length) return defenders[0];
  }

  const warlock = minion('Колдун теней');
  if (game.enemyCoins >= 90 && affordable(warlock, game.enemyCoins)) return warlock;

  const dragon = minion('Дракон');
  if (game.enemyCoins >= 50 && game.enemyBase > 35 && affordable(dragon, game.enemyCoins)) return dragon;

  if (attackers.length === 0 && game.enemyCoins < 50 && game.enemyBase > 55) return null;

  const choices = MINIONS.filter((kind) => kind.cost <= game.enemyCoins && kind.cost <= 30);
  if (!choices.length) return null;
  return choices.sort((a, b) => {
    const scoreA = a.damage * 2 + a.hp * .35 + a.speed;
    const scoreB = b.damage * 2 + b.hp * .35 + b.speed;
    return scoreB - scoreA;
  })[0];
}
