export type InvestmentKind = 'Mutual Fund' | 'Fixed Deposit';

export type PortfolioEntry = {
  id: string;
  month: string;
  investmentType: InvestmentKind;
  bank: string;
  name: string;
  amount: number;
  currentValue: number;
  status: 'Growing' | 'Stable';
};

export type FixedDepositEntry = {
  id: string;
  month: string;
  investmentType: 'Fixed Deposit';
  bank: string;
  scheme: string;
  amount: number;
  tenure: string;
  rate: number;
  maturityDate: string;
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