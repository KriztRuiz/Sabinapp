// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { BusinessContentStyleForm } from "./business-content-style-form";
import { BusinessContactsSection } from "./business-contacts-section";
import { BusinessHoursSection } from "./business-hours-section";
import { BusinessItemsSection } from "./business-items-section";
import { BusinessMediaSection } from "./business-media-section";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessEditFormProps = {
  business: BusinessEditBusiness;
};

export function BusinessEditForm({ business }: BusinessEditFormProps) {
  return (
    <div className="space-y-8">
      <BusinessContentStyleForm business={business} />
      <BusinessMediaSection business={business} />
      <BusinessItemsSection business={business} />

      <BusinessContactsSection business={business} />

      <BusinessHoursSection business={business} />
    </div>
  );
}
