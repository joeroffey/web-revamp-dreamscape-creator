import React from 'react';

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  right?: React.ReactNode;
};

/**
 * Consistent header used across all Admin pages.
 */
export function AdminPageHeader({ title, description, right }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
