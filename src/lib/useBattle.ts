import { useCallback, useEffect, useState } from 'react';
import { createDragonRider, createShadow, createUnit, GameState, initialGame, ItemKind, MINIONS, Projectile, Side, Unit } from './game';
import { chooseBotMinion } from './botAI';

export type GameMode = 'bot' | 'local';

function shoot(game: GameState, unit: Unit) {
  if (!unit.projectile || unit.attackTimer < 1) return;
  const shot: Projectile = { id: game.nextId++, side: unit.side, x: unit.x, damage: unit.damage, kind: unit.projectile };
  game.projectiles.push(shot);
  unit.attackTimer = 0;
}

function moveProjectiles(game: GameState, dt: number) {
  const active: Projectile[] = [];
  for (const shot of game.projectiles) {
    shot.x += (shot.side === 'player' ? 1 : -1) * (shot.kind === 'arrow' ? 18 : shot.kind === 'iceball' ? 10 : shot.kind === 'bomb' ? 9 : 12) * dt;
    const target = game.units.find((unit) => unit.side !== shot.side && Math.abs(unit.x - shot.x) < 2);
    if (target) {
      if (shot.kind === 'bomb') {
        game.units.filter((unit) => unit.side !== shot.side && Math.abs(unit.x - shot.x) < 6).forEach((unit) => { unit.health -= shot.damage; });
        game.explosions.push({ id: game.nextId++, x: shot.x, life: .65 });
      }
      else target.health -= shot.damage;
      continue;
    }
    if (shot.side === 'player' && shot.x >= 95) { game.enemyBase -= shot.damage; if (shot.kind === 'bomb') game.explosions.push({ id: game.nextId++, x: 94, life: .65 }); continue; }
    if (shot.side === 'enemy' && shot.x <= 5) { game.playerBase -= shot.damage; if (shot.kind === 'bomb') game.explosions.push({ id: game.nextId++, x: 6, life: .65 }); continue; }
    if (shot.x > 0 && shot.x < 100) active.push(shot);
  }
  game.projectiles = active;
}

function fight(game: GameState, unit: Unit, dt: number) {
  unit.attackTimer += dt;
  if (unit.healer) {
    const wounded = game.units.filter((ally) => ally.side === unit.side && ally.id !== unit.id && ally.health < ally.hp && Math.abs(ally.x - unit.x) < 16)
      .sort((a, b) => a.health / a.hp - b.health / b.hp)[0];
    if (wounded) {
      if (unit.attackTimer >= 1) { wounded.health = Math.min(wounded.hp, wounded.health + 3); unit.attackTimer = 0; }
      return;
    }
    const safeEdge = unit.side === 'player' ? 70 : 30;
    if ((unit.side === 'player' && unit.x < safeEdge) || (unit.side === 'enemy' && unit.x > safeEdge)) unit.x += (unit.side === 'player' ? 1 : -1) * unit.speed * dt;
    return;
  }
  const range = unit.projectile ? 18 : 4;
  const target = game.units.filter((foe) => foe.side !== unit.side && foe.health > 0)
    .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
  if (unit.name === 'Таранщик' && target && Math.abs(target.x - unit.x) < 4) {
    if (unit.attackTimer >= .8) { target.health -= unit.damage; unit.health -= 6; unit.attackTimer = 0; }
    return;
  }
  if (unit.name === 'Дракон' && target && Math.abs(target.x - unit.x) < 4) {
    if (unit.attackTimer >= .7) { target.health -= unit.damage; unit.attackTimer = 0; }
    return;
  }
  if (target && Math.abs(target.x - unit.x) < range) {
    if (unit.projectile) shoot(game, unit);
    else if (unit.attackTimer >= 1) { target.health -= unit.damage; unit.attackTimer = 0; }
    return;
  }
  const baseStop = unit.projectile ? 78 : 88;
  const nearBase = unit.side === 'player' ? unit.x >= baseStop : unit.x <= 100 - baseStop;
  if (nearBase) {
    unit.x = unit.side === 'player' ? baseStop : 100 - baseStop;
    if (unit.projectile) shoot(game, unit);
    else if (unit.attackTimer >= 1) {
      if (unit.side === 'player') game.enemyBase -= unit.damage; else game.playerBase -= unit.damage;
      if (unit.name === 'Таранщик') unit.health -= 6;
      unit.attackTimer = 0;
    }
    return;
  }
  unit.x += (unit.side === 'player' ? 1 : -1) * unit.speed * dt;
}

function simulate(previous: GameState, dt: number, mode: GameMode): GameState {
  if (previous.winner) return previous;
  const game = { ...previous, units: previous.units.map((unit) => ({ ...unit })), projectiles: previous.projectiles.map((shot) => ({ ...shot })), fallenUnits: previous.fallenUnits.map((unit) => ({ ...unit, life: unit.life - dt })), explosions: previous.explosions.map((effect) => ({ ...effect, life: effect.life - dt })), effects: previous.effects.map((effect) => ({ ...effect, life: effect.life - dt })) };
  game.coinTimer += dt; game.baseTimer += dt; game.enemyTimer += dt;
  if (game.coinTimer >= 1) { game.coins += 2; game.enemyCoins += 2; game.coinTimer -= 1; }
  if (mode === 'bot' && game.enemyTimer >= 1.8) {
    const kind = chooseBotMinion(game);
    if (kind) { game.units.push(createUnit(kind, 'enemy', game.nextId++)); game.enemyCoins -= kind.cost; }
    game.enemyTimer = 0;
  }
  game.units.forEach((unit) => {
    unit.summonTimer = (unit.summonTimer ?? 0) + dt;
    if (unit.name === 'Колдун теней' && unit.summonTimer >= 4) {
      game.units.push(createShadow(unit.side, game.nextId++, unit.x + (unit.side === 'player' ? 2 : -2)));
      unit.summonTimer = 0;
    }
    fight(game, unit, dt);
  });
  moveProjectiles(game, dt);
  if (game.baseTimer >= 1) {
    const left = game.units.find((unit) => unit.side === 'enemy' && unit.x <= 25);
    const right = game.units.find((unit) => unit.side === 'player' && unit.x >= 75);
    if (left) game.projectiles.push({ id: game.nextId++, side: 'player', x: 8, damage: 3, kind: 'arrow' });
    if (right) game.projectiles.push({ id: game.nextId++, side: 'enemy', x: 92, damage: 3, kind: 'arrow' });
    game.baseTimer = 0;
  }
  const defeated = game.units.filter((unit) => unit.health <= 0);
  game.coins += defeated.filter((unit) => unit.side === 'enemy').length * 3;
  game.enemyCoins += defeated.filter((unit) => unit.side === 'player').length * 3;
  game.fallenUnits.push(...defeated.map((unit) => ({ id: unit.id, side: unit.side, x: unit.x, color: unit.color, icon: unit.icon, life: .8 })));
  defeated.filter((unit) => unit.name === 'Дракон').forEach((dragon) => {
    game.units.push(createDragonRider(dragon.side, game.nextId++, dragon.x));
  });
  game.fallenUnits = game.fallenUnits.filter((unit) => unit.life > 0);
  game.explosions = game.explosions.filter((effect) => effect.life > 0);
  game.effects = game.effects.filter((effect) => effect.life > 0);
  game.units = game.units.filter((unit) => unit.health > 0 && unit.x > 2 && unit.x < 98);
  if (game.enemyBase <= 0) game.winner = 'player'; if (game.playerBase <= 0) game.winner = 'enemy';
  return game;
}

export function useBattle(mode: GameMode) {
  const [game, setGame] = useState(initialGame);
  useEffect(() => { const timer = window.setInterval(() => setGame((current) => simulate(current, .1, mode)), 100); return () => window.clearInterval(timer); }, [mode]);
  const summon = useCallback((index: number, side: Side = 'player') => setGame((current) => {
    const kind = MINIONS[index]; const balance = side === 'player' ? current.coins : current.enemyCoins;
    if (!kind || current.winner || balance < kind.cost) return current;
    return { ...current, coins: side === 'player' ? current.coins - kind.cost : current.coins, enemyCoins: side === 'enemy' ? current.enemyCoins - kind.cost : current.enemyCoins, nextId: current.nextId + 1, units: [...current.units, createUnit(kind, side, current.nextId)] };
  }), []);
  const useItem = useCallback((kind: ItemKind) => setGame((current) => {
    if (current.winner) return current;
    const costs: Record<ItemKind, number> = { log: 18, potion: 22, meteor: 55 };
    if (current.coins < costs[kind]) return current;
    const game = { ...current, coins: current.coins - costs[kind], units: current.units.map((unit) => ({ ...unit })), effects: [...current.effects] };
    const enemies = game.units.filter((unit) => unit.side === 'enemy');
    if (kind === 'log') enemies.forEach((unit) => { unit.health -= 3; });
    if (kind === 'potion') game.units.filter((unit) => unit.side === 'player').forEach((unit) => { unit.health = Math.min(unit.hp, unit.health + 6); });
    if (kind === 'meteor') { enemies.forEach((unit) => { unit.health -= 8; }); game.enemyBase -= 5; }
    game.effects.push({ id: game.nextId++, kind, side: 'player', x: kind === 'potion' ? 35 : kind === 'meteor' ? 72 : 50, life: kind === 'log' ? 1.8 : kind === 'meteor' ? 1.2 : .9 });
    return game;
  }), []);
  return { game, summon, useItem, restart: () => setGame(initialGame()) };
}
