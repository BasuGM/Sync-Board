import { AcceptInvitation } from '@/components/workspaces/accept-invitation';

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : null;
  return <AcceptInvitation token={token} />;
}