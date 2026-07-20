"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  message: string;
  className: string;
};

export function ConfirmSubmitButton({
  children,
  message,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        const confirmed = window.confirm(message);

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
