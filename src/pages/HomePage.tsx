export function HomePage({ onPlay, onForest, onPlatformer, onAdventure, onMerge }: { onPlay: () => void; onForest: () => void; onPlatformer: () => void; onAdventure: () => void; onMerge: () => void }) {
  return <main className="home-page">
    <div className="home-page__card">
      <span className="home-page__badge">3D СТРАТЕГИЯ</span>
      <div className="home-page__army" aria-hidden="true">🧙‍♂️ 🥷 🏹 🐉</div>
      <h1>Битва баз</h1>
      <p>Собери армию из 12 героев, защити свою башню и сокруши крепость противника.</p>
      <button onClick={onPlay}>Играть</button>
      <button className="home-page__forest" onClick={onForest}>🌲 Новая игра: 99 ночей</button>
      <button className="home-page__platformer" onClick={onPlatformer}>🍄 Новый платформер</button>
      <button className="home-page__adventure" onClick={onAdventure}>🏝️ 3D-приключение</button>
      <button className="home-page__merge" onClick={onMerge}>🔥💧 Elemental Merge</button>
    </div>
  </main>;
}
