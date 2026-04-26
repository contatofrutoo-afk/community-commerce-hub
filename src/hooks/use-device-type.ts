import * as React from "react";

const TABLET_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1280;

export function useDeviceType() {
  const [device, setDevice] = React.useState<"mobile" | "tablet" | "desktop">("mobile");

  React.useEffect(() => {
    const onChange = () => {
      if (window.innerWidth < 768) setDevice("mobile");
      else if (window.innerWidth < TABLET_BREAKPOINT) setDevice("tablet");
      else setDevice("desktop");
    };
    const mql = window.matchMedia(`(min-width: 768px)`);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return device;
}