// Base record structure for all PocketBase collections
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// Customer
export interface Customer extends BaseRecord {
  iid: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  registered_on: string;
  renewed_on?: string;
  heard?: string;
  newsletter: boolean;
  remark?: string;
  highlight_color?: 'green' | 'blue' | 'yellow' | 'red';
}

// Item categories
export enum ItemCategory {
  Kitchen = 'kitchen',
  Household = 'household',
  Garden = 'garden',
  Kids = 'kids',
  Leisure = 'leisure',
  DIY = 'diy',
  Other = 'other',
}

// Item status
export enum ItemStatus {
  InStock = 'instock',
  OutOfStock = 'outofstock',
  Reserved = 'reserved',
  OnBackorder = 'onbackorder',
  Lost = 'lost',
  Repairing = 'repairing',
  ForSale = 'forsale',
  Deleted = 'deleted',
}

// Item
export interface Item extends BaseRecord {
  iid: number;
  name: string;
  brand?: string;
  model?: string;
  description?: string;
  category: ItemCategory[];
  deposit: number;
  synonyms: string[];
  packaging?: string;
  manual?: string;
  parts?: string;
  copies: number;
  status: ItemStatus;
  images: string[];
  highlight_color?: 'green' | 'blue' | 'yellow' | 'red';
  internal_note?: string;
  added_on: string;
}

// Rental
export interface Rental extends BaseRecord {
  customer: string;
  items: string[];
  requested_copies?: Record<string, number>;
  deposit: number;
  deposit_back: number;
  rented_on: string;
  returned_on?: string;
  expected_on: string;
  extended_on?: string;
  remark?: string;
  employee?: string;
  employee_back?: string;
}

export interface RentalExpanded extends Rental {
  expand: {
    customer: Customer;
    items: Item[];
  };
}

// Reservation
export interface Reservation extends BaseRecord {
  customer_iid?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  is_new_customer: boolean;
  comments?: string;
  done: boolean;
  items: string[];
  pickup: string;
  on_premises: boolean;
  otp?: string;
}

export interface ReservationExpanded extends Reservation {
  expand: {
    items: Item[];
  };
}
