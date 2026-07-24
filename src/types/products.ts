export interface ProductListItem {
  id: string;
  nama: string;
  namaNormal: string;
  harga: number;
  stok: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  nama: string;
  harga: number;
  stok: number;
}

export interface UpdateProductInput {
  nama?: string;
  harga?: number;
  stok?: number;
}
