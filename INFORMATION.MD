# leih.lokal Verwaltung - Companion App Development Guide

This document provides comprehensive information for building a companion self-service terminal app that integrates with the leih.lokal Verwaltung (Library Management System). The terminal allows customers to check out items and pick up reservations.

**Last Updated**: 2025-11-29
**Main App**: Next.js 15 + React 19 + PocketBase 0.26.3
**Language**: German (UI labels), TypeScript (code)

---

## Table of Contents

1. [PocketBase Integration](#pocketbase-integration)
2. [Database Schema](#database-schema)
3. [Business Logic](#business-logic)
4. [Style Guide](#style-guide)
5. [Utilities & Helpers](#utilities--helpers)
6. [Quick Start for Companion App](#quick-start-for-companion-app)

---

## PocketBase Integration

### Client Setup

The main app uses a **Proxy-based singleton pattern** for the PocketBase client that automatically handles URL changes.

**Package**: `pocketbase@^0.26.3`

```typescript
import PocketBase from 'pocketbase';

// Basic initialization
const pb = new PocketBase('http://localhost:8090');

// Type-safe collection accessors (recommended pattern)
const collections = {
  customers: () => pb.collection('customer'),
  customerRentals: () => pb.collection('customer_rentals'), // Statistics view
  items: () => pb.collection('item'),
  rentals: () => pb.collection('rental'),
  reservations: () => pb.collection('reservation'),
  notes: () => pb.collection('note'),
  logs: () => pb.collection('log'),
};
```

**Reference**: `/lib/pocketbase/client.ts`

### URL Management

PocketBase URL can be configured per environment:

```typescript
// Environment variables
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090  // Client-side
POCKETBASE_URL=http://localhost:8090              // Server-side

// Client-side: URL can also be stored in localStorage
localStorage.setItem('pocketbase_url', 'http://your-server:8090');
```

### Authentication

**Login Pattern** (Admin authentication):

```typescript
// Authenticate via _superusers collection (admin login)
try {
  await pb.collection('_superusers').authWithPassword(username, password);
  console.log('Logged in:', pb.authStore.isValid);
} catch (error) {
  console.error('Login failed:', error);
}

// Check authentication status
const isAuthenticated = pb.authStore.isValid;
const currentUser = pb.authStore.model;
const authToken = pb.authStore.token;

// Logout
pb.authStore.clear();
```

**Auto-Refresh** (keep tokens valid):

```typescript
// Refresh auth token (PocketBase tokens last ~2 weeks by default)
async function refreshAuth() {
  if (pb.authStore.isValid) {
    try {
      await pb.collection('_superusers').authRefresh();
    } catch (error) {
      console.error('Auth refresh failed:', error);
      pb.authStore.clear();
    }
  }
}

// Call every 10 minutes
setInterval(refreshAuth, 10 * 60 * 1000);
```

**Reference**: `/lib/pocketbase/auth.ts`, `/hooks/use-auth.ts`

### Data Fetching Patterns

**Basic CRUD Operations**:

```typescript
// Get single record
const customer = await collections.customers().getOne('RECORD_ID');

// Get list with pagination
const result = await collections.customers().getList(page, perPage);
// Returns: { page, perPage, totalItems, totalPages, items }

// Get all records
const allItems = await collections.items().getFullList();

// Get first matching record
const lastCustomer = await collections.customers().getFirstListItem('', {
  sort: '-iid',
});

// Create record
const newRental = await collections.rentals().create({
  customer: 'CUSTOMER_ID',
  items: ['ITEM_ID_1', 'ITEM_ID_2'],
  deposit: 50,
  rented_on: '2024-01-15',
  expected_on: '2024-01-22',
  // ... other fields
});

// Update record
const updated = await collections.rentals().update('RENTAL_ID', {
  returned_on: '2024-01-20',
  deposit_back: 50,
});

// Delete record
await collections.customers().delete('CUSTOMER_ID');
```

**Filtering & Sorting**:

```typescript
// Get active rentals (returned_on is empty)
const activeRentals = await collections.rentals().getFullList({
  filter: 'returned_on = ""',
  sort: '-rented_on',
});

// Get rentals for specific customer
const customerRentals = await collections.rentals().getFullList({
  filter: `customer="${customerId}"`,
});

// Complex filter (item is rented AND not returned)
const rentalsForItem = await collections.rentals().getFullList({
  filter: `items ~ '${itemId}' && returned_on = ''`,
});

// Filter operators: =, !=, >, <, >=, <=, ~ (contains), !~ (not contains)
```

**Expanding Relations**:

```typescript
// Fetch rental with expanded customer and items
const rental = await collections.rentals().getOne('RENTAL_ID', {
  expand: 'customer,items',
});

// Access expanded data
console.log(rental.expand.customer.firstname);
console.log(rental.expand.items[0].name);

// Type definition for expanded rental:
interface RentalExpanded extends Rental {
  expand: {
    customer: Customer;
    items: Item[];
  };
}
```

### Real-Time Subscriptions

```typescript
// Subscribe to collection changes
pb.collection('rental').subscribe('*', (e) => {
  console.log(e.action); // 'create' | 'update' | 'delete'
  console.log(e.record); // The affected record
});

// Subscribe to specific record
pb.collection('customer').subscribe('RECORD_ID', (e) => {
  console.log('Customer updated:', e.record);
});

// Unsubscribe
pb.collection('rental').unsubscribe('*');
```

**Reference**: `/hooks/use-realtime-subscription.ts`, `/lib/pocketbase/realtime.ts`

### Error Handling

```typescript
try {
  const saved = await collections.customers().create(formData);
  // Success - show toast notification
  console.log('Customer created:', saved);
} catch (err) {
  // Error - log and show user-friendly message
  console.error('Error saving customer:', err);
  alert('Failed to save customer. Please try again.');
}
```

---

## Database Schema

All collections share a base record structure:

```typescript
interface BaseRecord {
  id: string;           // UUID (internal reference)
  created: string;      // ISO timestamp
  updated: string;      // ISO timestamp
}
```

### Collections Overview

| Collection | Description | Has `iid`? |
|------------|-------------|------------|
| `customer` | Registered customers | Yes |
| `item` | Inventory items | Yes |
| `rental` | Rental transactions | No |
| `reservation` | Reservations for pickup | No |
| `note` | Dashboard sticky notes | No |
| `log` | Application logs | No |
| `customer_rentals` | Customer statistics (view) | No |

**Note**: `iid` (integer ID) is auto-increment and user-facing. Use `id` (UUID) for internal references.

### Customer Collection

**Collection Name**: `customer`

```typescript
interface Customer extends BaseRecord {
  iid: number;                    // User-facing ID (e.g., #0042)
  firstname: string;              // Required
  lastname: string;               // Required
  email?: string;
  phone?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  registered_on: string;          // Date: YYYY-MM-DD
  renewed_on?: string;            // Date: YYYY-MM-DD
  heard?: string;                 // How they heard about library
  newsletter: boolean;            // Newsletter subscription
  remark?: string;                // Staff remarks
  highlight_color?: 'green' | 'blue' | 'yellow' | 'red';
}

// With statistics (from customer_rentals view)
interface CustomerWithStats extends Customer {
  active_rentals: number;         // Current active rentals
  total_rentals: number;          // All-time rentals
}
```

**Reference**: `/types/index.ts` (lines 114-176)

### Item Collection

**Collection Name**: `item`

```typescript
interface Item extends BaseRecord {
  iid: number;                    // User-facing ID
  name: string;                   // Required
  brand?: string;
  model?: string;
  description?: string;
  category: ItemCategory[];       // Array: can have multiple categories
  deposit: number;                // EUR (e.g., 25.50)
  synonyms: string[];             // For search
  packaging?: string;
  manual?: string;
  parts?: string;
  copies: number;                 // Number of copies available (default: 1)
  status: ItemStatus;             // See ItemStatus enum below
  images: string[];               // File names
  highlight_color?: 'green' | 'blue' | 'yellow' | 'red';
  internal_note?: string;         // Staff-only note
  added_on: string;               // Date: YYYY-MM-DD
}

// Item categories
enum ItemCategory {
  Kitchen = 'kitchen',            // Küche
  Household = 'household',        // Haushalt
  Garden = 'garden',              // Garten
  Kids = 'kids',                  // Kinder
  Leisure = 'leisure',            // Freizeit
  DIY = 'diy',                    // Heimwerken
  Other = 'other',                // Sonstige
}

// Item status
enum ItemStatus {
  InStock = 'instock',            // Verfügbar
  OutOfStock = 'outofstock',      // Verliehen
  Reserved = 'reserved',          // Reserviert
  OnBackorder = 'onbackorder',    // Bestellt
  Lost = 'lost',                  // Verloren
  Repairing = 'repairing',        // In Reparatur
  ForSale = 'forsale',            // Zu verkaufen
  Deleted = 'deleted',            // Gelöscht (soft delete)
}
```

**Reference**: `/types/index.ts` (lines 204-290), `/lib/constants/categories.ts`, `/lib/constants/statuses.ts`

### Rental Collection

**Collection Name**: `rental`

```typescript
interface Rental extends BaseRecord {
  customer: string;               // Customer ID (UUID reference)
  items: string[];                // Item IDs (UUIDs, can be multiple)
  requested_copies?: Record<string, number>; // { item_id: copy_count }
  deposit: number;                // EUR given
  deposit_back: number;           // EUR returned (0 until return)
  rented_on: string;              // Date: YYYY-MM-DD
  returned_on?: string;           // Date: YYYY-MM-DD (null = still active)
  expected_on: string;            // Due date: YYYY-MM-DD
  extended_on?: string;           // Timestamp when extended (not deadline)
  remark?: string;                // Optional notes
  employee?: string;              // Who checked out (staff name)
  employee_back?: string;         // Who checked in (staff name)
}

// Rental with expanded relations
interface RentalExpanded extends Rental {
  expand: {
    customer: Customer;
    items: Item[];
  };
}

// Rental status (COMPUTED, not stored in DB)
enum RentalStatus {
  Active = 'active',              // Not returned, due in future
  Returned = 'returned',          // Returned (not today)
  Overdue = 'overdue',            // Not returned, past due date
  DueToday = 'due_today',         // Not returned, due today
  ReturnedToday = 'returned_today', // Returned today
}
```

**Important**: Rental status is **computed from dates**, not stored in database. See [Business Logic](#rental-status-computation) section.

**Reference**: `/types/index.ts` (lines 299-380)

### Reservation Collection

**Collection Name**: `reservation`

```typescript
interface Reservation extends BaseRecord {
  customer_iid?: number;          // Existing customer ID (optional)
  customer_name: string;          // Name (required, for new customers too)
  customer_phone?: string;
  customer_email?: string;
  is_new_customer: boolean;       // True if not yet in system
  comments?: string;              // Reservation notes
  done: boolean;                  // Completed/picked up?
  items: string[];                // Item IDs (UUIDs)
  pickup: string;                 // Pickup date/time: ISO timestamp
}

// With expanded items
interface ReservationExpanded extends Reservation {
  expand: {
    items: Item[];
  };
}
```

**Reference**: `/types/index.ts` (lines 389-439)

### Customer Rentals View

**Collection Name**: `customer_rentals` (read-only view)

```typescript
interface CustomerRentals {
  id: string;                     // Customer ID (matches customer.id)
  num_active_rentals: number;     // Current active rentals
  num_rentals: number;            // Total all-time rentals
}
```

**Usage**:

```typescript
// Fetch stats for multiple customers
const stats = await collections.customerRentals().getFullList({
  filter: customerIds.map(id => `id='${id}'`).join('||'),
  fields: 'id,num_rentals,num_active_rentals',
});
```

**Reference**: `/types/index.ts` (lines 172-176)

---

## Business Logic

### Rental Creation Workflow

**Required Data**:

```typescript
{
  customer: string,            // Customer ID (must exist)
  items: string[],             // At least 1 item ID
  requested_copies?: {         // For items with multiple copies
    [item_id]: number
  },
  deposit: number,             // Auto-calculated: sum(item.deposit × copies)
  deposit_back: 0,             // Initially 0
  rented_on: string,           // YYYY-MM-DD (default: today)
  expected_on: string,         // YYYY-MM-DD (default: today + 7 days)
  employee: string,            // Staff member (required)
  remark?: string
}
```

**Validation Rules**:

1. **Customer**: Must be existing registered customer (no new customers allowed for rentals)
2. **Items**: At least 1 item required
3. **Item Status**: Items must have `status = 'instock'` or `status = 'reserved'`
4. **Copy Availability**: Check available copies before allowing checkout
5. **Deposit**: Auto-calculated as `sum(item.deposit × copy_count)`
6. **Employee**: Required for audit trail
7. **Dates**: `rented_on` ≤ `expected_on`

**Reference**: `/app/(dashboard)/rentals/[id]/page.tsx`

### Item Availability Checking

**Algorithm**:

```typescript
// Calculate available copies for an item
async function getItemAvailability(itemId: string) {
  // 1. Get item details
  const item = await collections.items().getOne(itemId);
  const totalCopies = item.copies || 1;

  // 2. Get all active rentals (not returned)
  const activeRentals = await collections.rentals().getFullList({
    filter: `items ~ '${itemId}' && returned_on = ''`,
  });

  // 3. Count rented copies
  let rentedCopies = 0;
  for (const rental of activeRentals) {
    const copyCount = rental.requested_copies?.[itemId] || 1;
    rentedCopies += copyCount;
  }

  // 4. Calculate available
  const availableCopies = Math.max(0, totalCopies - rentedCopies);

  return {
    totalCopies,
    rentedCopies,
    availableCopies,
  };
}
```

**Example**:
- Item has 5 copies total
- 2 rentals: one rented 2 copies, another rented 1 copy
- Available: 5 - (2 + 1) = **2 copies**

**Reference**: `/lib/utils/item-availability.ts`

### Rental Status Computation

**Logic** (from `/lib/utils/formatting.ts`):

```typescript
function calculateRentalStatus(
  rented_on: string,
  returned_on: string | null,
  expected_on: string,
  extended_on?: string | null
): RentalStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  // Already returned?
  if (returned_on) {
    const returnDate = new Date(returned_on);
    returnDate.setHours(0, 0, 0, 0);

    if (returnDate.getTime() === today.getTime()) {
      return 'returned_today';
    }
    return 'returned';
  }

  // Not returned - check due date
  const dueDate = new Date(expected_on);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'due_today';
  return 'active';
}
```

**Status Labels** (German):

```typescript
const RENTAL_STATUS_LABELS = {
  active: 'Aktiv',
  returned: 'Zurückgegeben',
  overdue: 'Überfällig',
  due_today: 'Heute fällig',
  returned_today: 'Heute zurück',
};
```

**Row Highlighting Colors**:

```typescript
const RENTAL_STATUS_COLORS = {
  active: 'transparent',
  returned: 'transparent',
  overdue: 'hsl(0 80% 92%)',        // Light red
  due_today: 'hsl(210 70% 92%)',    // Light blue
  returned_today: 'hsl(120 60% 92%)', // Light green
};
```

**Reference**: `/lib/utils/formatting.ts` (lines 59-124), `/lib/constants/statuses.ts`

### Reservation to Rental Conversion

**Workflow**:

1. Staff finds reservation in system (filter by `pickup` date)
2. Click "Convert to Rental" button
3. System marks reservation as `done: true`
4. Opens rental creation form with pre-filled data:
   - Customer: from `customer_iid` (if existing customer)
   - Items: from `reservation.items`
   - Remark: from `reservation.comments`
   - Dates: `rented_on` = today, `expected_on` = today + 7 days
5. Staff confirms/adjusts deposit and copy counts
6. Submit to create rental

**Code Example**:

```typescript
// Mark reservation done
await collections.reservations().update(reservationId, { done: true });

// Create rental from reservation data
const rental = await collections.rentals().create({
  customer: reservation.customer_id,
  items: reservation.items,
  deposit: calculateDeposit(reservation.items),
  deposit_back: 0,
  rented_on: dateToLocalString(new Date()),
  expected_on: dateToLocalString(addDays(new Date(), 7)),
  employee: currentStaffName,
  remark: reservation.comments,
});
```

**Reference**: `/app/(dashboard)/reservations/page.tsx` (lines 290-338)

### Deposit Calculation

```typescript
// Auto-calculate total deposit
function calculateDeposit(items: Item[], copyCounts: Record<string, number>) {
  let total = 0;
  for (const item of items) {
    const copies = copyCounts[item.id] || 1;
    total += item.deposit * copies;
  }
  return total;
}

// Example:
// Item A: €20 deposit, 2 copies
// Item B: €15 deposit, 1 copy
// Total: (20 × 2) + (15 × 1) = €55
```

### Customer & Item Highlighting

**Purpose**: Visual alerts for staff attention

**Colors**:

```typescript
enum HighlightColor {
  Green = 'green',    // Positive
  Blue = 'blue',      // Information
  Yellow = 'yellow',  // Warning
  Red = 'red',        // Important/Problem
}

// CSS values
const HIGHLIGHT_COLOR_VALUES = {
  green: '#22c55e',   // CSS green-500
  blue: '#3b82f6',    // CSS blue-500
  yellow: '#eab308',  // CSS yellow-500
  red: '#ef4444',     // CSS red-500
};
```

**Usage**: Applied to table rows, displayed as colored dots/bars in UI.

**Reference**: `/lib/constants/colors.ts`

### Business Rules Summary

| Rule | Description |
|------|-------------|
| No anonymous rentals | Customer must exist in system before rental |
| Multi-item rentals | Multiple items allowed per rental |
| Copy management | Items can have multiple copies (tracked via `requested_copies`) |
| Deposit required | Full deposit collected at checkout |
| Default rental period | 7 days (configurable per rental) |
| Status is computed | Rental status calculated from dates, not stored |
| Soft delete | Items marked `status='deleted'` not removed from DB |
| Staff audit trail | `employee` and `employee_back` required for tracking |

---

## Style Guide

### Color System

**Format**: OKLCH color space (perceptual uniformity)

**Primary Brand Color**: `oklch(0.515 0.283 27.87)` (warm orange)

**Light Theme**:

```css
--background: oklch(1 0 0);              /* Pure white */
--foreground: oklch(0.145 0 0);          /* Dark charcoal */
--primary: oklch(0.515 0.283 27.87);     /* Warm orange */
--primary-foreground: oklch(1 0 0);      /* White */
--secondary: oklch(0.97 0 0);            /* Light gray */
--muted: oklch(0.97 0 0);                /* Light gray */
--muted-foreground: oklch(0.556 0 0);    /* Medium gray */
--border: oklch(0.515 0.283 27.87);      /* Orange border */
--input: oklch(0.922 0 0);               /* Very light gray */
```

**Dark Theme**:

```css
--background: oklch(0.145 0 0);          /* Very dark */
--foreground: oklch(0.985 0 0);          /* Off-white */
--card: oklch(0.205 0 0);                /* Dark gray */
--primary: oklch(0.922 0 0);             /* Light (inverted) */
--border: oklch(1 0 0 / 10%);            /* Transparent white */
--input: oklch(1 0 0 / 15%);             /* Transparent white */
```

**Semantic Colors**:

```typescript
// Item status badge colors
{
  InStock: 'default',        // Primary orange
  OutOfStock: 'secondary',   // Light gray
  Reserved: 'outline',       // Bordered
  Lost: 'destructive',       // Red
}

// Rental status row backgrounds
{
  Overdue: 'hsl(0 80% 92%)',        // Light red
  DueToday: 'hsl(210 70% 92%)',     // Light blue
  ReturnedToday: 'hsl(120 60% 92%)', // Light green
}
```

**Reference**: `/app/globals.css` (lines 46-113)

### Typography

**Font Families**:

```css
--font-sans: 'Geist Sans', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;

/* Custom brand font (optional) */
font-family: 'Univers LT Std';  /* Weights: 400, 700, 900 */
font-family: 'Univers LT Std Condensed'; /* Weights: 400, 700 */
```

**Typography Scale**:

```css
text-xs:    12px   /* Badge text */
text-sm:    14px   /* Form labels, descriptions */
text-base:  16px   /* Body text (default) */
text-lg:    18px   /* Dialog titles */
text-xl:    20px   /* Page headings */
text-2xl:   24px   /* Large headings */
```

**Font Weights**:

```css
font-normal:    400
font-medium:    500  /* Buttons, labels */
font-semibold:  600  /* Card titles */
font-bold:      700
font-black:     900
```

**Reference**: `/app/globals.css` (lines 148-217)

### Component Patterns

**Buttons**:

```typescript
// Variants
{
  default: 'bg-primary text-primary-foreground',  // Orange button
  destructive: 'bg-destructive text-white',       // Red button
  outline: 'border bg-background',                // Bordered
  secondary: 'bg-secondary',                      // Light gray
  ghost: 'hover:bg-accent',                       // Transparent
  link: 'text-primary underline',                 // Link style
}

// Sizes
{
  default: 'h-9 px-4 py-2',   // 36px tall
  sm: 'h-8 px-3',             // 32px tall (compact)
  lg: 'h-10 px-6',            // 40px tall
  icon: 'size-9',             // Square 36px
}
```

**Input Fields**:

```css
height: 36px;
padding: 0 12px;
border: 1px solid var(--input);
border-radius: 0;  /* Sharp corners */
background: transparent;

/* Focus state */
focus: {
  border-color: var(--ring);
  ring: 3px var(--ring) / 50%;
}

/* Invalid state */
aria-invalid: {
  border-color: var(--destructive);
  ring: var(--destructive) / 20%;
}
```

**Cards**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>

// Styling:
// - bg-card, text-card-foreground
// - border: 1px solid var(--border)
// - border-radius: 8px (rounded-xl)
// - no box-shadow
```

**Badges**:

```tsx
<Badge variant="default">Verfügbar</Badge>
<Badge variant="destructive">Verloren</Badge>

// Styling:
// - rounded-full (pill shape)
// - px-2 py-0.5
// - text-xs (12px)
// - font-medium (500)
```

**Reference**: `/components/ui/button.tsx`, `/components/ui/input.tsx`, `/components/ui/card.tsx`, `/components/ui/badge.tsx`

### Design Decisions

1. **Sharp Corners**: `border-radius: 0` globally (minimalist aesthetic)
2. **No Shadows**: `box-shadow: none !important` (relies on borders for depth)
3. **Orange Primary**: Warm, inviting brand color
4. **German Language**: All UI labels in German
5. **Accessible Colors**: WCAG AA contrast ratios
6. **Focus Visible**: 3px ring on all interactive elements

**Reference**: `/app/globals.css` (lines 115-129)

---

## Utilities & Helpers

### Date Formatting

**Library**: `date-fns` with German locale

```typescript
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

// Format date to German format
formatDate('2024-01-15', 'dd.MM.yyyy')  // "15.01.2024"

// Format with time
formatDateTime('2024-01-15T14:30:00Z')  // "15.01.2024 14:30"

// Relative time
formatRelativeTime('2024-01-10')  // "vor 5 Tagen"

// Convert Date to YYYY-MM-DD (local timezone, avoids UTC offset issues)
function dateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD to Date (local timezone)
function localStringToDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

**Reference**: `/lib/utils/formatting.ts`

### Currency Formatting

```typescript
// Format to EUR with German locale
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

formatCurrency(25.50)  // "25,50 €"
```

**Reference**: `/lib/utils/formatting.ts` (lines 49-54)

### Phone Number Formatting

```typescript
// Format German phone numbers
formatPhoneNumber('01234567890')  // "0123 456 7890"
formatPhoneNumber('+491234567890')  // "+49 123 456 7890"
```

**Reference**: `/lib/utils/formatting.ts` (lines 129-145)

### Class Name Utility

```typescript
import { cn } from '@/lib/utils';

// Merge Tailwind classes safely (handles conflicts)
cn('bg-primary', 'bg-secondary')  // "bg-secondary" (last wins)
cn('px-4', className)  // Merge with conditional class
```

**Reference**: `/lib/utils.ts`

---

## Quick Start for Companion App

### Minimal Setup

```typescript
import PocketBase from 'pocketbase';

// 1. Initialize PocketBase client
const pb = new PocketBase('http://your-pocketbase-server:8090');

// 2. Authenticate
await pb.collection('_superusers').authWithPassword('username', 'password');

// 3. Fetch data
const customers = await pb.collection('customer').getFullList();
const items = await pb.collection('item').getFullList({
  filter: 'status="instock"',
});

// 4. Create rental
const rental = await pb.collection('rental').create({
  customer: 'CUSTOMER_ID',
  items: ['ITEM_ID'],
  deposit: 25,
  deposit_back: 0,
  rented_on: '2024-01-15',
  expected_on: '2024-01-22',
  employee: 'Terminal',
});

// 5. Listen for changes
pb.collection('rental').subscribe('*', (e) => {
  console.log('Rental changed:', e.action, e.record);
});
```

### Recommended Architecture for Terminal App

```
/terminal-app
  /src
    /lib
      pocketbase.ts       # PocketBase client setup
      types.ts            # Copy types from main app
      formatting.ts       # Date/currency utilities
    /components
      CustomerSearch.tsx  # Search/select customer
      ItemSearch.tsx      # Search/select items
      RentalForm.tsx      # Create rental
      RentalSummary.tsx   # Show receipt
    /pages
      index.tsx           # Main terminal screen
```

### Key Integrations for Self-Service Terminal

**Customer Lookup**:
```typescript
// Search by IID, name, or phone
const customers = await pb.collection('customer').getFullList({
  filter: `iid=${customerIid} || firstname~"${query}" || phone~"${query}"`,
});
```

**Item Lookup**:
```typescript
// Search by name or synonyms, filter available only
const items = await pb.collection('item').getFullList({
  filter: `status="instock" && (name~"${query}" || synonyms~"${query}")`,
});
```

**Check Availability**:
```typescript
// Before checkout, verify copies available
const activeRentals = await pb.collection('rental').getFullList({
  filter: `items~'${itemId}' && returned_on=""`,
});
// Count rented copies, compare to item.copies
```

**Create Rental**:
```typescript
const rental = await pb.collection('rental').create({
  customer: customerId,
  items: selectedItemIds,
  requested_copies: { [itemId]: copyCount },  // If multiple copies
  deposit: totalDeposit,
  deposit_back: 0,
  rented_on: dateToLocalString(new Date()),
  expected_on: dateToLocalString(addDays(new Date(), 7)),
  employee: 'Self-Service Terminal',
});
```

**Pick Up Reservation**:
```typescript
// Find reservation
const reservation = await pb.collection('reservation').getOne(reservationId, {
  expand: 'items',
});

// Convert to rental (see Reservation to Rental Conversion section)
await pb.collection('reservation').update(reservationId, { done: true });
const rental = await pb.collection('rental').create({ /* ... */ });
```

### Environment Variables

```bash
# .env
NEXT_PUBLIC_POCKETBASE_URL=http://your-server:8090
TERMINAL_EMPLOYEE_NAME=Self-Service Terminal
```

### Package Dependencies

```json
{
  "dependencies": {
    "pocketbase": "^0.26.3",
    "date-fns": "^4.1.0"
  }
}
```

---

## References to Main App Files

| Topic | File Path |
|-------|-----------|
| PocketBase Client | `/lib/pocketbase/client.ts` |
| Authentication | `/lib/pocketbase/auth.ts` |
| Type Definitions | `/types/index.ts` |
| Date Formatting | `/lib/utils/formatting.ts` |
| Item Availability | `/lib/utils/item-availability.ts` |
| Status Constants | `/lib/constants/statuses.ts` |
| Categories | `/lib/constants/categories.ts` |
| Colors | `/lib/constants/colors.ts` |
| Global Styles | `/app/globals.css` |
| Rental Form | `/app/(dashboard)/rentals/[id]/page.tsx` |
| Reservation Pickup | `/app/(dashboard)/reservations/page.tsx` |

---

## Additional Notes

### Data Consistency

- Always use `dateToLocalString()` and `localStringToDate()` for date conversions to avoid timezone issues
- Display `iid` to users, but use `id` (UUID) for database references
- Check item availability before allowing rentals (race conditions possible)
- Validate customer exists before creating rental

### German UI Labels

```typescript
const LABELS = {
  customer: 'Nutzer:in',
  item: 'Gegenstand',
  rental: 'Leihvorgang',
  reservation: 'Reservierung',
  available: 'Verfügbar',
  rented: 'Verliehen',
  overdue: 'Überfällig',
  deposit: 'Kaution',
};
```

### Security Considerations

- Always authenticate via `_superusers` collection
- Keep auth tokens secure (don't expose in client code)
- Validate all user input before database operations
- Use PocketBase's built-in validation and permissions
- Log all terminal transactions for audit trail

---

**End of Document**

For questions or clarifications, refer to the main application codebase at `/Users/ruby/GitRepos/llka-verwaltung`.
