export type ProductId = string & { readonly __brand: 'ProductId' };

export interface Product {
    id: ProductId;
    name: string;
    category: string;
    price: number;
    weight: number;
    taxable: boolean;
}
