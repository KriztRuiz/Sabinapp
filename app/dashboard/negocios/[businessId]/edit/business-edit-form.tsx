// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { BusinessClassificationForm } from "./business-classification-form";
import { BusinessContentStyleForm } from "./business-content-style-form";
import { BusinessContactsSection } from "./business-contacts-section";
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
    <div className="space-y-8">
      <BusinessContentStyleForm business={business} />
      <BusinessClassificationForm
        business={business}
        businessTypes={businessTypes}
        categories={categories}
      />
      <BusinessMediaSection business={business} />
      <BusinessItemsSection business={business} />

      <BusinessContactsSection business={business} />

      <BusinessHoursSection business={business} />

      <BusinessLocationsSection business={business} />
    </div>
  );
}
