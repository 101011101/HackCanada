import { Link } from "react-router-dom";
import MobileTopbar from "@/components/myfood/MobileTopbar";
import BottomTabBar from "@/components/myfood/BottomTabBar";

export default function MyFarmPage() {
  return (
    <div className="shell">
      <MobileTopbar />
      <div className="m-content" style={{ padding: 24, flex: 1 }}>
        <h1 style={{ fontFamily: "var(--fd)", fontSize: 24, marginBottom: 8 }}>My Farm</h1>
        <p style={{ color: "var(--ink-2)", marginBottom: 16 }}>
          Your farm dashboard and crop assignments.
        </p>
        <Link to="/" className="btn btn--secondary">
          Go to Home
        </Link>
      </div>
      <BottomTabBar />
    </div>
  );
}
