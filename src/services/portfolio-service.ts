import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/wealth-plus/api').replace(/\/$/, '');
const MAX_RETRIES = 2;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export interface PortfolioSummaryInvestment {
  transactionId: string;
  transactionDate: string;
  amountInvested: number;
  units: number;
  navAtPurchase: number;
  currentValue: number;
  gainLossAmount: number;
  status: string;
}

export interface PortfolioSummaryFund {
  fundName: string;
  folioNumber: string;
  fundType: string;
  totalUnits: number;
  amountInvested: number;
  currentNav: number;
  currentValue: number;
  gainLossAmount: number;
  gainLossPercentage: number;
  status: string;
  investments: PortfolioSummaryInvestment[];
}

export interface PortfolioSummaryApiResponse {
  username: string;
  funds: PortfolioSummaryFund[];
  totalAmountInvested: number;
  totalCurrentValue: number;
  totalGainLossAmount: number;
  totalGainLossPercentage: number;
  overallStatus: string;
}

export const fetchPortfolioSummary = async (username: string) => {
  const url = `${API_BASE_URL}/portfolio/summary/username/${username}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.get<PortfolioSummaryApiResponse>(url);
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        break;
      }

      await wait(250 * attempt);
    }
  }

  console.error('Error fetching portfolio summary:', lastError);
  throw new Error('Unable to fetch portfolio summary.');
};
