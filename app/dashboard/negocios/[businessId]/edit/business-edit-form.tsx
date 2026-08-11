// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { BusinessClassificationForm } from "./business-classification-form";
import { BusinessContentStyleForm } from "./business-content-style-form";
import { BusinessContactsSection } from "./business-contacts-section";
import { BusinessEditQuickNav } from "./business-edit-quick-nav";
import { BusinessHoursSection } from "./business-hours-section";
import { BusinessLocationsSection } from "./business-locations-section";
import { BusinessItemsSection } from "./business-items-section";
import { BusinessMediaSection } from "./business-media-section";
import type {
  BusinessEditBusiness,
  BusinessTypeOption,
  CategoryOption,
} from "./business-edit-types";

type BusinessEditFormProps = {
  business: BusinessEditBusiness;
  businessTypes: BusinessTypeOption[];
  categories: CategoryOption[];
};

export function BusinessEditForm({
  business,
  businessTypes,
  categories,
}: BusinessEditFormProps) {
  return (
    <div className="business-edit-panels space-y-8">
      <BusinessEditQuickNav />

      <BusinessContentStyleForm business={business} />

      <div id="clasificacion" className="business-edit-panel scroll-mt-24">
        <BusinessClassificationForm
          business={business}
          businessTypes={businessTypes}
          categories={categories}
        />
      </div>

      <div id="imagenes" className="business-edit-panel scroll-mt-24">
        <BusinessMediaSection business={business} />
      </div>

      <div id="menu" className="business-edit-panel scroll-mt-24">
        <BusinessItemsSection business={business} />
      </div>

      <div id="contactos" className="business-edit-panel scroll-mt-24">
        <BusinessContactsSection business={business} />
      </div>

      <div id="horarios" className="business-edit-panel scroll-mt-24">
        <BusinessHoursSection business={business} />
      </div>

      <div id="ubicaciones" className="business-edit-panel scroll-mt-24">
        <BusinessLocationsSection business={business} />
      </div>
    </div>
  );
}
