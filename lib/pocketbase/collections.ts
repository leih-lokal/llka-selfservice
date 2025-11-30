import pb from './client';
import type { Customer, Item, Rental, Reservation } from '@/types';

export const collections = {
  customers: () => pb.collection<Customer>('customer'),
  items: () => pb.collection<Item>('item'),
  rentals: () => pb.collection<Rental>('rental'),
  reservations: () => pb.collection<Reservation>('reservation'),
};
