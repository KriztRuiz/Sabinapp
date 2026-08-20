"use client";

import { useMemo, useState } from "react";

import { updateBusinessClassification } from "./actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import type {
  BusinessEditBusiness,
  BusinessTypeOption,
  CategoryOption,
} from "./business-edit-types";
import { FieldGuide } from "../../_components/field-guide";

type BusinessClassificationFormProps = {
  business: BusinessEditBusiness;
  businessTypes: BusinessTypeOption[];
  categories: CategoryOption[];
};

function getDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function BusinessClassificationForm({
  business,
  businessTypes,
  categories,
}: BusinessClassificationFormProps) {
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState(
    business.business_type_id,
  );

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

  const currentCategoryBelongsToSelectedType = availableCategories.some(
    (category) => category.id === business.category_id,
  );

  const showTemporaryDates =
    selectedBusinessType?.requires_start_end_dates === true;

  const canEditClassification = ["draft", "rejected", "hidden"].includes(
    business.status,
  );

  const updateBusinessClassificationWithId = updateBusinessClassification.bind(
    null,
    business.id,
  );

  return (
    <form
      action={updateBusinessClassificationWithId}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-gray-950">
        Clasificación del negocio
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Define el tipo y la categoría. Esto ayuda a ordenar el directorio y
        mejorar las búsquedas.
      </p>

      <FieldGuide
        title="Guía para clasificar el negocio"
        description="El tipo define la familia general del negocio y la categoría lo vuelve más específico. Esto ayuda a que las personas lo encuentren mejor en el directorio."
        goodExample="Tipo: Restaurantes y comida. Categoría: Taquería."
        avoid="Evita elegir una categoría solo porque suena mejor. Usa la que más se acerque a lo que realmente ofrece el negocio."
      />

      {!canEditClassification ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-black">Clasificación bloqueada temporalmente</p>

          <p className="mt-1 leading-6">
            La clasificación y vigencia sólo pueden cambiarse cuando el negocio
            está en borrador, rechazado o retirado del público.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5">
        <div>
          <label
            htmlFor="business_type_id"
            className="block text-sm font-semibold text-gray-800"
          >
            Tipo de negocio
          </label>

          <select
            id="business_type_id"
            name="business_type_id"
            value={selectedBusinessTypeId}
            onChange={(event) => setSelectedBusinessTypeId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
          <label
            htmlFor="category_id"
            className="block text-sm font-semibold text-gray-800"
          >
            Categoría
          </label>

          <select
            id="category_id"
            name="category_id"
            defaultValue={
              currentCategoryBelongsToSelectedType
                ? (business.category_id ?? "")
                : ""
            }
            key={selectedBusinessTypeId}
            disabled={!selectedBusinessTypeId}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">
              {selectedBusinessTypeId
                ? "Selecciona una categoría"
                : "Primero selecciona un tipo"}
            </option>

            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {selectedBusinessTypeId && availableCategories.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              Este tipo no tiene categorías activas configuradas.
            </p>
          ) : null}
        </div>

        {showTemporaryDates ? (
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <h3 className="font-black text-purple-950">
              Fechas de negocio temporal
            </h3>

            <p className="mt-1 text-sm text-purple-900">
              Este tipo requiere fecha de inicio y fecha final.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="starts_at"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Inicia
                </label>

                <input
                  id="starts_at"
                  name="starts_at"
                  type="date"
                  required={showTemporaryDates}
                  defaultValue={getDateInputValue(business.starts_at)}
                  disabled={!canEditClassification}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ends_at"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Termina
                </label>

                <input
                  id="ends_at"
                  name="ends_at"
                  type="date"
                  required={showTemporaryDates}
                  defaultValue={getDateInputValue(business.ends_at)}
                  disabled={!canEditClassification}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {canEditClassification ? (
        <div className="mt-6">
          <ConfirmSubmitButton
            message="¿Guardar la clasificación de este negocio?"
            className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Guardar clasificación
          </ConfirmSubmitButton>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500">
          Esta sección no se puede cambiar desde el estado actual del negocio.
        </div>
      )}
    </form>
  );
}
