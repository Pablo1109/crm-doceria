import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Utensils, Package, Menu } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
    { name: "Receitas", href: "/receitas", icon: Utensils },
    { name: "Ingredientes", href: "/ingredientes", icon: Package },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-pink-600">Doceria CRM</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 md:hidden flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-600">Doceria CRM</h1>
          <button className="p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          {/* Main content will be rendered here */}
        </main>
      </div>
    </div>
  );
}
