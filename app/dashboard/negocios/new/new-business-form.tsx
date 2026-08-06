"use client";

import { useMemo, useState } from "react";

import { createBusinessFromDashboard } from "./actions";

type BusinessTypeOption = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  requires_start_end_dates: boolean;
  is_adult_related: boolean;
};

type CategoryOption = {
  id: string;
  business_type_id: string;
  name: string;
  slug: string;
};

type NewBusinessFormProps = {
  businessTypes: BusinessTypeOption[];
  categories: CategoryOption[];
};

export function NewBusinessForm({
  businessTypes,
  categories,
}: NewBusinessFormProps) {
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState("");

  const selectedBusinessType = useMemo(
    () =>
      businessTypes.find(
        (businessType) => businessType.id === selectedBusinessTypeId,
      ) ?? null,
    [businessTypes, selectedBusinessTypeId],
  );

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.business_type_id === selectedBusinessTypeId,
      ),
    [categories, selectedBusinessTypeId],
  );

  const showTemporaryDates =
    selectedBusinessType?.requires_start_end_dates === true;

  return (
    <form
      action={createBusinessFromDashboard}
      className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="name" className="text-sm font-bold text-gray-800">
            Nombre del negocio
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder="Ejemplo: Tacos Don Pepe"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label htmlFor="slug" className="text-sm font-bold text-gray-800">
            Slug público opcional
          </label>

          <input
            id="slug"
            name="slug"
            type="text"
            placeholder="ejemplo: tacos-don-pepe"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Si lo dejas vacío, se generará desde el nombre. Solo usa letras
            minúsculas, números y guiones.
          </p>
        </div>

        <div>
          <label
            htmlFor="businessTypeId"
            className="text-sm font-bold text-gray-800"
          >
            Tipo de negocio
          </label>

          <select
            id="businessTypeId"
            name="businessTypeId"
            required
            value={selectedBusinessTypeId}
            onChange={(event) => setSelectedBusinessTypeId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Selecciona un tipo</option>

            {businessTypes.map((businessType) => (
              <option key={businessType.id} value={businessType.id}>
                {businessType.name}
                {businessType.requires_start_end_dates ? " — temporal" : ""}
              </option>
            ))}
          </select>

          {selectedBusinessType?.description ? (
            <p className="mt-2 text-xs text-gray-500">
              {selectedBusinessType.description}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="categoryId" className="text-sm font-bold text-gray-800">
            Categoría
          </label>

          <select
            id="categoryId"
            name="categoryId"
            required
            disabled={!selectedBusinessTypeId}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">
              {selectedBusinessTypeId
                ? "Selecciona una categoría"
                : "Primero selecciona un tipo de negocio"}
            </option>

            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {selectedBusinessTypeId && availableCategories.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              Este tipo de negocio no tiene categorías activas configuradas.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              La categoría ayuda a que el negocio aparezca mejor en búsquedas y
              listados.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="shortDescription"
            className="text-sm font-bold text-gray-800"
          >
            Descripción corta
          </label>

          <textarea
            id="shortDescription"
            name="shortDescription"
            required
            minLength={10}
            maxLength={240}
            rows={3}
            placeholder="Describe brevemente qué ofrece el negocio."
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label
            htmlFor="longDescription"
            className="text-sm font-bold text-gray-800"
          >
            Descripción larga opcional
          </label>

          <textarea
            id="longDescription"
            name="longDescription"
            rows={5}
            placeholder="Agrega más detalles del negocio, historia, servicios o ventajas."
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {showTemporaryDates ? (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <h2 className="font-black text-gray-950">
              Fechas para negocio temporal
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Este tipo requiere fecha de inicio y fecha de finalización.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startsAt"
                  className="text-sm font-bold text-gray-800"
                >
                  Inicia
                </label>

                <input
                  id="startsAt"
                  name="startsAt"
                  type="date"
                  required={showTemporaryDates}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="endsAt"
                  className="text-sm font-bold text-gray-800"
                >
                  Termina
                </label>

                <input
                  id="endsAt"
                  name="endsAt"
                  type="date"
                  required={showTemporaryDates}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-950">
          El negocio se guardará como borrador. Un administrador deberá revisar
          y confirmar la información antes de aprobarlo o publicarlo.
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          El negocio no aparecerá públicamente hasta pasar por revisión.
        </p>

        <button
          type="submit"
          className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
        >
          Crear negocio
        </button>
      </div>
    </form>
  );
}
