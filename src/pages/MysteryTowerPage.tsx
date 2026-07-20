import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTwoPlayerRoom } from '../lib/useTwoPlayerRoom';

type Item = { id: string; name: string; amount: number };
type SaveData = { gold: number; items: Item[]; world: string; position: [number, number, number]; skin?: string; ownedSkins?: string[]; playerHealth?: number; monsterHealth?: number; monsterAlive?: boolean; towerChestOpened?: boolean; unlockedWorlds?: string[]; equippedItem?: string };
type Interaction = { id: string; label: string; x: number; z: number };
const SAVE_KEY = 'mystery-tower-web-save';
const SKINS = [{ id: 'traveler', name: 'Путник', color: 0x286dcc, price: 0 }, { id: 'knight', name: 'Рыцарь', color: 0x646c7c, price: 80 }, { id: 'mage', name: 'Маг', color: 0x7041a8, price: 120 }, { id: 'forest', name: 'Хранитель леса', color: 0x35754b, price: 160 }, { id: 'royal', name: 'Королевский герой', color: 0xc13f4f, price: 250 }];
const WORLD_SEQUENCE = [
  { id: 'candy', name: 'Сладкий мир', x: -100, color: 0xf2a7c7 }, { id: 'desert', name: 'Пустыня', x: -180, color: 0xd9a34f },
  { id: 'ghost', name: 'Дом призраков', x: -260, color: 0x39405a }, { id: 'wind', name: 'Башня Ветра', x: -340, color: 0x80b9c9 },
  { id: 'hell', name: 'Ад', x: -420, color: 0x69231e }, { id: 'heaven', name: 'Рай', x: -500, color: 0xe8e0a8 }, { id: 'void', name: 'Мир Пустоты', x: -580, color: 0x21162e },
];
const WORLD_BOSSES = [
  { id: 'desert', name: 'Джинн Песчаной Бури', hp: 420, damage: 22, color: 0x356ba8 }, { id: 'ghost', name: 'Злой Хозяин Призраков', hp: 500, damage: 24, color: 0x4d376b },
  { id: 'wind', name: 'Повелитель Бури', hp: 600, damage: 26, color: 0x438da5 }, { id: 'hell', name: 'Повелитель Ада', hp: 750, damage: 30, color: 0x8f241b },
  { id: 'heaven', name: 'Небесный Страж', hp: 900, damage: 32, color: 0xd4af4d }, { id: 'void', name: 'Создатель Злодеев', hp: 1200, damage: 38, color: 0x251238 },
];

export function MysteryTowerPage({ onHome }: { onHome: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerPosition = useRef(new THREE.Vector3(0, .9, 10));
  const movementKeys = useRef(new Set<string>());
  const towerChestOpened = useRef(false);
  const [gold, setGold] = useState(100);
  const [items, setItems] = useState<Item[]>([]);
  const [world, setWorld] = useState('Стартовая деревня');
  const [prompt, setPrompt] = useState('');
  const [dialogue, setDialogue] = useState<{ name: string; text: string } | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [bargainText, setBargainText] = useState('');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { connected, partnerOnline, partnerPosition, sendPosition } = useTwoPlayerRoom(roomCode);
  const sendPositionRef = useRef(sendPosition); sendPositionRef.current = sendPosition;
  const [equippedItem, setEquippedItem] = useState('');
  const [skinShopOpen, setSkinShopOpen] = useState(false);
  const [skin, setSkin] = useState('traveler');
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['traveler']);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [monsterHealth, setMonsterHealth] = useState(260);
  const [candyPrincessHealth, setCandyPrincessHealth] = useState(380);
  const [saveStatus, setSaveStatus] = useState('');
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>([]);
  const monsterHealthRef = useRef(260); const monsterAlive = useRef(true);
  const candyPrincessHealthRef = useRef(380); const candyPrincessAlive = useRef(true);
  const [worldBossHealth, setWorldBossHealth] = useState<Record<string, number>>(() => Object.fromEntries(WORLD_BOSSES.map((boss) => [boss.id, boss.hp])));
  const worldBossHealthRef = useRef(worldBossHealth); worldBossHealthRef.current = worldBossHealth;
  const stateRef = useRef({ gold, items, world, skin, ownedSkins, playerHealth, unlockedWorlds, equippedItem });
  stateRef.current = { gold, items, world, skin, ownedSkins, playerHealth, unlockedWorlds, equippedItem };
  const unlockedWorldsRef = useRef(unlockedWorlds); unlockedWorldsRef.current = unlockedWorlds;
  const skinRef = useRef(skin); skinRef.current = skin;

  const addItem = (id: string, name: string) => setItems((old) => {
    const found = old.find((item) => item.id === id);
    return found ? old.map((item) => item.id === id ? { ...item, amount: item.amount + 1 } : item) : [...old, { id, name, amount: 1 }];
  });
  const buy = (id: string, name: string, price: number) => { if (gold < price) return; setGold((value) => value - price); addItem(id, name); };
  const shopPrice = (price: number) => Math.ceil(price * (1 - discount));
  const bargain = () => { if (bargainText) return; const success = Math.random() > .35; if (success) { const value = Math.random() > .55 ? .2 : .1; setDiscount(value); setBargainText(`Мирон согласился! Скидка ${value * 100}%.`); } else setBargainText('Мирон не согласился снизить цену.'); };
  const sellPrices: Record<string, number> = { tower_key: 20, pickaxe: 15, potion: 8, iron_sword: 18 };
  const removeItem = (id: string) => setItems((old) => old.flatMap((item) => item.id !== id ? [item] : item.amount > 1 ? [{ ...item, amount: item.amount - 1 }] : []));
  const sell = (id: string) => { const price = sellPrices[id] ?? 5; removeItem(id); if (equippedItem === id) setEquippedItem(''); setGold((value) => value + price); };
  const useItem = (item: Item) => {
    if (item.id === 'potion') {
      if (playerHealth >= 100) { setDialogue({ name: 'Зелье лечения', text: 'У тебя уже полное здоровье.' }); return; }
      setPlayerHealth((health) => Math.min(100, health + 40)); removeItem(item.id); setDialogue({ name: 'Зелье лечения', text: 'Ты выпил зелье и восстановил 40 HP.' }); return;
    }
    if (item.id === 'iron_sword' || item.id === 'pickaxe') { setEquippedItem(item.id); setDialogue({ name: item.name, text: `${item.name} теперь у тебя в руках.` }); return; }
    if (item.id === 'tower_key') { setDialogue({ name: 'Ключ Башни', text: 'Подойди ко входу в Заброшенную Башню и нажми E — ключ откроет дверь.' }); return; }
    setDialogue({ name: item.name, text: 'Ты рассматриваешь этот редкий предмет. Он пригодится для открытия новых миров.' });
  };
  const save = () => { try { const data: SaveData = { ...stateRef.current, position: playerPosition.current.toArray() as [number, number, number], monsterHealth: monsterHealthRef.current, monsterAlive: monsterAlive.current, towerChestOpened: towerChestOpened.current }; localStorage.setItem(SAVE_KEY, JSON.stringify(data)); setSaveStatus('Игра сохранена!'); window.setTimeout(() => setSaveStatus(''), 2200); } catch { setSaveStatus('Не удалось сохранить игру'); } };
  const load = () => { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) { setSaveStatus('Сохранение не найдено'); return; } const data = JSON.parse(raw) as SaveData; setGold(data.gold ?? 100); setItems(data.items ?? []); setWorld(data.world ?? 'Стартовая деревня'); setSkin(data.skin ?? 'traveler'); setOwnedSkins(data.ownedSkins ?? ['traveler']); setPlayerHealth(data.playerHealth ?? 100); setUnlockedWorlds(data.unlockedWorlds ?? []); monsterHealthRef.current = data.monsterHealth ?? 100; setMonsterHealth(monsterHealthRef.current); monsterAlive.current = data.monsterAlive ?? monsterHealthRef.current > 0; towerChestOpened.current = data.towerChestOpened ?? false; if (Array.isArray(data.position) && data.position.length === 3) playerPosition.current.fromArray(data.position); setSaveStatus('Игра загружена!'); window.setTimeout(() => setSaveStatus(''), 2200); } catch { setSaveStatus('Сохранение повреждено'); } };
  const getSkin = (id: string) => SKINS.find((entry) => entry.id === id) ?? SKINS[0];
  const chooseSkin = (id: string) => { const entry = getSkin(id); if (ownedSkins.includes(id)) { setSkin(id); return; } if (gold < entry.price) return; setGold((value) => value - entry.price); setOwnedSkins((old) => [...old, id]); setSkin(id); };

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9bd8ff); scene.fog = new THREE.Fog(0x9bd8ff, 35, 105);
    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, .1, 250);
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.shadowMap.enabled = true; mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x35512b, 2)); const sun = new THREE.DirectionalLight(0xfff1c9, 2.3); sun.position.set(-20, 35, 15); sun.castShadow = true; scene.add(sun);
    const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .75 });
    const box = (name: string, position: [number, number, number], scale: [number, number, number], color: number) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale), material(color)); mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh; };
    const cylinder = (name: string, position: [number, number, number], radius: number, height: number, color: number) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), material(color)); mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; scene.add(mesh); return mesh; };
    const makeHumanoid = (name: string, x: number, z: number, clothes: number, hairColor = 0x34251f, style: 'girl' | 'boy' = 'boy') => {
      const group = new THREE.Group(); group.name = name; group.position.set(x, 0, z);
      const part = (geometry: THREE.BufferGeometry, color: number, px: number, py: number, pz: number) => { const mesh = new THREE.Mesh(geometry, material(color)); mesh.position.set(px, py, pz); mesh.castShadow = true; group.add(mesh); return mesh; };
      const torso = part(new THREE.CapsuleGeometry(.46, .85, 5, 9), clothes, 0, 1.35, 0); torso.scale.set(1, 1, .72);
      const neck = part(new THREE.CylinderGeometry(.15, .17, .25, 10), 0xdca77e, 0, 2.14, 0);
      const head = part(new THREE.SphereGeometry(.43, 18, 14), 0xefbd94, 0, 2.55, 0); head.scale.set(.92, 1.08, .9);
      const hair = part(new THREE.SphereGeometry(.445, 18, 10, 0, Math.PI * 2, 0, Math.PI * .55), hairColor, 0, 2.66, -.01); hair.scale.set(.94, 1.03, .92);
      if (style === 'girl') { const backHair = part(new THREE.CapsuleGeometry(.3, .65, 5, 9), hairColor, 0, 2.28, -.28); backHair.scale.set(1.25, 1, .6); const skirt = part(new THREE.ConeGeometry(.57, .72, 12), clothes, 0, .94, 0); skirt.rotation.y = Math.PI / 12; }
      for (const eyeX of [-.15, .15]) { const eyeWhite = part(new THREE.SphereGeometry(.065, 10, 8), 0xffffff, eyeX, 2.59, .36); eyeWhite.scale.set(1, .78, .45); part(new THREE.SphereGeometry(.032, 8, 6), 0x26313d, eyeX, 2.59, .405); }
      const nose = part(new THREE.ConeGeometry(.045, .13, 8), 0xd69673, 0, 2.47, .42); nose.rotation.x = Math.PI / 2;
      const leftArm = part(new THREE.CapsuleGeometry(.12, .72, 4, 7), clothes, -.61, 1.45, 0); leftArm.rotation.z = -.08;
      const rightArm = part(new THREE.CapsuleGeometry(.12, .72, 4, 7), clothes, .61, 1.45, 0); rightArm.rotation.z = .08;
      const leftLeg = part(new THREE.CapsuleGeometry(.15, .72, 4, 7), 0x26344c, -.24, .42, 0); const rightLeg = part(new THREE.CapsuleGeometry(.15, .72, 4, 7), 0x26344c, .24, .42, 0);
      part(new THREE.BoxGeometry(.34, .18, .58), 0x3a291f, -.24, .08, .12); part(new THREE.BoxGeometry(.34, .18, .58), 0x3a291f, .24, .08, .12);
      group.userData.limbs = { leftArm, rightArm, leftLeg, rightLeg, neck }; group.userData.outfit = [torso, leftArm, rightArm]; scene.add(group); return group;
    };
    box('Земля', [0, -.6, 0], [90, 1, 100], 0x4f9148); box('Дорога', [0, -.04, -2], [7, .12, 83], 0xa88457);
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1; const x = side * 11; const z = 18 - Math.floor(i / 2) * 13; const frontX = x - side * 3.56;
      box('Каменный фундамент', [x, .25, z], [7.5, .7, 6.5], 0x6d655a);
      box('Стены дома', [x, 2.15, z], [7, 3.5, 6], i % 4 < 2 ? 0xb98255 : 0xc49a68);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.35, 3.2, 4), material(i % 3 ? 0x6f2825 : 0x4f3028)); roof.name = 'Объёмная крыша'; roof.position.set(x, 5.45, z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
      box('Дверь', [frontX, 1.45, z], [.22, 2.45, 1.25], 0x4b2d1d);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), material(0xd7ad43)); knob.position.set(frontX - side * .15, 1.45, z + .35); scene.add(knob);
      for (const windowZ of [-1.8, 1.8]) {
        box('Оконная рама', [frontX, 2.5, z + windowZ], [.24, 1.35, 1.35], 0x493326);
        box('Светящееся окно', [frontX - side * .14, 2.5, z + windowZ], [.12, 1.02, 1.02], 0xffd77a);
        box('Переплёт', [frontX - side * .22, 2.5, z + windowZ], [.08, 1.15, .11], 0x3a291e);
        box('Переплёт', [frontX - side * .23, 2.5, z + windowZ], [.08, .11, 1.15], 0x3a291e);
      }
      for (const beamZ of [-2.75, 2.75]) box('Деревянная балка', [frontX - side * .08, 2.2, z + beamZ], [.18, 3.5, .2], 0x493326);
      box('Балка под крышей', [frontX - side * .08, 3.8, z], [.18, .2, 5.8], 0x493326);
      box('Крыльцо', [frontX - side * .75, .35, z], [1.45, .35, 2.1], 0x7a6248);
      box('Дымоход', [x + side * 1.8, 6.1, z + 1.1], [1, 3, 1], 0x5b5048);
    }
    for (let i = 0; i < 28; i++) { const x = (i % 2 ? 1 : -1) * (18 + (i % 4) * 4); const z = 34 - Math.floor(i / 2) * 5; cylinder('Дерево', [x, 2, z], .45, 4, 0x76502d); const crown = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 6), material(0x276f36)); crown.position.set(x, 5, z); scene.add(crown); }
    const interactions: Interaction[] = [
      { id: 'elder', label: 'Поговорить со старостой', x: -4, z: 9 }, { id: 'trader', label: 'Открыть магазин', x: 5, z: 3 }, { id: 'smith', label: 'Поговорить с кузнецом', x: -6, z: -5 }, { id: 'tower', label: 'Войти в Заброшенную Башню', x: 0, z: -36 },
      { id: 'candy', label: 'Сладкий мир — закрыто', x: 17, z: 25 }, { id: 'desert', label: 'Пустыня — закрыто', x: 20, z: 15 }, { id: 'ghost', label: 'Дом призраков — закрыто', x: 20, z: 5 }, { id: 'wind', label: 'Башня Ветра — закрыто', x: 20, z: -5 }, { id: 'hell', label: 'Ад — закрыто', x: 20, z: -15 }, { id: 'heaven', label: 'Рай — закрыто', x: 20, z: -25 }, { id: 'void', label: 'Мир Пустоты — закрыто', x: 20, z: -35 },
      { id: 'towerChest', label: 'Открыть древний сундук', x: 194, z: 0 }, { id: 'sealedDoor', label: 'Осмотреть древнюю дверь', x: 170, z: -79 }, { id: 'corridorExit', label: 'Открыть выход из коридора', x: 203, z: 0 },
      ...WORLD_SEQUENCE.flatMap((entry) => [{ id: `goal_${entry.id}`, label: `Завершить: ${entry.name}`, x: entry.x, z: -25 }, { id: `return_${entry.id}`, label: 'Вернуться в деревню', x: entry.x, z: 15 }]),
    ];
    makeHumanoid('Староста Елена', -4, 9, 0xb54f58, 0x5a3329, 'girl'); makeHumanoid('Торговец Мирон', 5, 3, 0xd99c2f, 0x493326, 'boy'); makeHumanoid('Кузнец Торвальд', -6, -5, 0x4a5361, 0x201a18, 'boy');
    const villagers = [
      makeHumanoid('Мира', -7, 16, 0x7f5ac6, 0x3b241e, 'girl'), makeHumanoid('Алиса', 7, 20, 0x3f8f74, 0xc27a45, 'girl'),
      makeHumanoid('Лея', -8, -15, 0xbd5f79, 0x2a201d, 'girl'), makeHumanoid('Артур', 8, 13, 0x386fa8, 0x4a2d20, 'boy'),
      makeHumanoid('Тим', -7, -20, 0x9a7338, 0xd0a06a, 'boy'), makeHumanoid('Рон', 7, -10, 0x6b7455, 0x261c19, 'boy'),
    ];
    const giveHat = (person: THREE.Group, color: number, tall = false) => { const brim = new THREE.Mesh(new THREE.CylinderGeometry(.64, .64, .09, 20), material(color)); brim.position.y = 2.91; brim.castShadow = true; person.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(tall ? .29 : .38, .43, tall ? .72 : .42, 16), material(color)); crown.position.y = tall ? 3.25 : 3.13; crown.castShadow = true; person.add(crown); const band = new THREE.Mesh(new THREE.CylinderGeometry(.435, .435, .09, 16), material(0xd5a94d)); band.position.y = tall ? 3.01 : 3.0; person.add(band); };
    giveHat(villagers[0], 0x6f3e86, true); giveHat(villagers[3], 0x705035); giveHat(villagers[4], 0x315a77, true); giveHat(villagers[5], 0x52613e);
    cylinder('Главная башня', [0, 9, -45], 8, 18, 0x343943);
    // Каменные пояса и неровная кладка делают силуэт старым и массивным.
    for (const y of [1, 5, 9, 13, 17]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(8.12, .22, 7, 48), material(0x565a62)); ring.position.set(0, y, -45); ring.rotation.x = Math.PI / 2; ring.castShadow = true; scene.add(ring); }
    for (let row = 0; row < 8; row++) for (let stone = 0; stone < 12; stone++) { const angle = stone / 12 * Math.PI * 2 + (row % 2) * .2; const brick = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.65, .42), material((row + stone) % 3 ? 0x41454d : 0x50545b)); brick.position.set(Math.sin(angle) * 8.02, 1.2 + row * 2.05, -45 + Math.cos(angle) * 8.02); brick.rotation.y = angle; brick.castShadow = true; scene.add(brick); }
    // Окна с холодным таинственным свечением.
    for (const y of [6.5, 11.5, 15.5]) for (const side of [-1, 1]) { const windowMesh = box('Окно башни', [side * 5.7, y, -39.35], [1.15, 2.35, .28], 0x79b9db); windowMesh.rotation.z = side * .05; const glow = new THREE.PointLight(0x6fcfff, 1.8, 9); glow.position.set(side * 5.7, y, -38.7); scene.add(glow); }
    // Зубцы, площадка и высокая старая крыша.
    for (let i = 0; i < 12; i++) { const angle = i / 12 * Math.PI * 2; const merlon = box('Зубец башни', [Math.sin(angle) * 7.2, 18.9, -45 + Math.cos(angle) * 7.2], [1.65, 2.1, 1.5], 0x3b3f47); merlon.rotation.y = angle; }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 7.5, 16), material(0x292238)); roof.name = 'Крыша башни'; roof.position.set(0, 23.5, -45); roof.castShadow = true; scene.add(roof);
    const flagPole = cylinder('Флагшток', [0, 29, -45], .1, 4, 0x28231f); flagPole.rotation.z = .04; box('Потрёпанный флаг', [1.25, 29.7, -45], [2.5, 1.25, .12], 0x642d47);
    // Каменный портал, деревянные ворота и два живых факела.
    box('Ворота башни', [0, 2.25, -36.85], [3.3, 4.5, .45], 0x26172f);
    for (const x of [-2.25, 2.25]) { box('Опора портала', [x, 2.4, -36.55], [1.1, 5.2, 1.2], 0x55535a); box('Факел', [x, 3.2, -35.75], [.16, 1.1, .16], 0x4b2e1d); const flame = new THREE.PointLight(0xff812e, 3.2, 10); flame.position.set(x, 4, -35.4); scene.add(flame); const fire = new THREE.Mesh(new THREE.ConeGeometry(.32, .8, 8), new THREE.MeshStandardMaterial({ color: 0xff7b22, emissive: 0xff3c08, emissiveIntensity: 2 })); fire.position.copy(flame.position); scene.add(fire); }
    box('Верх портала', [0, 5.1, -36.55], [5.6, 1.1, 1.2], 0x55535a);
    for (let i = 0; i < 7; i++) box('Ступень башни', [0, .12 + i * .08, -35 + i * .48], [5 - i * .28, .25, .65], 0x5c5a60);
    for (let i = 0; i < 7; i++) box('Портал', [20, 1.6, 25 - i * 10], [2.5, 3.2, .7], new THREE.Color().setHSL(i / 7, .65, .5).getHex());
    // Первый открываемый мир — яркая земля сладостей.
    box('Земля Сладкого мира', [-100, -.55, 0], [65, 1, 65], 0xf2a7c7); box('Шоколадная дорога', [-100, -.02, 0], [7, .12, 55], 0x75422d);
    for (let i = 0; i < 14; i++) { const angle = i / 14 * Math.PI * 2; const x = -100 + Math.sin(angle) * 22; const z = Math.cos(angle) * 22; cylinder('Палочка леденца', [x, 2, z], .16, 4, 0xffffff); const candy = new THREE.Mesh(new THREE.TorusGeometry(1.25, .34, 8, 22), material(i % 2 ? 0xff4f91 : 0x6bd9ff)); candy.position.set(x, 4.2, z); candy.rotation.x = Math.PI / 2; scene.add(candy); }
    // Большой пряничный замок Конфетного мира.
    box('Пряничный замок', [-100, 4.2, -21], [18, 8.5, 10], 0xb96c42);
    for (const x of [-107, -93]) { cylinder('Башенка из печенья', [x, 5, -21], 2.7, 10, 0xd68b56); const candyRoof = new THREE.Mesh(new THREE.ConeGeometry(3.35, 4.8, 16), material(x < -100 ? 0xff5c91 : 0x6fcdf0)); candyRoof.position.set(x, 12, -21); candyRoof.castShadow = true; scene.add(candyRoof); }
    const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(7.3, 5.3, 4), material(0xfff0f3)); centerRoof.position.set(-100, 11.1, -21); centerRoof.rotation.y = Math.PI / 4; centerRoof.castShadow = true; scene.add(centerRoof);
    box('Глазурь замка', [-100, 8.1, -15.85], [17, .8, .35], 0xfff3f6); box('Ворота замка', [-100, 2.4, -15.75], [4.2, 4.8, .45], 0x713b2d);
    for (const x of [-106, -102.5, 102.5, 106].map((value) => value > 0 ? -200 + value : value)) { box('Сахарное окно', [x, 5.3, -15.72], [1.4, 1.8, .35], 0x8ee8ff); }
    for (let i = 0; i < 6; i++) box('Леденцовая ступень', [-100, .12 + i * .1, -14 + i * .55], [7 - i * .45, .28, .8], i % 2 ? 0xffafd0 : 0xffffff);
    const castleCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshStandardMaterial({ color: 0xffdc55, emissive: 0xff8a33, emissiveIntensity: 2 })); castleCrystal.name = 'Кристалл Конфетного мира'; castleCrystal.position.set(-100, 2.2, -25); castleCrystal.rotation.z = .25; scene.add(castleCrystal); const crystalLight = new THREE.PointLight(0xffb75e, 3, 15); crystalLight.position.copy(castleCrystal.position); scene.add(crystalLight);
    // Шоколадная река, вафельный мост и мармеладная деревня.
    box('Шоколадная река', [-100, -.08, 3], [64, .22, 6], 0x5b2e27); for (let i = 0; i < 8; i++) box('Вафельная доска моста', [-100, .25, .5 + i * .72], [7, .28, .58], i % 2 ? 0xd49a55 : 0xe7b96e);
    for (let i = 0; i < 8; i++) { const side = i % 2 ? 1 : -1; const x = -100 + side * (11 + i % 3 * 4); const z = 9 - Math.floor(i / 2) * 7; box('Мармеладный домик', [x, 1.5, z], [4.6, 3, 4], i % 3 === 0 ? 0xf66c91 : i % 3 === 1 ? 0x76d9ad : 0xf3c85c); const gumRoof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 2.6, 4), material(i % 2 ? 0xffffff : 0xd88cff)); gumRoof.position.set(x, 4.3, z); gumRoof.rotation.y = Math.PI / 4; scene.add(gumRoof); box('Дверь домика', [x, 1.15, z + 2.05], [1.1, 2.1, .25], 0x703e32); }
    for (let i = 0; i < 18; i++) { const angle = i * 2.4; const radius = 12 + i % 4 * 4; const x = -100 + Math.sin(angle) * radius; const z = Math.cos(angle) * radius; if (z < -10 || Math.abs(z - 3) < 4) continue; cylinder('Карамельное дерево', [x, 1.7, z], .25, 3.4, 0xffffff); const crown = new THREE.Mesh(new THREE.SphereGeometry(1.55, 10, 8), material(i % 2 ? 0xff7db8 : 0x72dfff)); crown.position.set(x, 4, z); scene.add(crown); }
    const candyPrincess = makeHumanoid('Злая Принцесса Сладостей', -100, -11, 0xc63172, 0x4a1f36, 'girl'); candyPrincess.scale.setScalar(1.18);
    const princessCrown = new THREE.Mesh(new THREE.ConeGeometry(.58, .75, 5), new THREE.MeshStandardMaterial({ color: 0xffd84e, emissive: 0xff7a1f, emissiveIntensity: .8 })); princessCrown.position.y = 3.35; princessCrown.rotation.y = Math.PI; candyPrincess.add(princessCrown);
    const candyStaff = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 2.3, 8), material(0x5d203e)); candyStaff.position.set(.72, 1.55, 0); candyStaff.rotation.z = -.2; candyPrincess.add(candyStaff); const staffOrb = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3e8d, emissive: 0xff185f, emissiveIntensity: 2 })); staffOrb.position.set(.95, 2.65, 0); candyPrincess.add(staffOrb);
    box('Портал домой', [-100, 1.8, 15], [3, 3.6, .7], 0x77d6ff);
    for (const entry of WORLD_SEQUENCE.slice(1)) { box(`Земля: ${entry.name}`, [entry.x, -.55, 0], [65, 1, 65], entry.color); box(`Дорога: ${entry.name}`, [entry.x, -.02, -2], [7, .12, 54], entry.id === 'heaven' ? 0xffffff : 0x302c36); box(`Портал домой: ${entry.name}`, [entry.x, 1.8, 15], [3, 3.6, .7], 0x77d6ff); box(`Кристалл мира: ${entry.name}`, [entry.x, 1.2, -25], [1.5, 2.4, 1.5], new THREE.Color(entry.color).offsetHSL(.12, .25, .18).getHex()); for (let i = 0; i < 7; i++) { const angle = i / 7 * Math.PI * 2; cylinder(`Башня: ${entry.name}`, [entry.x + Math.sin(angle) * 20, 2.5, Math.cos(angle) * 20], .8 + i % 2 * .4, 5 + i % 3 * 2, new THREE.Color(entry.color).offsetHSL(0, -.1, -.16).getHex()); } }
    // Пустыня: пирамиды, кактусы, ветер и плотная песчаная буря.
    for (const [x, z, size] of [[-194, -18, 7], [-169, -22, 5], [-191, 15, 4]] as [number, number, number][]) { const pyramid = new THREE.Mesh(new THREE.ConeGeometry(size, size * .9, 4), material(0xc28b3f)); pyramid.position.set(x, size * .45, z); pyramid.rotation.y = Math.PI / 4; pyramid.castShadow = true; scene.add(pyramid); }
    for (let i = 0; i < 16; i++) { const x = -180 + Math.sin(i * 2.2) * (10 + i % 4 * 5); const z = Math.cos(i * 1.7) * (11 + i % 3 * 5); cylinder('Кактус', [x, 1.5, z], .28, 3, 0x397a47); }
    const sandstorm = new THREE.Group(); sandstorm.name = 'Песчаная буря'; sandstorm.position.set(-180, 0, 0); scene.add(sandstorm);
    const sandMaterial = new THREE.MeshBasicMaterial({ color: 0xe8bd72, transparent: true, opacity: .62 });
    for (let i = 0; i < 150; i++) { const grain = new THREE.Mesh(new THREE.SphereGeometry(.035 + i % 4 * .018, 4, 3), sandMaterial); const angle = i * 2.39; const radius = 4 + i % 28; grain.position.set(Math.sin(angle) * radius, .4 + i % 35 * .22, Math.cos(angle) * radius); grain.userData.speed = .4 + i % 7 * .08; sandstorm.add(grain); }
    const makeGenie = (name: string, x: number, z: number, scale: number, color: number) => { const genie = makeHumanoid(name, x, z, color, 0x171d35, 'boy'); genie.scale.setScalar(scale); const tail = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.8, 10), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: .8, emissive: color, emissiveIntensity: .25 })); tail.position.y = -.7; tail.rotation.x = Math.PI; genie.add(tail); return genie; };
    const desertGenie = makeGenie('Джинн Песчаной Бури', -180, -18, 1.65, 0x356ba8); makeGenie('Джинн-страж', -190, -11, .9, 0x5b8bc0); makeGenie('Джинн-страж', -170, -11, .9, 0x5b8bc0);
    // Дом призраков: старый особняк, кладбище и добрые духи.
    box('Дом призраков', [-260, 5, -20], [20, 10, 11], 0x29283a); box('Ворота Дома призраков', [-260, 2.7, -14.35], [4.5, 5.4, .5], 0x15131f);
    const ghostRoof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 6, 4), material(0x171522)); ghostRoof.position.set(-260, 12.4, -20); ghostRoof.rotation.y = Math.PI / 4; scene.add(ghostRoof);
    for (const x of [-267, -262, -258, -253]) { box('Светящееся окно особняка', [x, 6, -14.42], [2, 2.6, .25], 0x85dff2); const glow = new THREE.PointLight(0x78dfff, 1.5, 9); glow.position.set(x, 6, -13.8); scene.add(glow); }
    for (let i = 0; i < 13; i++) { const x = -281 + i % 5 * 8; const z = 9 - Math.floor(i / 5) * 8; box('Надгробие', [x, .9, z], [1.3, 1.8, .45], 0x555665); }
    const makeGhost = (x: number, z: number, size = 1) => { const ghost = new THREE.Group(); ghost.position.set(x, 2.1, z); const body = new THREE.Mesh(new THREE.SphereGeometry(.65 * size, 12, 9), new THREE.MeshStandardMaterial({ color: 0xcff8ff, transparent: true, opacity: .68, emissive: 0x76dcea, emissiveIntensity: .8 })); body.scale.y = 1.35; ghost.add(body); for (const eyeX of [-.2, .2]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.07 * size, 7, 5), material(0x243044)); eye.position.set(eyeX * size, .12 * size, .57 * size); ghost.add(eye); } scene.add(ghost); return ghost; };
    const friendlyGhosts = [makeGhost(-275, -4), makeGhost(-247, 1), makeGhost(-272, 12), makeGhost(-250, 10)];
    const ghostBoss = makeHumanoid('Злой Хозяин Призраков', -260, -11, 0x3a214f, 0x101018, 'boy'); ghostBoss.scale.setScalar(1.65); const bossAura = new THREE.PointLight(0x9b49e8, 3, 16); bossAura.position.set(-260, 4, -11); scene.add(bossAura);
    // Башня Ветра и парящие острова.
    cylinder('Башня Ветра', [-340, 7, -20], 6, 14, 0x7db6c5); for (let i = 0; i < 8; i++) { const angle = i / 8 * Math.PI * 2; const island = box('Парящий остров', [-340 + Math.sin(angle) * 20, 3 + i % 3 * 2, Math.cos(angle) * 20], [7, 1.2, 6], 0x7cae87); island.rotation.y = angle; }
    for (let i = 0; i < 4; i++) { const blade = box('Лопасть ветра', [-340, 8, -13.7], [8, .35, .3], 0xe3f8ff); blade.rotation.z = i * Math.PI / 4; }
    // Ад: лавовые реки и чёрная крепость.
    box('Лавовое поле', [-420, -.05, 2], [62, .3, 12], 0xff471f); box('Крепость Ада', [-420, 5, -21], [22, 10, 11], 0x24171a); for (const x of [-429, -411]) cylinder('Башня Ада', [x, 6, -21], 3.2, 12, 0x32181b);
    for (let i = 0; i < 10; i++) { const lava = new THREE.PointLight(0xff3b12, 2, 12); lava.position.set(-445 + i * 5, 1, 2); scene.add(lava); }
    // Рай: облака, золотой дворец и мост света.
    box('Небесный дворец', [-500, 5, -21], [22, 10, 12], 0xfff8d6); for (const x of [-509, -491]) cylinder('Золотая башня', [x, 7, -21], 2.8, 14, 0xe8c65b); box('Мост света', [-500, .4, -4], [7, .8, 34], 0xffffff);
    for (let i = 0; i < 16; i++) { const cloud = new THREE.Mesh(new THREE.SphereGeometry(2 + i % 3, 10, 7), material(0xffffff)); cloud.position.set(-500 + Math.sin(i * 2.1) * 25, 1 + i % 4 * 2, Math.cos(i * 1.4) * 25); cloud.scale.y = .45; scene.add(cloud); }
    // Мир Пустоты: чёрный храм, кристаллы и всевидящее око.
    box('Храм Пустоты', [-580, 5, -21], [24, 10, 13], 0x120b1d); for (let i = 0; i < 12; i++) { const angle = i / 12 * Math.PI * 2; const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1 + i % 3 * .35), new THREE.MeshStandardMaterial({ color: 0x6f35a8, emissive: 0x531d8c, emissiveIntensity: 1.5 })); crystal.position.set(-580 + Math.sin(angle) * 22, 1.5 + i % 2, Math.cos(angle) * 22); scene.add(crystal); }
    const voidEye = new THREE.Mesh(new THREE.SphereGeometry(2, 18, 12), new THREE.MeshStandardMaterial({ color: 0x0a0710, emissive: 0xb832ff, emissiveIntensity: 1.2 })); voidEye.position.set(-580, 10, -14); voidEye.scale.y = .48; scene.add(voidEye);
    const worldBossGroups: Record<string, THREE.Group> = { desert: desertGenie, ghost: ghostBoss };
    for (const boss of WORLD_BOSSES.filter((entry) => !['desert', 'ghost'].includes(entry.id))) { const entry = WORLD_SEQUENCE.find((worldEntry) => worldEntry.id === boss.id)!; const fighter = makeHumanoid(boss.name, entry.x, -11, boss.color, 0x16121c, 'boy'); fighter.scale.setScalar(boss.id === 'void' ? 2 : 1.65); worldBossGroups[boss.id] = fighter; }
    box('Пол башни', [100, -.5, 0], [35, 1, 45], 0x282832); for (let i = 0; i < 10; i++) cylinder('Колонна', [88 + (i % 2) * 24, 3, -17 + Math.floor(i / 2) * 8], .8, 7, 0x454552);
    box('Западная стена зала', [82.5, 4, 0], [1.2, 9, 46], 0x393c45);
    box('Северная стена зала', [100, 4, -22.5], [36, 9, 1.2], 0x393c45); box('Южная стена зала', [100, 4, 22.5], [36, 9, 1.2], 0x393c45);
    box('Восточная стена зала', [117.5, 4, -14.2], [1.2, 9, 16.5], 0x393c45); box('Восточная стена зала', [117.5, 4, 14.2], [1.2, 9, 16.5], 0x393c45);
    box('Крыша внутреннего зала', [100, 8.3, 0], [36.5, 1, 46.5], 0x292c34);
    box('Арка входа в коридор', [117.5, 7, 0], [1.4, 2.1, 12], 0x51545d);
    for (const z of [-16, -8, 0, 8, 16]) { const lamp = new THREE.PointLight(0xb6c8ff, 1.35, 14); lamp.position.set(87, 5.8, z); scene.add(lamp); }
    // Длинный главный коридор уходит далеко в глубину башни.
    box('Пол длинного коридора', [157, -.45, 0], [96, .8, 11], 0x242630);
    box('Левая стена коридора', [157, 3.5, -6], [96, 8, 1.1], 0x383b44); box('Правая стена коридора', [157, 3.5, 6], [96, 8, 1.1], 0x383b44);
    box('Потолок коридора', [157, 7.3, 0], [96, .8, 13], 0x30323a);
    for (let i = 0; i < 8; i++) { const x = 118 + i * 12; for (const z of [-5.35, 5.35]) cylinder('Колонна коридора', [x, 3.1, z], .48, 6.2, 0x555862); const archTop = box('Каменная арка', [x, 6.2, 0], [.8, 1.1, 11], 0x555862); archTop.rotation.z = i % 2 ? .015 : -.015; }
    // Боковой коридор с поворотом ведёт к тайному залу.
    box('Пол бокового коридора', [170, -.42, -35], [11, .85, 64], 0x22252d);
    box('Стена бокового коридора', [164, 3.5, -35], [1.1, 8, 64], 0x353841); box('Стена бокового коридора', [176, 3.5, -35], [1.1, 8, 64], 0x353841);
    box('Потолок бокового коридора', [170, 7.3, -35], [13, .8, 64], 0x2c2f37);
    for (let i = 0; i < 5; i++) { const z = -14 - i * 11; box('Поперечная арка', [170, 6.15, z], [11, 1, .75], 0x50535c); }
    // В заброшенном коридоре работает только одна старая лампочка.
    cylinder('Провод лампочки', [160, 6.55, 0], .035, 1.4, 0x171719);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 9), new THREE.MeshStandardMaterial({ color: 0xffd77b, emissive: 0xffa21c, emissiveIntensity: 3 })); bulb.name = 'Единственная горящая лампочка'; bulb.position.set(160, 5.82, 0); scene.add(bulb);
    const corridorLight = new THREE.PointLight(0xffa535, 3.4, 17, 2.2); corridorLight.position.copy(bulb.position); scene.add(corridorLight);
    // Конечный зал и запертая дверь для будущего этажа.
    box('Пол тайного зала', [170, -.4, -72], [28, .9, 22], 0x292634); box('Дальняя стена', [170, 4, -83], [29, 9, 1.2], 0x393641);
    box('Запертая древняя дверь', [170, 2.8, -82.3], [4.2, 5.6, .5], 0x372045); for (const x of [160, 180]) cylinder('Статуя тайного зала', [x, 2.5, -75], 1.1, 5, 0x4b4d59);
    const chest = box('Древний сундук', [194, .65, 0], [2.2, 1.3, 1.4], 0x70451f); box('Золотой замок сундука', [192.86, .72, 0], [.12, .45, .35], 0xe0b64c);
    box('Выход из коридора', [205, 3.1, 0], [.7, 6.2, 5], 0x4b3425); box('Каменная рама выхода', [204.5, 6.4, 0], [1.4, 1.1, 7.2], 0x5b5d66); for (const z of [-3.1, 3.1]) box('Каменная рама выхода', [204.5, 3.2, z], [1.4, 6.5, 1], 0x5b5d66);
    for (let i = 0; i < 14; i++) { const x = 122 + (i * 17) % 70; const z = i % 2 ? -4.7 : 4.7; const rubble = box('Обломок камня', [x, .18, z], [.35 + i % 3 * .18, .3, .5], 0x4a4c54); rubble.rotation.y = i * .7; rubble.rotation.z = .15; }
    for (const x of [132, 158, 184]) { box('Старое знамя', [x, 4.5, -5.38], [3.3, 4.2, .12], x === 158 ? 0x35234e : 0x542b38); }
    const monster = new THREE.Group(); monster.name = 'Страж коридора'; monster.position.set(200, 0, 0);
    const monsterPart = (geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number) => { const mesh = new THREE.Mesh(geometry, material(color)); mesh.position.set(x, y, z); mesh.castShadow = true; monster.add(mesh); return mesh; };
    const monsterBody = monsterPart(new THREE.CapsuleGeometry(1.05, 2.2, 7, 12), 0x27202e, 0, 2, 0); monsterBody.scale.z = .75;
    const monsterHead = monsterPart(new THREE.SphereGeometry(1.05, 16, 12), 0x35283e, 0, 4.05, 0); monsterHead.scale.set(1.15, .9, 1);
    for (const x of [-.43, .43]) { monsterPart(new THREE.SphereGeometry(.16, 10, 8), 0xff3a1f, x, 4.18, .91); const horn = monsterPart(new THREE.ConeGeometry(.18, .85, 8), 0x17131b, x * 1.35, 5.05, 0); horn.rotation.z = x > 0 ? -.28 : .28; }
    for (const x of [-1.25, 1.25]) { const arm = monsterPart(new THREE.CapsuleGeometry(.22, 1.55, 5, 8), 0x2c2333, x, 2.1, 0); arm.rotation.z = x > 0 ? -.2 : .2; }
    monsterPart(new THREE.BoxGeometry(1.3, .16, .16), 0xe8d9bf, 0, 3.68, .96); scene.add(monster);
    const player = makeHumanoid('Игрок', 0, 10, 0x286dcc, 0x2f211c);
    const onlinePartner = makeHumanoid('Онлайн-напарник', 0, 10, 0x20a464, 0x2f211c, 'girl');
    onlinePartner.visible = false;
    const keys = movementKeys.current; let yaw = Math.PI; let nearest: Interaction | null = null; let verticalSpeed = 0; let grounded = true; let monsterAttackCooldown = 0; let princessAttackCooldown = 0; let desertAttackCooldown = 0;
    const movementCode: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd', ShiftLeft: 'shift', ShiftRight: 'shift' };
    const keyDown = (event: KeyboardEvent) => { const movementKey = movementCode[event.code]; if (movementKey) { event.preventDefault(); keys.add(movementKey); } if (event.code === 'Space') { event.preventDefault(); if (grounded && !event.repeat) { verticalSpeed = 7.2; grounded = false; } } if (event.code === 'KeyF' && !event.repeat && monsterAlive.current && player.position.distanceTo(monster.position) < 3.6) { const damage = stateRef.current.items.some((item) => item.id === 'iron_sword') ? 20 : 8; monsterHealthRef.current = Math.max(0, monsterHealthRef.current - damage); setMonsterHealth(monsterHealthRef.current); monster.position.add(player.position.clone().sub(monster.position).setY(0).normalize().multiplyScalar(-.6)); if (monsterHealthRef.current <= 0) { monsterAlive.current = false; monster.visible = false; setGold((value) => value + 100); setDialogue({ name: 'Победа!', text: 'Страж коридора повержен. Ты получил 100 золотых!' }); } } if (event.code === 'KeyF' && !event.repeat && candyPrincessAlive.current && player.position.distanceTo(candyPrincess.position) < 3.8) { const damage = stateRef.current.items.some((item) => item.id === 'iron_sword') ? 20 : 8; candyPrincessHealthRef.current = Math.max(0, candyPrincessHealthRef.current - damage); setCandyPrincessHealth(candyPrincessHealthRef.current); if (candyPrincessHealthRef.current <= 0) { candyPrincessAlive.current = false; candyPrincess.visible = false; setGold((value) => value + 150); setDialogue({ name: 'Принцесса побеждена!', text: 'Ты остановил Злую Принцессу Сладостей и получил 150 золотых. Теперь забери кристалл у замка!' }); } } if (event.code === 'KeyI' && !event.repeat) setInventoryOpen((value) => !value); if (event.code === 'F5') { event.preventDefault(); save(); } if (event.code === 'F9') { event.preventDefault(); load(); } if (event.code === 'KeyE' && !event.repeat && nearest) {
      if (nearest.id === 'elder') setDialogue({ name: 'Староста Елена', text: 'Над деревней снова зажёгся свет Башни. Купи ключ и узнай, кто пробудился внутри.' });
      else if (nearest.id === 'trader') setShopOpen(true);
      else if (nearest.id === 'smith') { if (stateRef.current.gold >= 25) { setGold((v) => v - 25); addItem('iron_sword', 'Железный меч'); setDialogue({ name: 'Кузнец Торвальд', text: 'Меч готов. Пусть он защитит тебя в Башне!' }); } else setDialogue({ name: 'Кузнец Торвальд', text: 'Мне нужно 25 золотых для хорошего меча.' }); }
      else if (nearest.id === 'tower') { if (stateRef.current.items.some((item) => item.id === 'tower_key')) { playerPosition.current.set(100, .9, 15); setWorld('Заброшенная Башня'); } else setDialogue({ name: 'Запертая дверь', text: 'Нужен ключ. Его продаёт торговец Мирон.' }); }
      else if (nearest.id === 'towerChest') { if (!towerChestOpened.current) { towerChestOpened.current = true; setGold((value) => value + 75); addItem('tower_crystal', 'Кристалл Башни'); chest.scale.y = .55; chest.position.y = .32; setDialogue({ name: 'Древний сундук', text: 'Ты нашёл 75 золотых и загадочный Кристалл Башни!' }); } else setDialogue({ name: 'Пустой сундук', text: 'Ты уже забрал сокровище.' }); }
      else if (nearest.id === 'sealedDoor') setDialogue({ name: 'Древняя дверь', text: 'На двери восемь пустых углублений. Похоже, для неё нужны кристаллы из других миров.' });
      else if (nearest.id === 'corridorExit') { if (monsterAlive.current) setDialogue({ name: 'Выход заперт', text: 'Магическая печать исчезнет только после победы над Стражем.' }); else { if (!unlockedWorldsRef.current.includes('candy')) setUnlockedWorlds((old) => [...old, 'candy']); playerPosition.current.set(0, .9, -32); setWorld('Стартовая деревня'); setDialogue({ name: 'Новый мир открыт!', text: 'Ты прошёл Заброшенную Башню. Теперь портал в Сладкий мир работает!' }); } }
      else if (WORLD_SEQUENCE.some((entry) => entry.id === nearest!.id)) { const destination = WORLD_SEQUENCE.find((entry) => entry.id === nearest!.id)!; if (unlockedWorldsRef.current.includes(destination.id)) { playerPosition.current.set(destination.x, .9, 10); setWorld(destination.name); } else { const index = WORLD_SEQUENCE.findIndex((entry) => entry.id === destination.id); const required = index === 0 ? 'Заброшенную Башню' : WORLD_SEQUENCE[index - 1].name; setDialogue({ name: 'Закрытый портал', text: `Сначала пройди: ${required}.` }); } }
      else if (nearest.id.startsWith('return_')) { playerPosition.current.set(0, .9, 20); setWorld('Стартовая деревня'); }
      else if (nearest.id.startsWith('goal_')) { const currentId = nearest.id.replace('goal_', ''); const guardingBoss = WORLD_BOSSES.find((boss) => boss.id === currentId && worldBossHealthRef.current[boss.id] > 0); if (currentId === 'candy' && candyPrincessAlive.current) { setDialogue({ name: 'Кристалл защищён', text: 'Злая Принцесса Сладостей не даст забрать кристалл. Сначала победи её клавишей F!' }); } else if (guardingBoss) { setDialogue({ name: 'Кристалл защищён', text: `Сначала победи босса «${guardingBoss.name}» клавишей F!` }); } else { const index = WORLD_SEQUENCE.findIndex((entry) => entry.id === currentId); const next = WORLD_SEQUENCE[index + 1]; if (next) { if (!unlockedWorldsRef.current.includes(next.id)) setUnlockedWorlds((old) => [...old, next.id]); playerPosition.current.set(0, .9, 20); setWorld('Стартовая деревня'); setDialogue({ name: 'Новый мир открыт!', text: `${WORLD_SEQUENCE[index].name} пройден. Теперь открыт мир: ${next.name}!` }); } else { setDialogue({ name: 'Все миры пройдены!', text: 'Ты покорил Мир Пустоты и раскрыл тайну всех порталов!' }); } } }
      else setDialogue({ name: 'Древний портал', text: `${nearest.label}. Этот мир откроется в будущей главе.` });
    }};
    const bossKeyDown = (event: KeyboardEvent) => { if (event.code !== 'KeyF' || event.repeat) return; const boss = WORLD_BOSSES.find((entry) => worldBossHealthRef.current[entry.id] > 0 && player.position.distanceTo(worldBossGroups[entry.id].position) < 4.3); if (!boss) return; const damage = stateRef.current.items.some((item) => item.id === 'iron_sword') ? 20 : 8; const next = Math.max(0, worldBossHealthRef.current[boss.id] - damage); const updated = { ...worldBossHealthRef.current, [boss.id]: next }; worldBossHealthRef.current = updated; setWorldBossHealth(updated); if (next === 0) { worldBossGroups[boss.id].visible = false; const reward = 150 + WORLD_BOSSES.findIndex((entry) => entry.id === boss.id) * 35; setGold((value) => value + reward); setDialogue({ name: `${boss.name} побеждён!`, text: `Ты получил ${reward} золотых. Теперь можно забрать кристалл мира!` }); } };
    const keyUp = (event: KeyboardEvent) => { const movementKey = movementCode[event.code]; if (movementKey) keys.delete(movementKey); }; const clearKeys = () => keys.clear(); const mouseMove = (event: MouseEvent) => { if (event.buttons === 1) yaw -= event.movementX * .006; };
    window.addEventListener('keydown', keyDown); window.addEventListener('keydown', bossKeyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', clearKeys); window.addEventListener('mousemove', mouseMove);
    const canStand = (x: number, z: number) => { if (x < -50) return WORLD_SEQUENCE.some((entry) => Math.abs(x - entry.x) < 31 && Math.abs(z) < 31); if (x < 50) return x > -43 && x < 43 && z > -49 && z < 48; const inHall = x > 83.3 && x < 117.3 && z > -21.7 && z < 21.7; const inMainCorridor = x > 116.2 && x < 204.5 && z > -5.15 && z < 5.15; const inSideCorridor = x > 164.7 && x < 175.3 && z > -81.5 && z < 4.5; const inSecretRoom = x > 156.5 && x < 183.5 && z > -81.5 && z < -61.5; return inHall || inMainCorridor || inSideCorridor || inSecretRoom; };
    const clock = new THREE.Clock(); let frame = 0; let onlineSyncTimer = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .04);
      corridorLight.intensity = 2.7 + Math.sin(clock.elapsedTime * 17) * .45 + (Math.random() > .97 ? -2.1 : 0);
      monster.visible = monsterAlive.current; monsterAttackCooldown = Math.max(0, monsterAttackCooldown - dt); if (monsterAlive.current) { const toPlayer = player.position.clone().sub(monster.position); const distance = toPlayer.length(); if (player.position.x > 120 && distance < 24) { monster.rotation.y = Math.atan2(toPlayer.x, toPlayer.z); if (distance > 2.25) monster.position.addScaledVector(toPlayer.normalize(), 2.25 * dt); else if (monsterAttackCooldown <= 0) { monsterAttackCooldown = 1.25; setPlayerHealth((health) => { const next = Math.max(0, health - 12); if (next === 0) { playerPosition.current.set(100, .9, 15); setDialogue({ name: 'Ты проиграл', text: 'Страж победил тебя. Ты очнулся у входа в башню.' }); return 100; } return next; }); } } monster.position.y = Math.sin(clock.elapsedTime * 3) * .08; }
      candyPrincess.visible = candyPrincessAlive.current; princessAttackCooldown = Math.max(0, princessAttackCooldown - dt); if (candyPrincessAlive.current && player.position.x < -60) { const toPlayer = player.position.clone().sub(candyPrincess.position); const distance = toPlayer.length(); if (distance < 25) { candyPrincess.rotation.y = Math.atan2(toPlayer.x, toPlayer.z); if (distance > 2.6) candyPrincess.position.addScaledVector(toPlayer.normalize(), 2.8 * dt); else if (princessAttackCooldown <= 0) { princessAttackCooldown = 1; setPlayerHealth((health) => { const next = Math.max(0, health - 14); if (next === 0) { playerPosition.current.set(-100, .9, 12); setDialogue({ name: 'Принцесса победила', text: 'Злая Принцесса прогнала тебя к порталу. Попробуй снова!' }); return 100; } return next; }); } } candyPrincess.position.y = Math.sin(clock.elapsedTime * 4) * .06; }
      const inDesert = Math.abs(player.position.x + 180) < 35; sandstorm.visible = inDesert; if (inDesert) { sandstorm.rotation.y += dt * .7; scene.background = new THREE.Color(0xb98a52); scene.fog = new THREE.Fog(0xb98a52, 9, 48); } else if (player.position.x > -145 || player.position.x < -215) { scene.background = new THREE.Color(0x9bd8ff); scene.fog = new THREE.Fog(0x9bd8ff, 35, 105); }
      desertAttackCooldown = Math.max(0, desertAttackCooldown - dt); desertGenie.visible = worldBossHealthRef.current.desert > 0; if (inDesert && worldBossHealthRef.current.desert > 0) { const toPlayer = player.position.clone().sub(desertGenie.position); const distance = toPlayer.length(); desertGenie.position.y = .35 + Math.sin(clock.elapsedTime * 3) * .3; if (distance < 24) { desertGenie.rotation.y = Math.atan2(toPlayer.x, toPlayer.z); if (distance > 3) desertGenie.position.addScaledVector(toPlayer.normalize(), 2.5 * dt); else if (desertAttackCooldown <= 0) { desertAttackCooldown = 1.1; setPlayerHealth((health) => Math.max(1, health - 13)); } } }
      friendlyGhosts.forEach((ghost, index) => { ghost.position.y = 2.1 + Math.sin(clock.elapsedTime * 2 + index) * .45; ghost.rotation.y += dt * .35; });
      for (const boss of WORLD_BOSSES.filter((entry) => entry.id !== 'desert')) { const group = worldBossGroups[boss.id]; const entry = WORLD_SEQUENCE.find((worldEntry) => worldEntry.id === boss.id)!; const inWorld = Math.abs(player.position.x - entry.x) < 35; group.visible = worldBossHealthRef.current[boss.id] > 0; if (!inWorld || !group.visible) continue; const toPlayer = player.position.clone().sub(group.position); const distance = toPlayer.length(); group.position.y = Math.sin(clock.elapsedTime * 2.8) * .1; if (distance < 24) { group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z); if (distance > 2.8) group.position.addScaledVector(toPlayer.normalize(), (2.2 + WORLD_BOSSES.findIndex((value) => value.id === boss.id) * .12) * dt); else if (desertAttackCooldown <= 0) { desertAttackCooldown = 1.15; setPlayerHealth((health) => Math.max(1, health - boss.damage)); } } }
      const activeWorld = WORLD_SEQUENCE.find((entry) => Math.abs(player.position.x - entry.x) < 35); if (activeWorld && activeWorld.id !== 'desert') { const fogColors: Record<string, number> = { candy: 0xffc8df, ghost: 0x25263c, wind: 0x9ed8e6, hell: 0x3b0d0d, heaven: 0xeef5ff, void: 0x080510 }; const fogColor = fogColors[activeWorld.id] ?? 0x9bd8ff; scene.background = new THREE.Color(fogColor); scene.fog = new THREE.Fog(fogColor, activeWorld.id === 'ghost' || activeWorld.id === 'void' ? 12 : 28, activeWorld.id === 'ghost' || activeWorld.id === 'void' ? 55 : 95); }
      if (!grounded) { verticalSpeed -= 18 * dt; playerPosition.current.y += verticalSpeed * dt; if (playerPosition.current.y <= .9) { playerPosition.current.y = .9; verticalSpeed = 0; grounded = true; } }
      const input = new THREE.Vector3((keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0), 0, (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0));
      if (input.lengthSq()) { input.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); const step = input.multiplyScalar((keys.has('shift') ? 8 : 5) * dt); const nextX = playerPosition.current.x + step.x; const nextZ = playerPosition.current.z + step.z; if (canStand(nextX, playerPosition.current.z)) playerPosition.current.x = nextX; if (canStand(playerPosition.current.x, nextZ)) playerPosition.current.z = nextZ; player.rotation.y = Math.atan2(input.x, input.z); const limbs = player.userData.limbs; const swing = Math.sin(clock.elapsedTime * (keys.has('shift') ? 13 : 9)) * .55; limbs.leftArm.rotation.x = swing; limbs.rightArm.rotation.x = -swing; limbs.leftLeg.rotation.x = -swing; limbs.rightLeg.rotation.x = swing; } else { const limbs = player.userData.limbs; limbs.leftArm.rotation.x *= .8; limbs.rightArm.rotation.x *= .8; limbs.leftLeg.rotation.x *= .8; limbs.rightLeg.rotation.x *= .8; }
      player.position.copy(playerPosition.current); onlineSyncTimer -= dt; if (onlineSyncTimer <= 0) { onlineSyncTimer = .08; sendPositionRef.current({ x: player.position.x, y: player.position.y, z: player.position.z, rotation: player.rotation.y }); } const remotePoint = partnerPosition.current; onlinePartner.visible = Boolean(remotePoint); if (remotePoint) { onlinePartner.position.lerp(new THREE.Vector3(remotePoint.x, remotePoint.y, remotePoint.z), .28); onlinePartner.rotation.y = remotePoint.rotation; } const skinColor = getSkin(skinRef.current).color; for (const clothing of player.userData.outfit as THREE.Mesh[]) (clothing.material as THREE.MeshStandardMaterial).color.setHex(skinColor); const cameraOffset = new THREE.Vector3(Math.sin(yaw) * 7, 4.2, Math.cos(yaw) * 7); camera.position.lerp(player.position.clone().add(cameraOffset), .12); camera.lookAt(player.position.clone().add(new THREE.Vector3(0, .8, 0)));
      nearest = null; let best = 3; for (const entry of interactions) { const distance = Math.hypot(playerPosition.current.x - entry.x, playerPosition.current.z - entry.z); if (distance < best) { best = distance; nearest = entry; } }
      setPrompt(nearest?.label ?? ''); renderer.render(scene, camera);
    };
    animate(); const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); }; window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', keyDown); window.removeEventListener('keydown', bossKeyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', clearKeys); window.removeEventListener('mousemove', mouseMove); window.removeEventListener('resize', resize); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);

  const hold = (key: string, active: boolean) => active ? movementKeys.current.add(key) : movementKeys.current.delete(key);
  const jump = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  const attack = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }));
  const createRoom = () => { const code = Math.random().toString(36).slice(2, 8).toUpperCase(); setRoomInput(code); setRoomCode(code); };
  const joinRoom = () => { const code = roomInput.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase(); if (code) { setRoomInput(code); setRoomCode(code); } };
  const leaveRoom = () => { setRoomCode(''); setRoomInput(''); };
  const activeWorldBoss = WORLD_BOSSES.find((boss) => WORLD_SEQUENCE.find((entry) => entry.id === boss.id)?.name === world);

  return <main className="tower-game"><div ref={mountRef} className="tower-game__canvas" /><header><button onClick={onHome}>← Все игры</button><div><small>ТАЙНА</small><h1>Заброшенной башни</h1></div><strong>{world}</strong></header><aside><b>🪙 {gold}</b><button onClick={() => setInventoryOpen(true)}>🎒 Инвентарь</button><button onClick={() => setSkinShopOpen(true)}>🎭 Магазин скинов</button><button onClick={save}>💾 Сохранить</button><button onClick={load}>📂 Загрузить</button></aside><div className="tower-health"><span>Игрок: {playerHealth} HP</span><i><b style={{ width: `${playerHealth}%` }} /></i>{monsterAlive.current && <><span>Страж: {monsterHealth} HP</span><i><b className="monster" style={{ width: `${monsterHealth}%` }} /></i></>}</div><div className="tower-help">WASD — идти · Space — прыгать · F — атаковать · Shift — бег · E — действие · I — сумка</div>{prompt && <div className="tower-prompt">[E] {prompt}</div>}
    {world === 'Сладкий мир' && candyPrincessAlive.current && <div className="candy-boss-health"><b>👑 Злая Принцесса · МАКС. СЛОЖНОСТЬ</b><i><span style={{ width: `${candyPrincessHealth / 3.8}%` }} /></i><small>{candyPrincessHealth} HP</small></div>}
    {world === 'Пустыня' && worldBossHealth.desert > 0 && <div className="candy-boss-health desert-boss-health"><b>🧞 Джинн Бури</b><i><span style={{ width: `${worldBossHealth.desert / 2.2}%` }} /></i><small>{worldBossHealth.desert} HP</small></div>}
    {activeWorldBoss && activeWorldBoss.id !== 'desert' && worldBossHealth[activeWorldBoss.id] > 0 && <div className="candy-boss-health"><b>⚔️ {activeWorldBoss.name}</b><i><span style={{ width: `${worldBossHealth[activeWorldBoss.id] / activeWorldBoss.hp * 100}%` }} /></i><small>{worldBossHealth[activeWorldBoss.id]} HP</small></div>}
    <div className="tower-controls"><button onPointerDown={() => hold('w', true)} onPointerUp={() => hold('w', false)} onPointerLeave={() => hold('w', false)}>▲</button><button onPointerDown={() => hold('a', true)} onPointerUp={() => hold('a', false)} onPointerLeave={() => hold('a', false)}>◀</button><button onPointerDown={() => hold('s', true)} onPointerUp={() => hold('s', false)} onPointerLeave={() => hold('s', false)}>▼</button><button onPointerDown={() => hold('d', true)} onPointerUp={() => hold('d', false)} onPointerLeave={() => hold('d', false)}>▶</button><button className="tower-jump" onPointerDown={jump}>ПРЫЖОК</button><button className="tower-attack" onPointerDown={attack}>УДАР</button></div>
    <button className="tower-story-button" onClick={() => setStoryOpen(true)}>📖 История</button>
    <button className="tower-online-button" onClick={() => setOnlineOpen(true)}>🌐 {roomCode ? partnerOnline ? 'Напарник в игре' : `Комната ${roomCode}` : 'Играть вдвоём'}</button>
    {saveStatus && <div className="tower-save-status">{saveStatus}</div>}
    {storyOpen && <div className="tower-window"><section><button className="close" onClick={() => setStoryOpen(false)}>×</button><h2>📖 Тайна восьми миров</h2><p>Хранители запечатали Создателя Злодеев в Мире Пустоты и спрятали ключи в восьми мирах. Теперь Заброшенная башня пробудилась, порталы открываются, а их правители становятся злыми. Герою предстоит пройти все миры, спасти союзников и победить врага, который создал всех злодеев.</p><button onClick={() => setStoryOpen(false)}>Начать путешествие</button></section></div>}
    {onlineOpen && <div className="tower-window"><section><button className="close" onClick={() => setOnlineOpen(false)}>×</button><h2>🌐 Онлайн на двоих</h2>{roomCode ? <><p>Код комнаты: <b>{roomCode}</b></p><p>{connected ? partnerOnline ? '✅ Напарник подключён!' : '⏳ Ждём второго игрока…' : 'Подключение…'}</p><button onClick={() => void navigator.clipboard?.writeText(roomCode)}>Копировать код</button><button onClick={leaveRoom}>Выйти из комнаты</button></> : <><p>Создай комнату и отправь код другу или введи его код.</p><button onClick={createRoom}>Создать комнату</button><input value={roomInput} onChange={(event) => setRoomInput(event.target.value.toUpperCase())} maxLength={6} placeholder="КОД" /><button onClick={joinRoom}>Войти по коду</button></>}</section></div>}
    {dialogue && <div className="tower-dialog"><div><h3>{dialogue.name}</h3><p>{dialogue.text}</p><button onClick={() => setDialogue(null)}>Продолжить</button></div></div>}
    {shopOpen && <div className="tower-window"><section><button className="close" onClick={() => { setShopOpen(false); setDiscount(0); setBargainText(''); }}>×</button><h2>🧔 Торговец Мирон</h2><button onClick={bargain} disabled={!!bargainText}>🤝 Поторговаться</button>{bargainText && <p>{bargainText}</p>}<button onClick={() => buy('tower_key', 'Ключ Башни', shopPrice(40))}>🗝️ Ключ Башни — {shopPrice(40)} 🪙</button><button onClick={() => buy('pickaxe', 'Железная кирка', shopPrice(30))}>⛏️ Железная кирка — {shopPrice(30)} 🪙</button><button onClick={() => buy('potion', 'Зелье лечения', shopPrice(15))}>🧪 Зелье лечения — {shopPrice(15)} 🪙</button></section></div>}
    {inventoryOpen && <div className="tower-window"><section><button className="close" onClick={() => setInventoryOpen(false)}>×</button><h2>🎒 Инвентарь</h2>{equippedItem && <p>В руках: <b>{items.find((item) => item.id === equippedItem)?.name ?? 'предмет'}</b></p>}{items.length ? items.map((item) => <div className="tower-inventory-item" key={item.id}><span>{item.name} ×{item.amount}{equippedItem === item.id ? ' ✓' : ''}</span><button onClick={() => useItem(item)}>{item.id === 'potion' ? 'Использовать' : item.id === 'iron_sword' || item.id === 'pickaxe' ? 'Взять в руки' : 'Осмотреть'}</button><button onClick={() => sell(item.id)}>Продать за {sellPrices[item.id] ?? 5} 🪙</button></div>) : <p>Сумка пока пуста.</p>}</section></div>}
    {skinShopOpen && <div className="tower-window"><section><button className="close" onClick={() => setSkinShopOpen(false)}>×</button><h2>🎭 Магазин скинов</h2><p>Выбран: {getSkin(skin).name}</p>{SKINS.map((entry) => { const owned = ownedSkins.includes(entry.id); return <div className="tower-skin" key={entry.id}><i style={{ background: `#${entry.color.toString(16).padStart(6, '0')}` }} /><span>{entry.name}</span><button onClick={() => chooseSkin(entry.id)} disabled={skin === entry.id}>{skin === entry.id ? 'Надет' : owned ? 'Надеть' : `${entry.price} 🪙`}</button></div>; })}</section></div>}
    {shopOpen && <div className="miron-money" role="status"><span>Твои деньги</span><b>🪙 {gold}</b></div>}
  </main>;
}
