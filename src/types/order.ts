import type { CustomerId } from '@/types/customer';
import type { ProductId } from '@/types/product';
import type { PromotionCode } from '@/types/promotion';

export type OrderId = string & { readonly __brand: 'OrderId' };

export const toOrderId = (value: string): OrderId => value as OrderId;

export interface Order {
    id: OrderId;
    customerId: CustomerId;
    productId: ProductId;
    qty: number;
    unitPrice: number;
    date: string;
    promoCode: PromotionCode | '';
    time: string;
}
