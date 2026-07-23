import { updateBusinessContactDetails } from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";
import { ConfirmSubmitButton } from "./confirm-submit-button";

type BusinessContactsSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessContactsSection({
  business,
}: BusinessContactsSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Contactos públicos</h2>

      <p className="mt-2 text-sm text-gray-600">
        Estos contactos aparecen en la landing pública y en el botón flotante de
        contacto.
      </p>

      {business.contacts.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {business.contacts.map((contact) => {
            const updateContactWithIds = updateBusinessContactDetails.bind(
              null,
              business.id,
              contact.id,
            );

            return (
              <article
                key={contact.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    Tipo: {contact.type}
                  </span>

                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    Orden: {contact.sort_order}
                  </span>

                  {contact.is_primary ? (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                      Principal
                    </span>
                  ) : null}

                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    {contact.is_active ? "Activo" : "Inactivo"}
                  </span>

                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    {contact.is_approved ? "Aprobado" : "Pendiente"}
                  </span>
                </div>

                <form action={updateContactWithIds} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`contact-type-${contact.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Tipo
                      </label>

                      <input
                        id={`contact-type-${contact.id}`}
                        name="type"
                        type="text"
                        defaultValue={contact.type}
                        placeholder="whatsapp, phone, email, instagram..."
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`contact-label-${contact.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Etiqueta
                      </label>

                      <input
                        id={`contact-label-${contact.id}`}
                        name="label"
                        type="text"
                        defaultValue={contact.label}
                        placeholder="Ej. WhatsApp principal"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`contact-value-${contact.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Texto visible en la landing
                    </label>

                    <input
                      id={`contact-value-${contact.id}`}
                      name="value"
                      type="text"
                      defaultValue={contact.value}
                      placeholder="Ej. 824 000 0000"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`contact-url-${contact.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Enlace real al hacer click
                    </label>

                    <input
                      id={`contact-url-${contact.id}`}
                      name="url"
                      type="text"
                      defaultValue={contact.url ?? ""}
                      placeholder="https://wa.me/52824... o mailto:..."
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      Este enlace puede ser diferente al texto visible. Para WhatsApp,
                      mantén ambos números iguales si quieres evitar confusión.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor={`contact-sort-order-${contact.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Orden de aparición
                    </label>

                    <input
                      id={`contact-sort-order-${contact.id}`}
                      name="sort_order"
                      type="text"
                      inputMode="numeric"
                      defaultValue={contact.sort_order}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_primary"
                        defaultChecked={contact.is_primary}
                      />
                      Contacto principal
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={contact.is_active}
                      />
                      Contacto activo
                    </label>
                  </div>

                  <ConfirmSubmitButton
                    message="¿Guardar los cambios de este contacto?"
                    className="w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Guardar contacto
                  </ConfirmSubmitButton>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene contactos registrados.
        </div>
      )}
    </section>
  );
}
