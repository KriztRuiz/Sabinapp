"use client";

import type { FormEvent, ReactNode } from "react";

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  confirmFieldName?: string;
  confirmFieldLabel?: string;
};

export function ConfirmActionForm({
  action,
  children,
  confirmMessage,
  className,
  confirmFieldName,
  confirmFieldLabel,
}: ConfirmActionFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);

    let message = confirmMessage;

    if (confirmFieldName) {
      const fieldValue = String(
        formData.get(confirmFieldName) ?? "",
      ).trim();

      if (fieldValue) {
        message += `\n\n${
          confirmFieldLabel ?? confirmFieldName
        }: ${fieldValue}`;
      }
    }

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={action}
      className={className}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}
