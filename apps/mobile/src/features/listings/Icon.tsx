import type { ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// Line icons from the design prototype (camera, image, edit, store and refresh were added in the same style).
const icons = {
  receipt: <><Path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><Path d="M9 8h6M9 12h6" /></>,
  user: <><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></>,
  pin: <><Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><Circle cx="12" cy="10" r="2.5" /></>,
  clock: <><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>,
  back: <Path d="m15 18-6-6 6-6" />,
  leaf: <><Path d="M20 4C11 4 5 9 5 16c4 1 11 0 15-12Z" /><Path d="M4 20c3-5 7-8 12-11" /></>,
  star: <Path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
  check: <Path d="m5 12 4 4L19 6" />,
  minus: <Path d="M5 12h14" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevron: <Path d="m9 18 6-6-6-6" />,
  route: <><Circle cx="6" cy="18" r="2" /><Circle cx="18" cy="6" r="2" /><Path d="M8 18c7 0 1-12 8-12" /></>,
  mail: <><Rect x="3" y="5" width="18" height="14" rx="2" /><Path d="m3 7 9 6 9-6" /></>,
  phone: <Path d="M8 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-3l-5-1-2 3c-4-2-6-4-8-8l3-2Z" />,
  logout: <><Path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
  shield: <><Path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" /><Path d="m9 12 2 2 4-5" /></>,
  utensils: <><Path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" /><Path d="M17 3c-2 2-3 5-3 8h3v10" /></>,
  tag: <><Path d="M3 12V4h8l10 10-8 8Z" /><Circle cx="7.5" cy="8.5" r="1.2" /></>,
  globe: <><Circle cx="12" cy="12" r="9" /><Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  info: <><Circle cx="12" cy="12" r="9" /><Path d="M12 11v5M12 8h.01" /></>,
  trash: <><Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  alert: <><Path d="M12 3 2 20h20Z" /><Path d="M12 10v4M12 17h.01" /></>,
  calendar: <><Rect x="3.5" y="5" width="17" height="15" rx="2" /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  close: <Path d="m6 6 12 12M18 6 6 18" />,
  camera: <><Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><Circle cx="12" cy="13.5" r="3.5" /></>,
  image: <><Rect x="3" y="4" width="18" height="16" rx="2" /><Circle cx="8.5" cy="9.5" r="1.5" /><Path d="m21 16-5-5L5 20" /></>,
  edit: <><Path d="M4 20h4L19 9l-4-4L4 16Z" /><Path d="m13.5 6.5 4 4" /></>,
  store: <><Path d="M4 10v10h16V10" /><Path d="M3 10 5 4h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" /><Path d="M10 20v-5h4v5" /></>,
  refresh: <><Path d="M20 11a8 8 0 0 0-14-4L4 9" /><Path d="M4 4v5h5" /><Path d="M4 13a8 8 0 0 0 14 4l2-2" /><Path d="M20 20v-5h-5" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 20, color = "#2E241B", filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </Svg>
  );
}
