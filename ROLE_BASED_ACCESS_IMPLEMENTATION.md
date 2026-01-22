# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the implementation of role-based access control with two roles: **MANAGER** and **STAFF**.

## Roles and Permissions

### MANAGER Role
- **Full Access**: Can perform all operations (create, read, update, delete)
- Can access all features and settings
- Can manage bookings, rooms, food items, payments, invoices
- Can generate bills and checkout guests
- Can update hotel settings

### STAFF Role
- **Limited Access**: Mostly view-only with some operational tasks
- Can view: bookings, rooms, food items, payments, invoices, reports
- Can perform: Add food to bookings, generate kitchen bills
- Cannot: Create/update/delete bookings, rooms, food items, settings
- Cannot: Generate manual bills, checkout guests, update payments

## Implementation Details

### 1. Database Schema
- ✅ Added `UserRole` enum with `MANAGER` and `STAFF` values
- ✅ Updated `User` model to use `UserRole` enum
- ✅ Created migration: `20260122170630_add_user_role_enum`

### 2. Backend Authorization
- ✅ Created `lib/role-auth.ts` with helper functions:
  - `requireManager()` - Requires MANAGER role
  - `requireStaffOrManager()` - Allows both roles
  - `isManager()`, `isStaff()`, `canWrite()`, `canRead()` - Utility functions

### 3. API Routes Protection

#### ✅ Protected Routes (Updated):
- `/api/bookings` - GET: Staff/Manager, POST: Manager only
- `/api/bookings/[id]` - GET: Staff/Manager, PATCH: Manager only
- `/api/bookings/[id]/checkout` - POST: Manager only
- `/api/bookings/food` - POST: Staff/Manager (staff can add food)
- `/api/rooms` - GET: Staff/Manager, POST: Manager only
- `/api/rooms/[id]` - DELETE: Manager only
- `/api/food` - GET: Staff/Manager, POST: Manager only
- `/api/food/[id]` - PATCH/PUT/DELETE: Manager only
- `/api/settings` - GET: Staff/Manager, PUT: Manager only
- `/api/payments` - GET: Staff/Manager
- `/api/payments/[id]` - PATCH: Manager only
- `/api/invoices` - GET: Staff/Manager
- `/api/invoices/[id]` - DELETE: Manager only
- `/api/bills/generate` - POST: Manager only
- `/api/room-types` - GET: Staff/Manager, POST: Manager only

#### ⚠️ Remaining Routes to Update:
The following routes still need role-based protection. They should follow this pattern:
- **GET requests**: Use `requireStaffOrManager(request)`
- **POST/PATCH/PUT/DELETE requests**: Use `requireManager(request)`

Routes to update:
1. `/api/bookings/[id]/kitchen-bill` - POST: Staff/Manager (staff can generate kitchen bills)
2. `/api/bookings/[id]/food-invoice` - POST: Staff/Manager (staff can generate food invoices)
3. `/api/bookings/[id]/kitchen-bill/pay` - POST: Manager only
4. `/api/bookings/food/[id]` - DELETE: Manager only
5. `/api/invoices/[id]/download` - GET: Staff/Manager
6. `/api/invoices/export` - GET: Staff/Manager
7. `/api/kitchen-bills` - GET: Staff/Manager
8. `/api/dashboard/stats` - GET: Staff/Manager
9. `/api/reports` - GET: Staff/Manager
10. `/api/reports/export` - GET: Staff/Manager
11. `/api/police-verification` - GET/POST: Staff/Manager
12. `/api/room-types/[id]` - PATCH/DELETE: Manager only
13. `/api/bus-bookings` - GET: Staff/Manager, POST: Manager only
14. `/api/bus-bookings/[id]` - PATCH/DELETE: Manager only
15. `/api/admin` - GET: Manager only (already has admin check)

### 4. Frontend Implementation

#### ✅ Completed:
- ✅ Login page stores user role in localStorage
- ✅ Created `lib/useUserRole.ts` hook for role management
- ✅ Updated dashboard layout to:
  - Show user role and name in header
  - Hide manager-only navigation items (Settings, Generate Bill)
  - Display role-specific dashboard title
- ✅ Updated bookings page to hide "New Check-In" button for staff

#### ⚠️ Remaining Frontend Updates:
Pages that need role-based UI hiding:
1. **Booking Detail Page** (`/dashboard/bookings/[id]`):
   - Hide "Edit Booking" button for staff
   - Hide "Add Food" button for staff (or allow - staff can add food)
   - Hide "Food Bill" button for staff (or allow - staff can generate food bills)
   - Hide "Download Invoice" button for staff (or allow - view only)
   - Hide "Proceed to Checkout" button for staff

2. **Rooms Page** (`/dashboard/rooms`):
   - Hide "Add Room" button for staff
   - Hide edit/delete buttons for staff

3. **Food Items Page** (`/dashboard/settings/food`):
   - Hide "Add Food Item" button for staff
   - Hide edit/delete buttons for staff

4. **Room Types Page** (`/dashboard/settings/room-types`):
   - Hide "Add Room Type" button for staff
   - Hide delete buttons for staff

5. **Payments Page** (`/dashboard/payments`):
   - Hide payment update buttons for staff

6. **Bills History Page** (`/dashboard/bills/history`):
   - Hide delete buttons for staff
   - Hide print PDF button for staff (or allow - view only)

7. **Kitchen Bills Page** (`/dashboard/kitchen-bills`):
   - Hide delete buttons for staff

8. **Checkout Page** (`/dashboard/checkout`):
   - Hide checkout buttons for staff (or allow - staff can view but not process)

9. **Settings Pages**:
   - All settings pages should be hidden from navigation for staff (already done)
   - If accessed directly, show read-only view

## How to Update Remaining Routes

### For API Routes:
Replace:
```typescript
import { getAuthUser } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
```

With:
```typescript
import { requireStaffOrManager } from '@/lib/role-auth'

export async function GET(request: NextRequest) {
  const user = requireStaffOrManager(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
```

For POST/PATCH/PUT/DELETE:
```typescript
import { requireManager } from '@/lib/role-auth'

export async function POST(request: NextRequest) {
  const user = requireManager(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
  }
```

### For Frontend Pages:
Add at the top of the component:
```typescript
import { useUserRole } from '@/lib/useUserRole'

const { canWrite, isManager } = useUserRole()
```

Then conditionally render buttons:
```typescript
{canWrite && (
  <button>Edit</button>
)}
```

## Testing Checklist

- [ ] Test manager login - should see all features
- [ ] Test staff login - should see limited features
- [ ] Test manager can create/update/delete bookings
- [ ] Test staff cannot create/update/delete bookings
- [ ] Test staff can view bookings
- [ ] Test staff can add food to bookings
- [ ] Test staff can generate kitchen bills
- [ ] Test manager can checkout guests
- [ ] Test staff cannot checkout guests
- [ ] Test API routes return 403 for unauthorized actions
- [ ] Test frontend hides buttons for staff

## Migration Instructions

1. Run the migration:
```bash
npx prisma migrate dev
```

2. Update existing users (if needed):
```sql
-- All existing users will default to MANAGER
-- To create a staff user, update manually:
UPDATE users SET role = 'STAFF' WHERE email = 'staff@hotel.com';
```

3. Generate Prisma client:
```bash
npx prisma generate
```

## Notes

- All existing users default to MANAGER role
- Staff users can view most data but cannot modify critical information
- Staff can perform operational tasks like adding food and generating kitchen bills
- Settings and configuration are manager-only
- Payment updates and checkout require manager access
