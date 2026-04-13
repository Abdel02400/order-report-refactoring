export type PromotionCode = string & { readonly __brand: 'PromotionCode' };
export type PromotionType = 'PERCENTAGE' | 'FIXED';

export interface Promotion {
    code: PromotionCode;
    type: PromotionType;
    value: number;
    active: boolean;
}
