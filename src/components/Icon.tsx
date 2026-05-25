import {
  AlertTriangle,
  ArrowUpDown,
  Banknote,
  Beer,
  Car,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Coffee,
  Film,
  Hand,
  Home,
  Info,
  Lightbulb,
  Link2,
  PartyPopper,
  Pizza,
  Plane,
  Plus,
  Receipt,
  Search,
  Share2,
  ShoppingCart,
  TrendingUp,
  Undo2,
  User,
  Users,
  Wallet,
  X,
  type LucideProps,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export type IconName =
  | 'home'
  | 'users'
  | 'user'
  | 'search'
  | 'wave'
  | 'wallet'
  | 'check'
  | 'clipboard'
  | 'receipt'
  | 'chevron-right'
  | 'plus'
  | 'close'
  | 'alert'
  | 'info'
  | 'arrow-up-down'
  | 'trending-up'
  | 'banknote'
  | 'party-popper'
  | 'share'
  | 'link'
  | 'undo';

const ICONS: Record<IconName, React.ComponentType<LucideProps>> = {
  home: Home,
  users: Users,
  user: User,
  search: Search,
  wave: Hand,
  wallet: Wallet,
  check: CheckCircle2,
  clipboard: ClipboardList,
  receipt: Receipt,
  'chevron-right': ChevronRight,
  plus: Plus,
  close: X,
  alert: AlertTriangle,
  info: Info,
  'arrow-up-down': ArrowUpDown,
  'trending-up': TrendingUp,
  banknote: Banknote,
  'party-popper': PartyPopper,
  share: Share2,
  link: Link2,
  undo: Undo2,
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, color = Colors.textPrimary, strokeWidth = 2, ...rest }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Ăn uống', icon: Pizza },
  { id: 'shopping', label: 'Mua sắm', icon: ShoppingCart },
  { id: 'transport', label: 'Đi lại', icon: Car },
  { id: 'entertainment', label: 'Giải trí', icon: Film },
  { id: 'coffee', label: 'Cafe', icon: Coffee },
  { id: 'drinks', label: 'Đồ uống', icon: Beer },
  { id: 'home', label: 'Nhà cửa', icon: Home },
  { id: 'utilities', label: 'Tiện ích', icon: Lightbulb },
  { id: 'party', label: 'Tiệc tùng', icon: PartyPopper },
  { id: 'travel', label: 'Du lịch', icon: Plane },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id'];

interface CategoryIconProps extends Omit<LucideProps, 'ref'> {
  category: ExpenseCategoryId | string;
}

export function CategoryIcon({
  category,
  size = 20,
  color = Colors.textPrimary,
  strokeWidth = 2,
  ...rest
}: CategoryIconProps) {
  const match = EXPENSE_CATEGORIES.find((c) => c.id === category);
  const Component = match?.icon ?? Receipt;
  return <Component size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}
