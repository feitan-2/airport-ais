import { useState } from 'react';

const FieldHint = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 text-[10px] font-bold leading-none flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
        tabIndex={-1}
      >
        ?
      </button>
      {visible && (
        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {text}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </span>
      )}
    </span>
  );
};

export default FieldHint;
