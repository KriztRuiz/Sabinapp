"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type ConfirmAdminActionButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  className: string;
};

export function ConfirmAdminActionButton({
  children,
  confirmMessage,
  className,
}: ConfirmAdminActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
