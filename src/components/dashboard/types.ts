export type InvestmentKind = string;

export type PortfolioEntry = {
  id: string;
  month: string;
  investmentType: string;
  bank: string;
  name: string;
  amount: number;
  currentValue: number;
  status: string;
  folioNumber?: string;
  nav?: number;
  units?: number;
};

export type FixedDepositEntry = {
  id: string;
  month: string;
  investmentType: 'Fixed Deposit';
  bank: string;
  fdNumber: string;
  amount: number;
  tenure: string;
  rate: number;
  maturityDate: string;
  active: boolean;
};

export type StepDefinition = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  actionLabel: string;
};

export type ModalConfig = {
  id: string;
  title: string;
  submitLabel: string;
};