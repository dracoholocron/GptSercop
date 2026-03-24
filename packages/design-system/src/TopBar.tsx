import React from 'react';

export interface TopBarProps {
  title?: string;
  rightContent?: React.ReactNode;
  userName?: string;
  role?: string;
}

export function TopBar({ title, rightContent, userName = 'Usuario CMX', role = 'Admin' }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center">
        {/* En móvil podríamos tener el botón de hamburguesa, por ahora solo mostramos el Top title */}
        <h1 className="text-lg font-bold text-text-primary md:text-xl lg:hidden">
            {title || 'SERCOP CMX'}
        </h1>
      </div>
      
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {rightContent}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />
        <div className="flex items-center gap-x-4">
            <div className="flex flex-col items-end">
               <span className="text-sm font-semibold leading-6 text-text-primary">{userName}</span>
               <span className="text-xs font-medium leading-4 text-primary">{role}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
                {userName.charAt(0)}
            </div>
        </div>
      </div>
    </header>
  );
}
