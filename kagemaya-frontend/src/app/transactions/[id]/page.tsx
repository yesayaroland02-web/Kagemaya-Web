import { redirect } from 'next/navigation';

export default function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Redirect directly to the dedicated ticket view
  redirect(`/transactions/${params.id}/ticket`);
}
