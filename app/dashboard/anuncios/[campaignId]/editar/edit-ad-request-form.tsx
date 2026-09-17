"use client";

import {
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
  resubmitOwnerAdRequest,
} from "../../actions";

export type EditAdContact = {
  id: string;
  type: string;
  label: string;
  value: string;
};

type Props = {
  campaignId: string;
  businessName: string;

  title: string;
  description: string;

  requestedDays: number;
  startMode: string;
  requestedStartAt: string;

  targetChoice: string;

  imageUrl: string;

  contacts: EditAdContact[];

  correctionNotes: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Reenviando..."
        : "Reenviar a revisión"}
    </button>
  );
}

function getContactTypeLabel(
  type: string,
) {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Teléfono",
    email: "Correo",
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    messenger: "Messenger",
    website: "Sitio web",
    custom: "Contacto",
  };

  return labels[type] ?? "Contacto";
}

export function EditAdRequestForm({
  campaignId,
  businessName,
  title,
  description,
  requestedDays,
  startMode: initialStartMode,
  requestedStartAt,
  targetChoice: initialTargetChoice,
  imageUrl,
  contacts,
  correctionNotes,
}: Props) {
  const [days, setDays] = useState(
    requestedDays,
  );

  const [startMode, setStartMode] =
    useState(initialStartMode);

  const [
    targetChoice,
    setTargetChoice,
  ] = useState(initialTargetChoice);

  const totalPrice =
    Number.isFinite(days) && days > 0
      ? days * 50
      : 0;

  return (
    <form
      action={resubmitOwnerAdRequest}
      className="mt-8 space-y-8"
    >
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
          Correcciones solicitadas
        </p>

        <h2 className="mt-2 text-xl font-black text-orange-950">
          Revisa las observaciones antes de reenviar
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-orange-900">
          {correctionNotes}
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Negocio y contenido
        </h2>

        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm font-bold text-gray-700">
              Negocio anunciante
            </p>

            <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-black text-gray-950">
              {businessName}
            </p>
          </div>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Título del anuncio
            </span>

            <input
              name="title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              defaultValue={title}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Descripción
            </span>

            <textarea
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={description}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Imagen del anuncio
            </span>

            <input
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />

            <span className="mt-2 block text-xs text-gray-500">
              JPEG, PNG o WebP. Máximo 1000 KB. Si no seleccionas otro archivo, se conservará la imagen actual.
            </span>
          </label>

          <div className="rounded-2xl bg-gray-50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Imagen actual de ${title}`}
              className="max-h-72 w-full rounded-xl object-contain"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Duración y precio
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          El precio permanece en $50 MXN por día.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-sm font-bold text-gray-700">
              Número de días
            </span>

            <input
              name="requestedDays"
              type="number"
              required
              min="1"
              step="1"
              value={days}
              onChange={(event) => {
                const value = Number(
                  event.target.value,
                );

                setDays(
                  Number.isFinite(value)
                    ? value
                    : 1,
                );
              }}
              className="mt-2 w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total actualizado
            </p>

            <p className="mt-2 text-3xl font-black text-violet-950">
              ${totalPrice.toLocaleString(
                "es-MX",
              )}{" "}
              MXN
            </p>

            <p className="mt-1 text-xs font-semibold text-violet-700">
              {days > 0
                ? `${days} × $50`
                : "$50 por día"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Inicio solicitado
        </h2>

        <div className="mt-5 grid gap-3">
          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="asap"
              checked={startMode === "asap"}
              onChange={() =>
                setStartMode("asap")
              }
            />

            <span>
              <span className="block font-bold text-gray-950">
                Lo antes posible
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Empezará después de la aprobación y verificación del pago.
              </span>
            </span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="scheduled"
              checked={
                startMode === "scheduled"
              }
              onChange={() =>
                setStartMode("scheduled")
              }
            />

            <span className="font-bold text-gray-950">
              Elegir fecha y hora
            </span>
          </label>
        </div>

        {startMode === "scheduled" ? (
          <label className="mt-5 block">
            <span className="text-sm font-bold text-gray-700">
              Nueva fecha y hora
            </span>

            <input
              name="requestedStartAt"
              type="datetime-local"
              required
              defaultValue={
                requestedStartAt
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:max-w-md"
            />
          </label>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Destino del anuncio
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Sigue limitado a la página o a los contactos públicos del mismo negocio.
        </p>

        <select
          name="targetChoice"
          required
          value={targetChoice}
          onChange={(event) =>
            setTargetChoice(
              event.target.value,
            )
          }
          className="mt-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
        >
          <option value="business_page">
            Página de {businessName}
          </option>

          {contacts.map((contact) => (
            <option
              key={contact.id}
              value={`contact:${contact.id}`}
            >
              {getContactTypeLabel(
                contact.type,
              )}{" "}
              · {contact.label} ·{" "}
              {contact.value}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-blue-950">
          Volverá a revisión
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Al reenviar, el anuncio volverá al estado de revisión administrativa.
          Todavía no se generará ningún pago.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
