import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SampleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export function SampleButton({
  children,
  variant = 'primary',
  style,
  ...rest
}: SampleButtonProps) {
  const baseStyle = {
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  } as const;

  const variantStyle =
    variant === 'primary'
      ? { background: '#2563eb', color: 'white' }
      : { background: '#e5e7eb', color: '#111827' };

  return (
    <button
      type="button"
      style={{ ...baseStyle, ...variantStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
