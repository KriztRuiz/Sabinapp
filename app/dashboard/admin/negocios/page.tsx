import { requireModerationAccess } from "./moderation-access";
import { ModerationPage, type PageProps } from "./moderation-page";

export default async function Page({ searchParams }: PageProps) {
  const { canManageReports } = await requireModerationAccess();
  return <ModerationPage reports={Boolean(canManageReports)} {...await searchParams} />;
}
