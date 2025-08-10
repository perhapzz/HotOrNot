import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

// 页面容器
const containerVariants = cva("mx-auto px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      sm: "max-w-3xl",
      default: "max-w-7xl",
      lg: "max-w-screen-xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(containerVariants({ size, className }))}
      {...props}
    />
  ),
);
Container.displayName = "Container";

// 页面布局
interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  footer,
  sidebar,
  className,
}) => {
  return (
    <div className={clsx("min-h-screen flex flex-col", className)}>
      {header && <header className="flex-shrink-0">{header}</header>}

      <main className="flex-1 flex">
        {sidebar && (
          <aside className="flex-shrink-0 w-64 bg-gray-50 border-r">
            {sidebar}
          </aside>
        )}
        <div className="flex-1">{children}</div>
      </main>

      {footer && <footer className="flex-shrink-0">{footer}</footer>}
    </div>
  );
};

// 导航栏
interface NavbarProps {
  brand?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ brand, children, className }) => {
  return (
    <nav className={clsx("bg-white shadow-sm border-b", className)}>
      <Container>
        <div className="flex justify-between items-center h-16">
          {brand && <div className="flex items-center">{brand}</div>}
          {children && (
            <div className="hidden md:flex space-x-8">{children}</div>
          )}
        </div>
      </Container>
    </nav>
  );
};

// 导航链接
interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, active, children, ...props }, ref) => (
    <a
      ref={ref}
      className={clsx(
        "text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active && "text-blue-700 font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
);
NavLink.displayName = "NavLink";

// 侧边栏
interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return <div className={clsx("h-full py-6", className)}>{children}</div>;
};

// 侧边栏导航
interface SidebarNavProps {
  items: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
    active?: boolean;
  }>;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ items }) => {
  return (
    <nav className="space-y-1">
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className={clsx(
            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
            item.active
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          {item.icon && (
            <span className="mr-3 flex-shrink-0 h-5 w-5">{item.icon}</span>
          )}
          {item.label}
        </a>
      ))}
    </nav>
  );
};

// 页面头部
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  breadcrumb,
  className,
}) => {
  return (
    <div className={clsx("py-8", className)}>
      <Container>
        {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-2 text-lg text-gray-600">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex items-center space-x-4">{action}</div>
          )}
        </div>
      </Container>
    </div>
  );
};

// 面包屑导航
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  separator?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = "/" }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="text-gray-400 mx-2">{separator}</span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-sm text-gray-900 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// 网格布局
const gridVariants = cva("grid gap-6", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    },
    gap: {
      sm: "gap-3",
      default: "gap-6",
      lg: "gap-8",
    },
  },
  defaultVariants: {
    cols: 3,
    gap: "default",
  },
});

interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(gridVariants({ cols, gap, className }))}
      {...props}
    />
  ),
);
Grid.displayName = "Grid";

// 分隔线
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "bg-gray-200",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      )}
      {...props}
    />
  ),
);
Divider.displayName = "Divider";

// 空状态
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={clsx("text-center py-12", className)}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
};

export {
  Container,
  PageLayout,
  Navbar,
  NavLink,
  Sidebar,
  SidebarNav,
  PageHeader,
  Breadcrumb,
  Grid,
  Divider,
  EmptyState,
};
