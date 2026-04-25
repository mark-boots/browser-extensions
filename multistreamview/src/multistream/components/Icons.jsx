const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" };

export const ChevronLeft  = ({ size = 14 }) => <svg {...props} width={size} height={size}><polyline points="15 18 9 12 15 6"/></svg>;
export const ChevronRight = ({ size = 14 }) => <svg {...props} width={size} height={size}><polyline points="9 18 15 12 9 6"/></svg>;
export const ChevronUp    = ({ size = 14 }) => <svg {...props} width={size} height={size}><polyline points="18 15 12 9 6 15"/></svg>;
export const ChevronDown  = ({ size = 14 }) => <svg {...props} width={size} height={size}><polyline points="6 9 12 15 18 9"/></svg>;

const swapProps = { ...props, strokeWidth: "2" };
export const SwapH = ({ size = 14 }) => (
  <svg {...swapProps} width={size} height={size}>
    <path d="M3 8h18M3 8l4-4M3 8l4 4"/>
    <path d="M21 16H3M21 16l-4-4M21 16l-4 4"/>
  </svg>
);
export const SwapV = ({ size = 14 }) => (
  <svg {...swapProps} width={size} height={size}>
    <path d="M8 3v18M8 3L4 7M8 3l4 4"/>
    <path d="M16 21V3M16 21l-4-4M16 21l4-4"/>
  </svg>
);
