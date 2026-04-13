import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function EditarEventoPage({ params }: Props) {
  const { id } = await params;
  redirect(`/es/panel/eventos/${id}`);
}
