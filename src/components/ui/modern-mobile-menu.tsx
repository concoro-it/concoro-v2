'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, Search, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  href?: string;
  matchPrefixes?: string[];
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  className?: string;
}

const defaultItems: InteractiveMenuItem[] = [
  { label: 'Bacheca', icon: LayoutDashboard, href: '/hub/bacheca' },
  { label: 'Concorsi', icon: Search, href: '/hub/concorsi' },
  { label: 'Matching', icon: Sparkles, href: '/hub/matching' },
  { label: 'Salvati', icon: BookOpen, href: '/hub/salvati' },
  { label: 'Profilo', icon: Settings, href: '/hub/profile' },
];

const defaultAccentColor = 'hsl(var(--primary))';

const getPathActiveIndex = (pathname: string, items: InteractiveMenuItem[]) => {
  const index = items.findIndex((item) => {
    if (!item.href) return false;

    if (pathname === item.href) return true;

    const prefixes = item.matchPrefixes ?? [item.href];
    return prefixes.some((prefix) => pathname.startsWith(prefix));
  });

  return index >= 0 ? index : 0;
};

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor, className }) => {
  const router = useRouter();
  const pathname = usePathname();

  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    if (!isValid) {
      return defaultItems;
    }

    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(() => getPathActiveIndex(pathname, finalItems));

  useEffect(() => {
    setActiveIndex(getPathActiveIndex(pathname, finalItems));
  }, [pathname, finalItems]);

  useEffect(() => {
    if (activeIndex >= finalItems.length) {
      setActiveIndex(0);
    }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    const item = finalItems[index];

    setActiveIndex(index);

    if (item?.href && pathname !== item.href) {
      router.push(item.href);
    }
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]);

  return (
    <nav
      className={cn('modern-mobile-menu menu', className)}
      role="navigation"
      aria-label="Navigazione Hub mobile"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
            type="button"
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="menu__icon" aria-hidden="true">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu__text ${isActive ? 'active' : ''}`}
              ref={(el) => {
                textRefs.current[index] = el;
              }}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};
