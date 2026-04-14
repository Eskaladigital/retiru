'use client';

import { EmailLink } from '@/components/ui/email-link';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compare_price: number | null;
  stock: number;
  sold: number;
  status: string;
  featured: boolean;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  products: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer: string;
  customer_email: string | null;
  items: number;
  total: number;
  status: string;
  date: string;
}

interface Stats {
  activeProducts: number;
  totalSold: number;
  totalRevenue: number;
  categoriesCount: number;
}

const S: Record<string, { l: string; c: string }> = {
  active: { l: 'Activo', c: 'bg-sage-100 text-sage-700' },
  draft: { l: 'Borrador', c: 'bg-sand-200 text-[#7a6b5d]' },
  out_of_stock: { l: 'Agotado', c: 'bg-red-100 text-red-600' },
  paid: { l: 'Pagado', c: 'bg-sage-100 text-sage-700' },
  shipped: { l: 'Enviado', c: 'bg-blue-100 text-blue-700' },
  delivered: { l: 'Entregado', c: 'bg-sage-100 text-sage-700' },
  pending: { l: 'Pendiente', c: 'bg-amber-100 text-amber-700' },
  cancelled: { l: 'Cancelado', c: 'bg-red-100 text-red-600' },
  refunded: { l: 'Reembolsado', c: 'bg-sand-200 text-[#7a6b5d]' },
};

export function TiendaClient({
  products,
  categories,
  recentOrders,
  stats,
}: {
  products: ProductRow[];
  categories: CategoryRow[];
  recentOrders: OrderRow[];
  stats: Stats;
}) {
  const { activeProducts, totalSold, totalRevenue, categoriesCount } = stats;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Tienda</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">Gestión de productos, categorías y pedidos</p>
        </div>
        <button type="button" className="bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors" title="Próximamente">
          ➕ Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Productos activos</p>
          <p className="text-2xl font-bold mt-1">{activeProducts}</p>
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
          <p className="text-2xl font-bold mt-1">{categoriesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Categorías</h2>
            <span className="text-xs font-semibold text-[#a09383]">+ Nueva (próximamente)</span>
          </div>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-[#a09383]">No hay categorías.</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                  <span className="text-sm">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#a09383]">{c.products} prod.</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white border border-sand-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Últimos pedidos</h2>
            <span className="text-xs text-[#a09383]">Ver todos (próximamente)</span>
          </div>

          {/* Orders mobile cards */}
          <div className="md:hidden space-y-3">
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-[#999] text-sm">No hay pedidos.</p>
            ) : (
              recentOrders.map((o) => {
                const s = S[o.status] || S.pending;
                const dateStr = o.date ? new Date(o.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—';
                return (
                  <div key={o.id} className="border border-sand-100 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-terracotta-600 text-sm">{o.order_number}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#7a6b5d]">
                      <span>{o.customer}</span>
                      <span className="font-semibold text-foreground">{o.total.toFixed(2)}€</span>
                    </div>
                    <div className="text-[11px] text-[#a09383]">{o.items} art. · {dateStr}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Orders desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="text-left py-2 font-semibold text-[#7a6b5d]">Pedido</th>
                <th className="text-left py-2 font-semibold text-[#7a6b5d]">Cliente</th>
                <th className="text-center py-2 font-semibold text-[#7a6b5d]">Artículos</th>
                <th className="text-right py-2 font-semibold text-[#7a6b5d]">Total</th>
                <th className="text-center py-2 font-semibold text-[#7a6b5d]">Estado</th>
                <th className="text-right py-2 font-semibold text-[#7a6b5d]">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#999]">No hay pedidos.</td></tr>
              ) : (
                recentOrders.map((o) => {
                  const s = S[o.status] || S.pending;
                  const dateStr = o.date ? new Date(o.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <tr key={o.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                      <td className="py-2.5 font-medium text-terracotta-600">{o.order_number}</td>
                      <td className="py-2.5">{o.customer_email ? <EmailLink email={o.customer_email} className="text-foreground hover:text-terracotta-600 hover:underline">{o.customer}</EmailLink> : o.customer}</td>
                      <td className="py-2.5 text-center">{o.items}</td>
                      <td className="py-2.5 text-right font-semibold">{o.total.toFixed(2)}€</td>
                      <td className="py-2.5 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span></td>
                      <td className="py-2.5 text-right text-[#7a6b5d]">{dateStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-200 flex items-center justify-between">
          <h2 className="font-serif text-lg">Productos ({products.length})</h2>
        </div>

        {/* Products mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {products.length === 0 ? (
            <p className="py-12 text-center text-[#999] text-sm">No hay productos.</p>
          ) : (
            products.map((p) => {
              const s = S[p.status] || S.active;
              return (
                <div key={p.id} className="border border-sand-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.compare_price && p.compare_price > p.price && (
                        <span className="ml-1 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">-{Math.round((1 - p.price / p.compare_price) * 100)}%</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.c}`}>{s.l}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-[#a09383]">Precio:</span> <span className="font-semibold">{p.price.toFixed(2)}€</span></div>
                    <div><span className="text-[#a09383]">Stock:</span> <span className={p.stock === 0 ? 'text-red-500 font-semibold' : p.stock < 10 ? 'text-amber-600' : ''}>{p.stock}</span></div>
                    <div><span className="text-[#a09383]">Vendidos:</span> {p.sold}</div>
                    {p.featured && <div>⭐ Destacado</div>}
                  </div>
                  <a href={`/es/tienda/${p.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline">Ver ficha</a>
                </div>
              );
            })
          )}
        </div>

        {/* Products desktop table */}
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50">
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Producto</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Categoría</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Precio</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Stock</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Vendidos</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Destacado</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-[#999]">No hay productos.</td></tr>
            ) : (
              products.map((p) => {
                const s = S[p.status] || S.active;
                return (
                  <tr key={p.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{p.name}</span>
                      {p.compare_price && p.compare_price > p.price && <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">-{Math.round((1 - p.price / p.compare_price) * 100)}%</span>}
                    </td>
                    <td className="py-3 px-4 text-[#7a6b5d]">{p.category}</td>
                    <td className="py-3 px-4 text-right font-semibold">{p.price.toFixed(2)}€</td>
                    <td className={`py-3 px-4 text-center ${p.stock === 0 ? 'text-red-500 font-semibold' : p.stock < 10 ? 'text-amber-600' : ''}`}>{p.stock}</td>
                    <td className="py-3 px-4 text-center">{p.sold}</td>
                    <td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span></td>
                    <td className="py-3 px-4 text-center">{p.featured ? '⭐' : '—'}</td>
                    <td className="py-3 px-4 text-right"><a href={`/es/tienda/${p.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline">Ver ficha</a></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
