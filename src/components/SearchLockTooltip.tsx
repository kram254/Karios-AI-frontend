import React from 'react';

interface SearchLockTooltipProps {
  children: React.ReactNode;
  show: boolean;
}

const SearchLockTooltip: React.FC<SearchLockTooltipProps> = ({ children, show }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            background: '#222',
            color: '#00F3FF',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            boxShadow: '0 2px 8px rgba(0,243,255,0.08)',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          
        </div>
      )}
    </div>
  );
};

export default SearchLockTooltip;
