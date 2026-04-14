'use client';

import Link from 'next/link';

export default function DeevoLogo({ size = 'default', linkTo = '/', showIcon = true }) {
  const sizes = {
    small: { icon: 28, text: 80, fontSize: '1rem' },
    default: { icon: 36, text: 100, fontSize: '1.125rem' },
    large: { icon: 48, text: 140, fontSize: '1.5rem' },
    xlarge: { icon: 56, text: 160, fontSize: '1.75rem' },
  };

  const s = sizes[size] || sizes.default;

  return (
    <Link href={linkTo} className="navbar-brand" style={{ textDecoration: 'none' }}>
      {showIcon && (
        <div
          className="navbar-logo"
          style={{
            width: s.icon,
            height: s.icon,
            fontSize: `${s.icon * 0.45}px`,
            borderRadius: `${s.icon * 0.25}px`,
          }}
        >
          D
        </div>
      )}
      <img
        src="/deevo-logo.svg"
        alt="Deevo"
        style={{
          height: `${s.icon * 0.55}px`,
          width: 'auto',
          filter: 'brightness(1)',
        }}
      />
    </Link>
  );
}
