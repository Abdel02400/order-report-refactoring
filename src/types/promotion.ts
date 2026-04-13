export type PromotionCode = string & { readonly __brand: 'PromotionCode' };

export const toPromotionCode = (value: string): PromotionCode => value as PromotionCode;

export const PROMOTION_TYPE = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED'
} as const;

export type PromotionType = (typeof PROMOTION_TYPE)[keyof typeof PROMOTION_TYPE];

export const PROMOTION_TYPES = Object.values(PROMOTION_TYPE) as readonly PromotionType[];

export interface Promotion {
    code: PromotionCode;
    type: PromotionType;
    value: number;
    active: boolean;
}
