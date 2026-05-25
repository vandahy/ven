# CLAUDE.md — Ven

## What is this

**Ven** (Vén) is a Vietnamese-language group expense-splitting mobile app. Think Splitwise, but tailored for VND currency with rounding to 1.000d. Built with Expo + React Native, Supabase backend, Zustand state management.

## Tech stack

- **Runtime**: React Native 0.81 via Expo SDK 54 (managed workflow)
- **Routing**: Expo Router v6 (file-based, typed routes enabled)
- **State**: Zustand v5 — one store per domain (`authStore`, `groupStore`, `expenseStore`, `toastStore`)
- **Backend**: Supabase (Postgres + Auth + RLS). Google OAuth via PKCE flow
- **Icons**: lucide-react-native
- **Styling**: `StyleSheet.create` with a centralized theme (`@/constants/theme.ts`)
- **Auth storage**: expo-secure-store on native, sessionStorage on web

## NOT a web app

This is a React Native mobile app. Never use:
- HTML elements (`div`, `span`, `button`, `ul`, `img`, `a`)
- CSS files, CSS modules, or NativeWind/Tailwind
- `window`, `document`, `localStorage` (except in platform-gated web fallbacks like `storage.ts`)
- React Router or Next.js patterns
- `<img>` — use `<Image>` from expo-image
- `<a href>` — use `router.push()` / `router.replace()`

Always use: `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`, `SafeAreaView`, etc.

## Project structure

```
src/
  app/                    # Expo Router file-based routes
    _layout.tsx           # Root layout — auth guard, Stack navigator, Toast overlay
    (auth)/login.tsx      # Google OAuth login screen
    (tabs)/               # Bottom tab navigator
      _layout.tsx         # Tab config (home, groups, profile)
      index.tsx           # Home — group list with search, FAB
      groups.tsx          # Groups — flat list of groups
      profile.tsx         # Profile — user info, sign out
    auth/callback.tsx     # OAuth callback handler (PKCE code exchange)
    setup-profile.tsx     # First-run name setup (stores in user_metadata)
    group/
      new.tsx             # Create group + initial members
      [id].tsx            # Group detail — expenses tab + results/settlement tab
    expense/
      new.tsx             # Add expense to a group
  components/             # Reusable UI components (PascalCase filenames)
  constants/theme.ts      # Colors, Spacing, FontSize, BorderRadius, AvatarColors
  lib/                    # Pure logic & service wrappers
    auth.ts               # Google OAuth flow (signInWithGoogle, signOut)
    calculate.ts          # Balance calculation, transaction minimization, currency formatting
    profile.ts            # User profile read/write via Supabase user_metadata
    storage.ts            # Supabase auth storage adapter (SecureStore native, sessionStorage web)
    supabase.ts           # Supabase client init
    toast.ts              # Toast helper (wraps toastStore)
  store/                  # Zustand stores
  types/index.ts          # Shared TypeScript interfaces
supabase/migrations/      # SQL migration files
```

## Conventions

### Naming
- **Files**: PascalCase for components (`GroupCard.tsx`), camelCase for lib/store/types (`authStore.ts`, `calculate.ts`)
- **Exports**: Named exports everywhere. No default exports for components. Screen files use `export default function`
- **Types**: Interfaces in `src/types/index.ts` for DB entities. Store-local interfaces defined in-file

### Styling
- All styling via `StyleSheet.create` at the bottom of each file — no inline style objects (except conditional styles in Pressable render callbacks)
- Use theme tokens from `@/constants/theme.ts` (`Colors`, `Spacing`, `FontSize`, `BorderRadius`, `AvatarColors`) — never hardcode colors or spacing values that already exist in the theme
- Dark theme only (background `#111319`). No light mode support currently

### State management
- One Zustand store per domain. Stores call Supabase directly
- Pattern: stores expose async actions that `set({ loading: true })`, do the API call, then `set({ loading: false, data })`
- After mutations (create/delete), stores re-fetch the full list rather than optimistically updating
- Auth state flows: `authStore.initialize()` sets up Supabase listener, returns unsubscribe function

### Navigation
- Auth guard lives in root `_layout.tsx` — checks session + profile setup, redirects accordingly
- Screen transitions: `router.push()` for forward nav, `router.replace()` for auth redirects, `router.back()` for dismiss
- Params passed via `useLocalSearchParams<{ key: string }>()`
- `useFocusEffect` for data refresh on screen focus

### Data fetching
- No React Query or SWR — stores fetch directly via Supabase client
- Pull-to-refresh via `RefreshControl` on ScrollView/FlatList
- `useFocusEffect(useCallback(() => { fetchData(); }, []))` pattern on list screens

### Error handling
- User-facing errors shown via `toast.error('Vietnamese message')`
- All user-facing strings are in Vietnamese
- Error state stored in store as `error: string | null`

## Language

All UI strings are in Vietnamese. Keep this consistent:
- Error messages: `'Vui lòng nhập tên nhóm'`
- Labels: `'Thêm chi tiêu'`, `'Đang tải...'`
- Do not mix English into user-facing text

## Business logic rules

### Currency
- Currency is VND (Vietnamese Dong), displayed as `123.456đ` with dot-separated thousands
- `formatCurrency()` rounds to integer, formats with dots, appends `đ`
- `parseCurrency()` strips non-digits, parses to int
- All split amounts are **rounded down to nearest 1.000d** (`roundDownTo1000`) — this is intentional to avoid asking users to pay fractional thousands

### Expense splitting
- Only "split equally" mode exists — no percentage or exact-amount splits
- Each expense has one payer (`payer_id`) and N participants (`split_between` UUID array)
- Balance calculation: payer gets credited full amount, each participant debited `roundDownTo1000(amount / N)`
- Transaction minimization uses greedy creditor-debtor matching (sort descending, match min of each pair)
- Rounding differences are tracked and displayed in a "CHI TIET LAM TRON" section

### Groups
- Group creator is auto-added as first member (name derived from email prefix)
- Members can be non-users (`user_id: null`) — only the creator needs an account
- Group name: min 2 chars, max 60 chars
- Member names: max 50 chars, must be unique within the group
- No group editing/renaming after creation
- No member removal from UI (only DB policy exists)

### Auth
- Google OAuth only, via PKCE flow
- Profile setup required after first login (display name stored in `user_metadata.full_name`)
- `setup_completed_at` in user_metadata gates access to main app
- Session stored in expo-secure-store (native) or sessionStorage (web)

### Settlements
- Settlement table exists in DB but is **not yet implemented** in the app
- "Mark as paid" button renders but has no handler — it's a placeholder

## Database (Supabase)

Four tables: `groups`, `members`, `expenses`, `settlements`

- All IDs are UUID with `gen_random_uuid()`
- `expenses.amount` is `NUMERIC(12,0)` — integer VND, no decimals
- `expenses.split_between` is `UUID[]` — Postgres array of member IDs
- RLS enabled on all tables. Uses `is_group_member()` SECURITY DEFINER function to avoid recursion
- Cascade deletes: deleting a group removes its members, expenses, and settlements

## Unused components

These components exist but are **not imported by any screen**:
- `AmountInput.tsx` — standalone amount input (expense/new.tsx has its own inline version)
- `BalanceSummary.tsx` — transaction summary card (group/[id].tsx renders its own)
- `ExpenseItem.tsx` — expense row (group/[id].tsx renders its own)
- `MemberChip.tsx` — selectable member chip (expense/new.tsx uses a different split UI)

Consider removing these or refactoring screens to use them for consistency.

## Inconsistencies to fix

1. **Duplicate `formatWithDots`**: Defined in both `AmountInput.tsx` and `expense/new.tsx`. Extract to `calculate.ts`
2. **StyleSheet vs inline**: Most files use `StyleSheet.create`, but `GroupCard.tsx:79` uses inline `{ alignItems: 'flex-end' }`. Stick to StyleSheet
3. **Platform.select for web cursor**: Used in login, setup-profile, and EmptyState but not in other Pressables. Be consistent or remove since this is mobile-first
4. **Expense deletion via long-press only**: `group/[id].tsx` deletes on `onLongPress` with no confirmation dialog — risky for accidental deletions
5. **Category assignment is hash-based, not user-chosen**: `getExpenseCategory()` deterministically maps title to category via hash — not real categorization
6. **`MAX_TITLE_LENGTH` defined in expense/new.tsx** but not enforced via `maxLength` on the TextInput

## Environment variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJ...
```

## Commands

```bash
npx expo start          # Dev server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npx expo lint           # ESLint
eas build               # Production build via EAS
```

## Path aliases

`@/*` maps to `./src/*` and `@/assets/*` maps to `./assets/*` (configured in tsconfig.json).
