export function HomePage({ onPlay }: { onPlay: () => void }) {
  return <main className="home-page">
    <div className="home-page__card">
      <span className="home-page__badge">3D СТРАТЕГИЯ</span>
      <div className="home-page__army" aria-hidden="true">🧙‍♂️ 🥷 🏹 🐉</div>
      <h1>Битва баз</h1>
      <p>Собери армию из 12 героев, защити свою башню и сокруши крепость противника.</p>
      <button onClick={onPlay}>Играть</button>
    </div>
  </main>;
}
