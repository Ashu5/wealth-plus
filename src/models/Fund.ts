export interface Platform {
  platformCode: string;
}

export interface Fund {
  fundName: string;
  fundCode: string;
  fundType: string;
  fundAmount: number;
  folioNumber: string;
  folioNumbers?: string[];
  currency: string;
  createdDate: string;
  platform: Platform;
}