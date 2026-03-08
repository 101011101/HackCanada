import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <>
      <div
        className={`sheet-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
      />
      <div className={`bottom-sheet${open ? ' open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-title">{title}</div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}
