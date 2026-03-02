// /es/facturas
export default function FacturasPage() {
  const INVOICES = [
    { id: 'INV-2026-001', date: '12 Mar 2026', concept: 'Cuota gestión — Retiro Yoga Ibiza', amount: 158, status: 'paid' },
    { id: 'INV-2026-002', date: '15 Mar 2026', concept: 'Cuota gestión — Escapada Detox Grazalema', amount: 90, status: 'paid' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Facturas</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Historial de pagos realizados a Retiru</p>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-5 font-semibold text-[#7a6b5d]">Factura</th>
            <th className="text-left py-3 px-5 font-semibold text-[#7a6b5d]">Fecha</th>
            <th className="text-left py-3 px-5 font-semibold text-[#7a6b5d] hidden md:table-cell">Concepto</th>
            <th className="text-right py-3 px-5 font-semibold text-[#7a6b5d]">Importe</th>
            <th className="text-right py-3 px-5 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                <td className="py-3 px-5 font-medium">{inv.id}</td>
                <td className="py-3 px-5 text-[#7a6b5d]">{inv.date}</td>
                <td className="py-3 px-5 text-[#7a6b5d] hidden md:table-cell">{inv.concept}</td>
                <td className="py-3 px-5 text-right font-semibold">{inv.amount}€</td>
                <td className="py-3 px-5 text-right"><button className="text-terracotta-600 font-medium hover:underline">PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
