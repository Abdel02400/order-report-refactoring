import { CURRENCY } from '@/types/currency';
import type { CustomerReportData, ReportData } from '@/types/report';
import { money, weight } from '@/report/format';

const formatCustomerBlock = (c: CustomerReportData): string[] => {
    const lines: string[] = [];

    lines.push(`Customer: ${c.name} (${c.id})`);
    lines.push(`Level: ${c.level} | Zone: ${c.zone} | Currency: ${c.currency}`);
    lines.push(`Subtotal: ${money(c.subtotal)}`);
    lines.push(`Discount: ${money(c.totalDiscount)}`);
    lines.push(`  - Volume discount: ${money(c.volumeDiscount)}`);
    lines.push(`  - Loyalty discount: ${money(c.loyaltyDiscount)}`);

    if (c.morningBonus > 0) lines.push(`  - Morning bonus: ${money(c.morningBonus)}`);

    lines.push(`Tax: ${money(c.tax)}`);
    lines.push(`Shipping (${c.zone}, ${weight(c.weight)}kg): ${money(c.shipping)}`);

    if (c.handling > 0) lines.push(`Handling (${c.itemCount} items): ${money(c.handling)}`);

    lines.push(`Total: ${money(c.total)} ${c.currency}`);
    lines.push(`Loyalty Points: ${c.loyaltyPoints}`);
    lines.push('');

    return lines;
};

export const formatReport = (data: ReportData): string => {
    const lines: string[] = [];

    for (const customer of data.customers) lines.push(...formatCustomerBlock(customer));

    lines.push(`Grand Total: ${money(data.grandTotal)} ${CURRENCY.EUR}`);
    lines.push(`Total Tax Collected: ${money(data.totalTaxCollected)} ${CURRENCY.EUR}`);

    return lines.join('\n');
};
