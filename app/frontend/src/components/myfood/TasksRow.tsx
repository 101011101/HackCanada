interface TasksRowProps {
  onGroceriesClick?: () => void;
  onDonationsClick?: () => void;
}

export default function TasksRow({ onGroceriesClick, onDonationsClick }: TasksRowProps) {
  return (
    <div className="m-section">
      <div className="m-section-head">
        <span>Tasks</span>
        <div className="m-section-head-btns">
          <button type="button" className="btn btn--groceries" onClick={onGroceriesClick}>
            My Groceries
          </button>
          <button type="button" className="btn btn--donations" onClick={onDonationsClick}>
            My Donations
          </button>
        </div>
      </div>
    </div>
  );
}
