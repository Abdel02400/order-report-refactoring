import type { CustomerId, CustomerLevel } from '@/types/customer';
import type { Currency } from '@/types/currency';
import type { ShippingZoneCode } from '@/types/shippingZone';

export interface CustomerReportData {
    id: CustomerId;
    name: string;
    level: CustomerLevel;
    zone: ShippingZoneCode;
    currency: Currency;
    subtotal: number;
    totalDiscount: number;
    volumeDiscount: number;
    loyaltyDiscount: number;
    morningBonus: number;
    tax: number;
    shipping: number;
    weight: number;
    handling: number;
    itemCount: number;
    total: number;
    loyaltyPoints: number;
}

export interface ReportData {
    customers: CustomerReportData[];
    grandTotal: number;
    totalTaxCollected: number;
}

export interface CustomerJsonExport {
    customer_id: string;
    name: string;
    total: number;
    currency: Currency;
    loyalty_points: number;
}
