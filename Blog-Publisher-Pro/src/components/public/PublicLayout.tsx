import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Gurujan Logo" />
            </div>
            <span className="font-serif font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              Gurujan
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={link.href}
                        className={`px-3 py-2 text-sm rounded-md transition-colors font-medium ${
                          location === link.href
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            {isAuthenticated ? (
              <Link href="/portal">
                <Button size="sm" variant="outline" className="ml-2 font-semibold">
                  {user?.firstName || user?.email || "Portal"}
                </Button>
              </Link>
            ) : (
              <Link href="/portal">
                <Button size="sm" variant="ghost" className="ml-2 text-muted-foreground">
                  Login
                </Button>
              </Link>
            )}
          </nav>

          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-3 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 text-sm rounded-md mb-1 ${
                  location === link.href
                    ? "text-primary bg-primary/10 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link href="/portal" onClick={() => setOpen(false)}>
                <Button size="sm" variant="outline" className="mt-2 w-full font-semibold">
                  {user?.firstName || user?.email || "Portal"}
                </Button>
              </Link>
            ) : (
              <Link href="/portal" onClick={() => setOpen(false)}>
                <Button size="sm" variant="ghost" className="mt-2 w-full">Login</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 flex items-center justify-center">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Gurujan Logo" />
              </div>
              <span className="font-serif font-semibold text-foreground">Gurujan</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A collaborative space for writers, educators, and creators to share and discover articles on education, society, spirituality, and mental health.
            </p>
          </div>
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Explore</h4>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Connect</h4>
            <p className="text-sm text-muted-foreground mb-2">Have a thought to share?</p>
            <Link href="/contact">
              <Button size="sm" variant="outline">Contact Us</Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          All rights reserved. Words are the soul's footprints.
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
