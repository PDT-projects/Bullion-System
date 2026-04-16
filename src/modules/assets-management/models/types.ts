export interface EmployeeInfo {
  name: string;
  contact: string;
}

export interface Asset {
  id: string;
  assetName: string;
  price: number;
  purchaseDate: string; // YYYY-MM-DD
  employee: EmployeeInfo;
  createdAt: Date;
  updatedAt?: Date;
}




