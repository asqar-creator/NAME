import { useCallback, useEffect, useState } from 'react';
import { createDragonRider, createShadow, createUnit, GameState, initialGame, ItemKind, MINIONS, Projectile, Side, Unit } from './game';
import { chooseBotMinion, useBotSpell } from './botAI';

export type GameMode = 'bot' | 'local';

function boostedByZhansaya(game: GameState, unit: Unit) {
  return unit.name !== 'Жансая' && game.units.some((ally) => ally.side === unit.side && ally.name === 'Жансая' && ally.health > 0 && Math.abs(ally.x - unit.x) <= 16);
}

function attackDamage(game: GameState, unit: Unit) { const boosted = boostedByZhansaya(game, unit) ? Math.ceil(unit.damage * 1.5) : unit.damage; if ((unit.ultimateTimer ?? 0) >= 7) { unit.ultimateTimer = 0; return boosted * 3; } return boosted; }
function takeDamage(unit: Unit, damage: number) { if (unit.name === 'Жансая' && unit.enraged) return; unit.health -= damage; }
function calmZhansaya(unit: Unit) { const original = MINIONS.find((kind) => kind.name === 'Жансая'); if (!original) return; unit.enraged = false; unit.calmed = true; unit.speed = original.speed; unit.damage = original.damage; unit.projectile = original.projectile; unit.icon = original.icon; unit.color = original.color; unit.health = Math.max(unit.health, Math.ceil(unit.hp * .5)); }

function shoot(game: GameState, unit: Unit) {
  if (!unit.projectile || unit.attackTimer < 1) return;
  const shot: Projectile = { id: game.nextId++, side: unit.side, x: unit.x, damage: attackDamage(game, unit), kind: unit.projectile, hitsSpectral: ['Огненная волшебница', 'Ледяная волшебница', 'Колдун теней'].includes(unit.name) };
  game.projectiles.push(shot);
  unit.attackTimer = 0;
}

function moveProjectiles(game: GameState, dt: number) {
  const active: Projectile[] = [];
  for (const shot of game.projectiles) {
    shot.x += (shot.side === 'player' ? 1 : -1) * (shot.kind === 'superswordwave' ? 20 : shot.kind === 'arrow' ? 18 : shot.kind === 'swordwave' ? 16 : shot.kind === 'slap' ? 17 : shot.kind === 'kindness' ? 15 : shot.kind === 'iceball' ? 10 : shot.kind === 'bomb' ? 9 : 12) * dt;
    if (shot.kind === 'superswordwave') {
      shot.hitIds ??= [];
      game.units.filter((unit) => unit.side !== shot.side && !shot.hitIds!.includes(unit.id) && Math.abs(unit.x - shot.x) < 4).forEach((unit) => { unit.health = 0; shot.hitIds!.push(unit.id); });
      if (shot.x > 3 && shot.x < 97) active.push(shot);
      continue;
    }
    const target = game.units.find((unit) => unit.side !== shot.side && (!unit.spectral || shot.hitsSpectral) && Math.abs(unit.x - shot.x) < 2);
    if (target) {
      if (shot.kind === 'kindness' && target.name !== 'Жансая') { target.side = shot.side; target.health = Math.max(target.health, Math.ceil(target.hp * .65)); target.x = shot.x + (shot.side === 'player' ? 2 : -2); continue; }
      if (shot.kind === 'bomb') {
        game.units.filter((unit) => unit.side !== shot.side && !unit.spectral && Math.abs(unit.x - shot.x) < 6).forEach((unit) => takeDamage(unit, shot.damage));
        game.explosions.push({ id: game.nextId++, x: shot.x, life: .65 });
      }
      else takeDamage(target, shot.damage);
      continue;
    }
    if (shot.side === 'player' && shot.x >= 95) { game.enemyBase -= shot.damage; if (shot.kind === 'bomb') game.explosions.push({ id: game.nextId++, x: 94, life: .65 }); continue; }
    if (shot.side === 'enemy' && shot.x <= 5) { game.playerBase -= shot.damage; if (shot.kind === 'bomb') game.explosions.push({ id: game.nextId++, x: 6, life: .65 }); continue; }
    if (shot.x > 0 && shot.x < 100) active.push(shot);
  }
  game.projectiles = active;
}

function fight(game: GameState, unit: Unit, dt: number) {
  unit.attackTimer += dt * (boostedByZhansaya(game, unit) ? 1.25 : 1);
  if (unit.name === 'Айжулдыз') {
    const companions = game.units.filter((ally) => ally.side === unit.side && ally.id !== unit.id && ally.health > 0 && !ally.crying && ally.name !== 'Тень');
    if (companions.length) {
      const front = companions.sort((a, b) => unit.side === 'player' ? b.x - a.x : a.x - b.x)[0];
      const maxFront = front.x + (unit.side === 'player' ? 1 : -1);
      if ((unit.side === 'player' && unit.x > maxFront) || (unit.side === 'enemy' && unit.x < maxFront)) { unit.x += Math.sign(maxFront - unit.x) * unit.speed * dt; return; }
    }
  }
  if (unit.healer) {
    if (unit.name === 'Мама' && unit.summonTimer >= 5) {
      const convert = game.units.filter((foe) => foe.side !== unit.side && foe.health > 0 && foe.name !== 'Жансая' && Math.abs(foe.x - unit.x) < 13)
        .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
      if (convert) { game.projectiles.push({ id: game.nextId++, side: unit.side, x: unit.x, damage: 0, kind: 'kindness' }); unit.summonTimer = 0; return; }
    }
    const wounded = game.units.filter((ally) => ally.side === unit.side && ally.id !== unit.id && ally.health < ally.hp && Math.abs(ally.x - unit.x) < 16)
      .sort((a, b) => a.health / a.hp - b.health / b.hp)[0];
    if (wounded) {
      const healing = unit.name === 'Мама' ? 10 : 3; const interval = unit.name === 'Мама' ? .7 : 1;
      if (unit.attackTimer >= interval) { wounded.health = Math.min(wounded.hp, wounded.health + healing); unit.attackTimer = 0; }
      return;
    }
    if (unit.name === 'Мама' && unit.attackTimer >= 1.2) {
      const foe = game.units.filter((enemy) => enemy.side !== unit.side && enemy.health > 0 && Math.abs(enemy.x - unit.x) < 18).sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
      if (foe) { game.projectiles.push({ id: game.nextId++, side: unit.side, x: unit.x, damage: 6, kind: 'slap' }); unit.attackTimer = 0; return; }
    }
    const escorts = game.units.filter((ally) => ally.side === unit.side && ally.id !== unit.id && !ally.healer && ally.name !== 'Тень' && ally.health > 0);
    if (!escorts.length) {
      if (unit.name === 'Мама') { const stop = unit.side === 'player' ? 78 : 22; unit.x += (unit.side === 'player' ? 1 : -1) * unit.speed * dt; unit.x = unit.side === 'player' ? Math.min(stop, unit.x) : Math.max(stop, unit.x); }
      else { const home = unit.side === 'player' ? 8 : 92; unit.x += Math.sign(home - unit.x) * unit.speed * dt; }
      return;
    }
    const front = escorts.sort((a, b) => unit.side === 'player' ? b.x - a.x : a.x - b.x)[0];
    const followPoint = front.x + (unit.side === 'player' ? -8 : 8);
    if (unit.side === 'player' && unit.x < followPoint) unit.x = Math.min(followPoint, unit.x + unit.speed * dt);
    if (unit.side === 'player' && unit.x > followPoint) unit.x = Math.max(followPoint, unit.x - unit.speed * dt);
    if (unit.side === 'enemy' && unit.x > followPoint) unit.x = Math.max(followPoint, unit.x - unit.speed * dt);
    if (unit.side === 'enemy' && unit.x < followPoint) unit.x = Math.min(followPoint, unit.x + unit.speed * dt);
    return;
  }
  const range = unit.projectile ? 18 : 4;
  const canAttackGhost = ['Огненная волшебница', 'Ледяная волшебница', 'Колдун теней'].includes(unit.name);
  const target = game.units.filter((foe) => foe.side !== unit.side && foe.health > 0 && (!foe.spectral || canAttackGhost))
    .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
  if (unit.name === 'Таранщик' && target && Math.abs(target.x - unit.x) < 4) {
    if (unit.attackTimer >= .8) { takeDamage(target, attackDamage(game, unit)); unit.health -= 6; unit.attackTimer = 0; }
    return;
  }
  if (unit.name === 'Дракон' && target && Math.abs(target.x - unit.x) < 4) {
    if (unit.attackTimer >= .7) { takeDamage(target, attackDamage(game, unit)); unit.attackTimer = 0; }
    return;
  }
  if (target && Math.abs(target.x - unit.x) < range) {
    if (unit.projectile) shoot(game, unit);
    else if (unit.attackTimer >= 1) { takeDamage(target, attackDamage(game, unit)); unit.attackTimer = 0; }
    return;
  }
  const baseStop = unit.projectile ? 78 : 88;
  const nearBase = unit.side === 'player' ? unit.x >= baseStop : unit.x <= 100 - baseStop;
  if (nearBase) {
    unit.x = unit.side === 'player' ? baseStop : 100 - baseStop;
    if (unit.projectile) shoot(game, unit);
    else if (unit.attackTimer >= 1) {
      if (unit.side === 'player') game.enemyBase -= attackDamage(game, unit); else game.playerBase -= attackDamage(game, unit);
      if (unit.name === 'Таранщик') unit.health -= 6;
      unit.attackTimer = 0;
    }
    return;
  }
  unit.x += (unit.side === 'player' ? 1 : -1) * unit.speed * dt;
}

function simulate(previous: GameState, dt: number, mode: GameMode, level: number): GameState {
  if (previous.winner) return previous;
  const game = { ...previous, units: previous.units.map((unit) => ({ ...unit })), projectiles: previous.projectiles.map((shot) => ({ ...shot })), fallenUnits: previous.fallenUnits.map((unit) => ({ ...unit, life: unit.life - dt })), explosions: previous.explosions.map((effect) => ({ ...effect, life: effect.life - dt })), effects: previous.effects.map((effect) => ({ ...effect, life: effect.life - dt })) };
  game.coinTimer += dt; game.baseTimer += dt; game.enemyTimer += dt;
  game.heroBanCooldown = Math.max(0, game.heroBanCooldown - dt);
  game.enemyHeroBanCooldown = Math.max(0, game.enemyHeroBanCooldown - dt);
  if (game.coinTimer >= 1) { game.coins += 2; game.enemyCoins += 2; game.coinTimer -= 1; }
  if (mode === 'bot' && game.enemyTimer >= Math.max(.45, 1.25 - (level - 1) * .07)) {
    const usedSpell = useBotSpell(game);
    const kind = usedSpell ? null : chooseBotMinion(game, level + 2);
    if (kind) { const enemy = createUnit(kind, 'enemy', game.nextId++); const power = 1 + Math.min(2, (level - 1) * .12); enemy.hp = Math.ceil(enemy.hp * power); enemy.health = enemy.hp; enemy.damage = Math.ceil(enemy.damage * power); enemy.speed *= 1 + Math.min(.65, (level - 1) * .04); game.units.push(enemy); game.enemyCoins -= kind.cost; }
    game.enemyTimer = 0;
  }
  game.units.forEach((unit) => {
    unit.summonTimer = (unit.summonTimer ?? 0) + dt;
    unit.ultimateTimer = Math.min(7, (unit.ultimateTimer ?? 0) + dt);
    if (unit.name === 'Айжулдыз' && unit.crying) {
      if (unit.health <= 0) { unit.crying = false; unit.cryingDefeated = true; return; }
      const nearbyEnemies = game.units.filter((foe) => foe.side !== unit.side && foe.health > 0 && Math.abs(foe.x - unit.x) < 14);
      const allEnemies = game.units.filter((foe) => foe.side !== unit.side && foe.health > 0);
      const enemyNearby = nearbyEnemies.length > 0;
      unit.attackTimer += dt;
      if (allEnemies.length && unit.attackTimer >= 1) { const tearsDamage = boostedByZhansaya(game, unit) ? 8 : 5; allEnemies.forEach((foe) => takeDamage(foe, tearsDamage)); unit.attackTimer = 0; }
      if (!enemyNearby && unit.summonTimer >= 2.5) { unit.crying = false; unit.health = Math.ceil(unit.hp * .55); unit.summonTimer = 0; }
      return;
    }
    if (unit.name === 'Колдун теней' && unit.summonTimer >= 4) {
      game.units.push(createShadow(unit.side, game.nextId++, unit.x + (unit.side === 'player' ? 2 : -2)));
      unit.summonTimer = 0;
    }
    fight(game, unit, dt);
  });
  moveProjectiles(game, dt);
  if (game.heroBanCooldown <= 0) {
    const banned = game.units.filter((unit) => unit.side === 'enemy' && unit.x <= 27).sort((a, b) => a.x - b.x)[0];
    if (banned) {
      if (banned.name === 'Жансая' && banned.enraged) calmZhansaya(banned); else { if (banned.name === 'Дракон') game.units.push(createDragonRider(banned.side, game.nextId++, banned.x)); game.units = game.units.filter((unit) => unit.id !== banned.id); }
      game.explosions.push({ id: game.nextId++, x: banned.x, life: .65 });
      game.heroBanCooldown = 15;
    }
  }
  if (game.enemyHeroBanCooldown <= 0) {
    const banned = game.units.filter((unit) => unit.side === 'player' && unit.x >= 73).sort((a, b) => b.x - a.x)[0];
    if (banned) {
      if (banned.name === 'Жансая' && banned.enraged) calmZhansaya(banned); else { if (banned.name === 'Дракон') game.units.push(createDragonRider(banned.side, game.nextId++, banned.x)); game.units = game.units.filter((unit) => unit.id !== banned.id); }
      game.explosions.push({ id: game.nextId++, x: banned.x, life: .65 });
      game.enemyHeroBanCooldown = 15;
    }
  }
  if (game.baseTimer >= 1) {
    const left = game.units.find((unit) => unit.side === 'enemy' && unit.x <= 25);
    const right = game.units.find((unit) => unit.side === 'player' && unit.x >= 75);
    if (left) game.projectiles.push({ id: game.nextId++, side: 'player', x: 8, damage: 3, kind: 'arrow' });
    if (right) game.projectiles.push({ id: game.nextId++, side: 'enemy', x: 92, damage: 3, kind: 'arrow' });
    game.baseTimer = 0;
  }
  game.units.filter((unit) => unit.name === 'Жансая' && unit.health <= 0 && !unit.enraged && !unit.calmed).forEach((unit) => { unit.enraged = true; unit.health = Math.ceil(unit.hp * .7); unit.speed *= 2.2; unit.damage *= 2; unit.projectile = undefined; unit.icon = '😡'; unit.color = '#d94432'; unit.attackTimer = 0; });
  game.units.filter((unit) => unit.name === 'Айжулдыз' && unit.health <= 0 && !unit.crying && !unit.cryingDefeated).forEach((unit) => { unit.crying = true; unit.health = Math.max(12, Math.ceil(unit.hp * .45)); unit.summonTimer = 0; });
  const defeated = game.units.filter((unit) => unit.health <= 0 && (unit.name !== 'Айжулдыз' || unit.cryingDefeated));
  defeated.filter((unit) => unit.name === 'Аскар с мечом').forEach((unit) => {
    game.projectiles.push({ id: game.nextId++, side: unit.side, x: unit.x, damage: 0, kind: 'superswordwave', hitsSpectral: true, hitIds: [] });
    game.effects.push({ id: game.nextId++, kind: 'meteor', side: unit.side, x: unit.x, life: .65 });
  });
  game.coins += defeated.filter((unit) => unit.side === 'enemy' && unit.name !== 'Тень').length * 3;
  game.enemyCoins += defeated.filter((unit) => unit.side === 'player' && unit.name !== 'Тень').length * 3;
  game.fallenUnits.push(...defeated.map((unit) => ({ id: unit.id, side: unit.side, x: unit.x, color: unit.color, icon: unit.icon, life: .8 })));
  defeated.filter((unit) => unit.name === 'Дракон').forEach((dragon) => {
    game.units.push(createDragonRider(dragon.side, game.nextId++, dragon.x));
  });
  game.fallenUnits = game.fallenUnits.filter((unit) => unit.life > 0);
  game.explosions = game.explosions.filter((effect) => effect.life > 0);
  game.effects = game.effects.filter((effect) => effect.life > 0);
  game.units = game.units.filter((unit) => (unit.health > 0 || unit.crying) && unit.x > 2 && unit.x < 98);
  if (game.enemyBase <= 0) game.winner = 'player'; if (game.playerBase <= 0) game.winner = 'enemy';
  return game;
}

export function useBattle(mode: GameMode, paused = false, level = 1) {
  const [game, setGame] = useState(initialGame);
  useEffect(() => { if (paused) return; const timer = window.setInterval(() => setGame((current) => simulate(current, .1, mode, level)), 100); return () => window.clearInterval(timer); }, [mode, paused, level]);
  const summon = useCallback((index: number, side: Side = 'player') => setGame((current) => {
    const kind = MINIONS[index]; const balance = side === 'player' ? current.coins : current.enemyCoins;
    if (!kind || current.winner || balance < kind.cost) return current;
    return { ...current, coins: side === 'player' ? current.coins - kind.cost : current.coins, enemyCoins: side === 'enemy' ? current.enemyCoins - kind.cost : current.enemyCoins, nextId: current.nextId + 1, units: [...current.units, createUnit(kind, side, current.nextId)] };
  }), []);
  const useItem = useCallback((kind: ItemKind, side: Side = 'player') => setGame((current) => {
    if (current.winner) return current;
    const costs: Record<ItemKind, number> = { log: 18, potion: 22, meteor: 55 };
    const balance = side === 'player' ? current.coins : current.enemyCoins;
    if (balance < costs[kind]) return current;
    const game = { ...current, coins: side === 'player' ? current.coins - costs[kind] : current.coins, enemyCoins: side === 'enemy' ? current.enemyCoins - costs[kind] : current.enemyCoins, units: current.units.map((unit) => ({ ...unit })), effects: [...current.effects] };
    const enemies = game.units.filter((unit) => unit.side !== side);
    if (kind === 'log') enemies.filter((unit) => !unit.spectral).forEach((unit) => takeDamage(unit, 3));
    if (kind === 'potion') game.units.filter((unit) => unit.side === side).forEach((unit) => { unit.health = Math.min(unit.hp, unit.health + 6); });
    if (kind === 'meteor') { enemies.filter((unit) => !unit.spectral).forEach((unit) => takeDamage(unit, 8)); if (side === 'player') game.enemyBase -= 5; else game.playerBase -= 5; }
    game.effects.push({ id: game.nextId++, kind, side, x: kind === 'potion' ? side === 'player' ? 35 : 65 : kind === 'meteor' ? side === 'player' ? 72 : 28 : 50, life: kind === 'log' ? 1.8 : kind === 'meteor' ? 1.2 : .9 });
    return game;
  }), []);
  return { game, summon, useItem, restart: () => setGame(initialGame()), replaceGame: setGame };
}
