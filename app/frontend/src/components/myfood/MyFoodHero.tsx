interface MyFoodHeroProps {
  balance: number;
  consumedKg?: number;
  donatedKg?: number;
  requestCount?: number;
}

export default function MyFoodHero({
  balance,
  consumedKg = 0,
  donatedKg = 0,
  requestCount = 0,
}: MyFoodHeroProps) {
  return (
    <div className="m-hero">
      <div className="hero-body">
        <div className="hero-cycle">Hub Currency</div>
        <div className="hero-dates">{balance} HC</div>
        <div className="hero-epoch">Earned through donations · This cycle</div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val">{consumedKg}</div>
            <div className="hero-stat-lbl">Consumed kg</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">{donatedKg}</div>
            <div className="hero-stat-lbl">Donated kg</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">{requestCount}</div>
            <div className="hero-stat-lbl">Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
}
