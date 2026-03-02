// /administrator/tienda — Gestión de la tienda (admin)
const PRODUCTS = [
  { name: 'Esterilla de Yoga Pro 6mm', category: 'Yoga', price: 49.90, comparePrice: 69.90, stock: 23, sold: 87, status: 'active', featured: true },
  { name: 'Extractor de Zumos Cold Press', category: 'Nutrición', price: 129.00, comparePrice: null, stock: 12, sold: 34, status: 'active', featured: true },
  { name: 'Cojín de Meditación Zafu', category: 'Meditación', price: 34.90, comparePrice: null, stock: 45, sold: 112, status: 'active', featured: false },
  { name: 'Chándal Algodón Orgánico', category: 'Ropa', price: 79.90, comparePrice: 99.90, stock: 8, sold: 29, status: 'active', featured: true },
  { name: 'Difusor de Aceites Esenciales', category: 'Bienestar', price: 29.90, comparePrice: null, stock: 56, sold: 78, status: 'active', featured: false },
  { name: 'Bloques de Yoga en Corcho (x2)', category: 'Yoga', price: 24.90, comparePrice: 32.00, stock: 34, sold: 45, status: 'active', featured: false },
  { name: 'Botella Térmica Bambú 500ml', category: 'Bienestar', price: 19.90, comparePrice: null, stock: 0, sold: 67, status: 'out_of_stock', featured: false },
  { name: 'Set de 6 Aceites Esenciales', category: 'Bienestar', price: 39.90, comparePrice: 49.90, stock: 18, sold: 156, status: 'active', featured: true },
];

const CATEGORIES = [
  { name: 'Yoga', products: 3, icon: '🧘' },
  { name: 'Meditación', products: 1, icon: '🧠' },
  { name: 'Nutrición', products: 1, icon: '🥤' },
  { name: 'Ropa', products: 1, icon: '👕' },
  { name: 'Bienestar', products: 3, icon: '🌿' },
];

const RECENT_ORDERS = [
  { id: 'ORD-001', customer: 'Ana García', items: 2, total: 84.80, status: 'paid', date: 'Hoy 10:34' },
  { id: 'ORD-002', customer: 'Pedro López', items: 1, total: 129.00, status: 'shipped', date: 'Ayer 16:20' },
  { id: 'ORD-003', customer: 'María Ruiz', items: 3, total: 109.70, status: 'delivered', date: '28 Feb' },
];

const S: Record<string, { l: string; c: string }> = {
  active: { l: 'Activo', c: 'bg-sage-100 text-sage-700' },
  draft: { l: 'Borrador', c: 'bg-sand-200 text-[#7a6b5d]' },
  out_of_stock: { l: 'Agotado', c: 'bg-red-100 text-red-600' },
  paid: { l: 'Pagado', c: 'bg-sage-100 text-sage-700' },
  shipped: { l: 'Enviado', c: 'bg-blue-100 text-blue-700' },
  delivered: { l: 'Entregado', c: 'bg-sage-100 text-sage-700' },
};

export default function AdminTiendaPage() {
  const totalRevenue = PRODUCTS.reduce((s, p) => s + p.price * p.sold, 0);
  const totalSold = PRODUCTS.reduce((s, p) => s + p.sold, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Tienda</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">Gestión de productos, categorías y pedidos</p>
        </div>
        <button className="bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors">➕ Nuevo producto</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Productos activos</p>
          <p className="text-2xl font-bold mt-1">{PRODUCTS.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Unidades vendidas</p>
          <p className="text-2xl font-bold mt-1">{totalSold}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Ingresos totales</p>
          <p className="text-2xl font-bold mt-1">{totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Categorías</p>
          <p className="text-2xl font-bold mt-1">{CATEGORIES.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Categorías</h2>
            <button className="text-xs font-semibold text-terracotta-600 hover:underline">+ Nueva</button>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <span className="text-sm"><span className="mr-2">{c.icon}</span>{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#a09383]">{c.products} prod.</span>
                  <button className="text-xs text-terracotta-600 hover:underline">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Últimos pedidos</h2>
            <button className="text-xs font-semibold text-terracotta-600 hover:underline">Ver todos</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-sand-200">
              <th className="text-left py-2 font-semibold text-[#7a6b5d]">Pedido</th>
              <th className="text-left py-2 font-semibold text-[#7a6b5d]">Cliente</th>
              <th className="text-center py-2 font-semibold text-[#7a6b5d]">Artículos</th>
              <th className="text-right py-2 font-semibold text-[#7a6b5d]">Total</th>
              <th className="text-center py-2 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-right py-2 font-semibold text-[#7a6b5d]">Fecha</th>
            </tr></thead>
            <tbody>{RECENT_ORDERS.map((o) => {
              const s = S[o.status] || S.paid;
              return (
                <tr key={o.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-2.5 font-medium text-terracotta-600">{o.id}</td>
                  <td className="py-2.5">{o.customer}</td>
                  <td className="py-2.5 text-center">{o.items}</td>
                  <td className="py-2.5 text-right font-semibold">{o.total.toFixed(2)}€</td>
                  <td className="py-2.5 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span></td>
                  <td className="py-2.5 text-right text-[#7a6b5d]">{o.date}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-200 flex items-center justify-between">
          <h2 className="font-serif text-lg">Productos ({PRODUCTS.length})</h2>
          <input type="text" placeholder="Buscar producto..." className="px-3 py-1.5 rounded-lg border border-sand-300 text-sm outline-none focus:border-terracotta-500 w-56" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Producto</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Categoría</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Precio</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Stock</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Vendidos</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Destacado</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr></thead>
          <tbody>{PRODUCTS.map((p, i) => {
            const s = S[p.status] || S.active;
            return (
              <tr key={i} className="border-b border-sand-100 hover:bg-sand-50/50">
                <td className="py-3 px-4">
                  <span className="font-medium">{p.name}</span>
                  {p.comparePrice && <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">-{Math.round((1 - p.price / p.comparePrice) * 100)}%</span>}
                </td>
                <td className="py-3 px-4 text-[#7a6b5d]">{p.category}</td>
                <td className="py-3 px-4 text-right font-semibold">{p.price.toFixed(2)}€</td>
                <td className={`py-3 px-4 text-center ${p.stock === 0 ? 'text-red-500 font-semibold' : p.stock < 10 ? 'text-amber-600' : ''}`}>{p.stock}</td>
                <td className="py-3 px-4 text-center">{p.sold}</td>
                <td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span></td>
                <td className="py-3 px-4 text-center">{p.featured ? '⭐' : '—'}</td>
                <td className="py-3 px-4 text-right"><button className="text-xs font-semibold text-terracotta-600 hover:underline">Editar</button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
