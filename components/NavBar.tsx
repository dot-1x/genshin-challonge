"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavBar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Tournaments" },
    { href: "/simulator", label: "Draft Pick Simulator" },
  ];

  return (
    <nav className="border-b px-4 py-2 bg-background/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === link.href
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
