'use client';

import type { ButtonHTMLAttributes } from 'react';
import { requestOpenSupportChat } from '@/lib/support-chat-events';

export function OpenSupportChatButton({
  children,
  className,
  ...rest
}: { children: React.ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'>) {
  return (
    <button
      {...rest}
      type="button"
      className={className}
      onClick={() => requestOpenSupportChat()}
    >
      {children}
    </button>
  );
}
