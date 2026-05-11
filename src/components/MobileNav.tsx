"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Utensils, Package, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Package
};

export default function MobileNav({ menuItems }: { menuItems: { name: string, href: string, iconName: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <header className="bg-white border-b p-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold text-pink-600">Doceria CRM</h1>
        <button onClick={() => setIsOpen(true)} className="p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full shadow-xl flex flex-col">
            <div className="p-6 flex justify-between items-center border-b">
              <h1 className="text-xl font-bold text-pink-600">Doceria CRM</h1>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <nav className="mt-4 flex-1">
              {menuItems.map((item) => {
                const Icon = iconMap[item.iconName];
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-6 py-4 transition-all border-l-4 ${
                      pathname === item.href 
                        ? "bg-pink-50 text-pink-600 border-pink-600" 
                        : "text-gray-600 border-transparent hover:bg-gray-50"
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mr-3" />}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
