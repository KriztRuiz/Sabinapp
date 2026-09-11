"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitOwnerAdRequest } from "../actions";

export type AdContactOption = {
  id: string;
  type: string;
  label: string;
  value: string;
};

export type AdBusinessOption = {
  id: string;
  name: string;
  slug: string;
  contacts: AdContactOption[];
};

type Props = {
  businesses: AdBusinessOption[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Enviando solicitud..."
        : "Enviar anuncio a revisión"}
    </button>
  );
}

function getContactTypeLabel(type: string) {
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

export function AdRequestForm({ businesses }: Props) {
  const [businessId, setBusinessId] = useState(
    businesses[0]?.id ?? "",
  );

  const [requestedDays, setRequestedDays] = useState(1);
  const [startMode, setStartMode] = useState("asap");
  const [targetChoice, setTargetChoice] =
    useState("business_page");

  const selectedBusiness = useMemo(
    () =>
      businesses.find(
        (business) => business.id === businessId,
      ) ?? businesses[0],
    [businessId, businesses],
  );

  const totalPrice =
    Number.isFinite(requestedDays) && requestedDays > 0
      ? requestedDays * 50
      : 0;

  function handleBusinessChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setBusinessId(event.target.value);
    setTargetChoice("business_page");
  }

  return (
    <form
      action={submitOwnerAdRequest}
      className="mt-8 space-y-8"
    >
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Negocio y contenido
        </h2>

        <div className="mt-6 grid gap-5">
          <label>
            <span className="text-sm font-bold text-gray-700">
              Negocio anunciante
            </span>

            <select
              name="businessId"
              required
              value={businessId}
              onChange={handleBusinessChange}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
            >
              {businesses.map((business) => (
                <option
                  key={business.id}
                  value={business.id}
                >
                  {business.name}
                </option>
              ))}
            </select>
          </label>

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
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Ej. Tacos al pastor este fin de semana"
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
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Describe brevemente lo que quieres promocionar."
            />
          </label>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Imagen del anuncio
            </span>

            <input
              name="imageUrl"
              type="url"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="https://..."
            />

            <span className="mt-2 block text-xs leading-5 text-gray-500">
              Este anuncio utiliza una sola imagen.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Duración y precio
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          El precio es fijo: $50 MXN por día.
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
              value={requestedDays}
              onChange={(event) => {
                const value = Number(event.target.value);

                setRequestedDays(
                  Number.isFinite(value) ? value : 1,
                );
              }}
              className="mt-2 w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total estimado
            </p>

            <p className="mt-2 text-3xl font-black text-violet-950">
              ${totalPrice.toLocaleString("es-MX")} MXN
            </p>

            <p className="mt-1 text-xs font-semibold text-violet-700">
              {requestedDays > 0
                ? `${requestedDays} × $50`
                : "$50 por día"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-600">
          El precio definitivo se calcula nuevamente en el
          servidor. No se realizará ningún cobro hasta que el
          anuncio haya sido revisado y aprobado.
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Cuándo quieres que empiece
        </h2>

        <div className="mt-5 grid gap-3">
          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="asap"
              checked={startMode === "asap"}
              onChange={() => setStartMode("asap")}
            />

            <span>
              <span className="block font-bold text-gray-950">
                Lo antes posible
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Empezará después de ser aprobado y de que el
                pago sea verificado.
              </span>
            </span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="scheduled"
              checked={startMode === "scheduled"}
              onChange={() => setStartMode("scheduled")}
            />

            <span>
              <span className="block font-bold text-gray-950">
                Elegir fecha y hora
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Sabinapp intentará iniciar el anuncio en el
                momento solicitado.
              </span>
            </span>
          </label>
        </div>

        {startMode === "scheduled" ? (
          <label className="mt-5 block">
            <span className="text-sm font-bold text-gray-700">
              Fecha y hora solicitadas
            </span>

            <input
              name="requestedStartAt"
              type="datetime-local"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:max-w-md"
            />
          </label>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Destino del anuncio
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          El anuncio sólo puede llevar a la página o a los
          contactos públicos del negocio seleccionado.
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-gray-700">
            Al tocar el anuncio
          </span>

          <select
            name="targetChoice"
            required
            value={targetChoice}
            onChange={(event) =>
              setTargetChoice(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
          >
            <option value="business_page">
              Página de {selectedBusiness?.name ?? "mi negocio"}
            </option>

            {(selectedBusiness?.contacts ?? []).map(
              (contact) => (
                <option
                  key={contact.id}
                  value={`contact:${contact.id}`}
                >
                  {getContactTypeLabel(contact.type)} ·{" "}
                  {contact.label} · {contact.value}
                </option>
              ),
            )}
          </select>
        </label>

        {(selectedBusiness?.contacts ?? []).length === 0 ? (
          <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-900">
            Este negocio no tiene contactos públicos compatibles.
            Puedes utilizar su página como destino.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-blue-950">
          Primero revisaremos el anuncio
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Al enviarlo no se publicará ni tendrás que pagar
          todavía. Un administrador revisará el contenido y
          podrá aprobarlo, rechazarlo o solicitar correcciones.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
