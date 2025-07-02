import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

/**
 * Represents the DOM elements for navigation bar sections
 */
interface NavigationBarSections {
  left: HTMLDivElement | null;
  right: HTMLDivElement | null;
  center: HTMLDivElement | null;
}

/**
 * Represents the full navigation bar context type
 */
interface NavigationBarContextType {
  sections: NavigationBarSections;
  setSections: React.Dispatch<React.SetStateAction<NavigationBarSections>>;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create context with safe default values
const NavigationContext = createContext<NavigationBarContextType>({
  sections: { left: null, right: null, center: null },
  setSections: () => {},
  visible: true,
  setVisible: () => {},
});

/**
 * Hook for accessing navigation bar context
 * @throws Error if used outside NavigationBarProvider
 */
export const useNavigationBar = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationBar must be used within a NavigationBarProvider",
    );
  }
  return context;
};

interface NavigationBarProviderProps {
  children: React.ReactNode;
  /**
   * Initial visibility state of the navigation bar
   * @default true
   */
  initialVisible?: boolean;
}

/**
 * Provider component that manages navigation bar section references and visibility
 */
export const NavigationBarProvider: React.FC<NavigationBarProviderProps> = ({
  children,
  initialVisible = true,
}) => {
  const [sections, setSections] = useState<NavigationBarSections>({
    left: null,
    right: null,
    center: null,
  });
  const [visible, setVisible] = useState(initialVisible);

  const contextValue = {
    sections,
    setSections,
    visible,
    setVisible,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

interface NavigationBarSectionProps {
  children: React.ReactNode;
}

/**
 * Component to render children in the center section of the navigation bar
 */
export const NavigationBarCenter: React.FC<NavigationBarSectionProps> = ({
  children,
}) => {
  const { sections } = useNavigationBar();
  return sections.center
    ? ReactDOM.createPortal(children, sections.center)
    : null;
};

/**
 * Component to render children in the right section of the navigation bar
 */
export const NavigationBarRight: React.FC<NavigationBarSectionProps> = ({
  children,
}) => {
  const { sections } = useNavigationBar();
  return sections.right
    ? ReactDOM.createPortal(children, sections.right)
    : null;
};

/**
 * Component to render children in the left section of the navigation bar
 */
export const NavigationBarLeft: React.FC<NavigationBarSectionProps> = ({
  children,
}) => {
  const { sections } = useNavigationBar();
  return sections.left ? ReactDOM.createPortal(children, sections.left) : null;
};

/**
 * @deprecated Use NavigationBarRight instead
 */
export const NavigationBarActions: React.FC<NavigationBarSectionProps> = ({
  children,
}) => {
  return <NavigationBarRight>{children}</NavigationBarRight>;
};

/**
 * Standard navigation bar action button component
 */
export function NavigationBarButton({
  className,
  onClick,
  children,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Button> & {
  children?: React.ReactNode;
  /** @deprecated Use children instead */
  icon?: React.ComponentType | React.ReactNode;
}) {
  return (
    <Button
      data-theme="toggle"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      {children || (Icon && (typeof Icon === "function" ? <Icon /> : Icon))}
    </Button>
  );
}

/**
 * Navigation bar action component with a button in the right section
 */
export function NavigationBarAction({
  className,
  onClick,
  children,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Button> & {
  children?: React.ReactNode;
  /** @deprecated Use children instead */
  icon?: React.ComponentType | React.ReactNode;
}) {
  return (
    <NavigationBarRight>
      <Button
        data-theme="toggle"
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", className)}
        onClick={(event) => {
          onClick?.(event);
        }}
        {...props}
      >
        {children || (Icon && (typeof Icon === "function" ? <Icon /> : Icon))}
      </Button>
    </NavigationBarRight>
  );
}

interface NavigationBarContainerProps {
  className?: string;
}

/**
 * Container component for the navigation bar structure
 */
export const NavigationBarContainer: React.FC<NavigationBarContainerProps> = ({
  className,
}) => {
  const { setSections, visible } = useNavigationBar();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSections({
      left: leftRef.current,
      right: rightRef.current,
      center: centerRef.current,
    });
  }, [setSections]);

  if (!visible) {
    return null;
  }

  return (
    <nav
      className={cn(
        "flex p-2 gap-2 items-center border-b px-4 h-10",
        className,
      )}
    >
      <div ref={leftRef} className="flex items-center gap-2" />
      <div className="grow" />
      <div ref={centerRef} className="flex items-center gap-2" />
      <div className="grow" />
      <div
        ref={rightRef}
        className="flex items-center gap-2"
        style={{ flexDirection: "row-reverse" }}
      />
    </nav>
  );
};
