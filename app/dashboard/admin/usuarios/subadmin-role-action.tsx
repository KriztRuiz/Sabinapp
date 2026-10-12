"use client";

import type { FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { setSubadminRole } from "./actions";

type Props = {
  targetUserId: string;
  userName: string;
  hasRole: boolean;
  returnQuery: string;
};

function SubmitButton({ hasRole }: { hasRole: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        hasRole
          ? "rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          : "rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      }
    >
      {pending
        ? "Procesando..."
        : hasRole
          ? "Revocar subadmin"
          : "Asignar subadmin"}
    </button>
  );
}

export function SubadminRoleAction({
  targetUserId,
  userName,
  hasRole,
  returnQuery,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const message = hasRole
      ? `¿Confirmas revocar el rol de subadministrador a ${userName}?`
      : `¿Confirmas asignar el rol de subadministrador a ${userName}?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form action={setSubadminRole} onSubmit={handleSubmit}>
      <input
        type="hidden"
        name="targetUserId"
        value={targetUserId}
      />

      <input
        type="hidden"
        name="roleAction"
        value={hasRole ? "revoke" : "assign"}
      />

      <input
        type="hidden"
        name="returnQuery"
        value={returnQuery}
      />

      <SubmitButton hasRole={hasRole} />
    </form>
  );
}
