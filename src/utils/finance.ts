export interface FinanceCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  downPayment: number;
  loanAmount: number;
  numberOfPayments: number;
  interestRate: number;
  breakdown: PaymentBreakdown[];
}

export interface PaymentBreakdown {
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface FinanceOptions {
  carPrice: number;
  downPaymentPercent: number;
  loanTermYears: number;
  interestRate: number;
  isNewCar: boolean;
}

/**
 * חישוב תשלום חודשי לפי נוסחת המשכנתא
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  numberOfPayments: number
): number {
  if (annualRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyRate = annualRate / 12 / 100;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
  
  return numerator / denominator;
}

/**
 * חישוב פירוט תשלומים
 */
export function calculatePaymentBreakdown(
  principal: number,
  annualRate: number,
  numberOfPayments: number
): PaymentBreakdown[] {
  const breakdown: PaymentBreakdown[] = [];
  const monthlyRate = annualRate / 12 / 100;
  let remainingBalance = principal;
  
  for (let i = 1; i <= numberOfPayments; i++) {
    const interest = remainingBalance * monthlyRate;
    const payment = calculateMonthlyPayment(principal, annualRate, numberOfPayments);
    const principalPayment = payment - interest;
    
    remainingBalance -= principalPayment;
    
    breakdown.push({
      paymentNumber: i,
      payment: Math.round(payment),
      principal: Math.round(principalPayment),
      interest: Math.round(interest),
      remainingBalance: Math.max(0, Math.round(remainingBalance))
    });
  }
  
  return breakdown;
}

/**
 * חישוב מימון מלא
 */
export function calculateFinance(options: FinanceOptions): FinanceCalculation {
  const {
    carPrice,
    downPaymentPercent,
    loanTermYears,
    interestRate,
    isNewCar
  } = options;

  // חישוב מקדמה
  const downPayment = (carPrice * downPaymentPercent) / 100;
  const loanAmount = carPrice - downPayment;
  const numberOfPayments = loanTermYears * 12;
  
  // חישוב תשלום חודשי
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, numberOfPayments);
  
  // חישוב סך הכל
  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;
  
  // פירוט תשלומים
  const breakdown = calculatePaymentBreakdown(loanAmount, interestRate, numberOfPayments);
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    numberOfPayments,
    interestRate,
    breakdown
  };
}

/**
 * חישוב סכום ההלוואה
 */
export function calculateLoanAmount(carPrice: number, downPayment: number): number {
  return Math.max(0, carPrice - downPayment);
}

/**
 * חישוב מקדמה
 */
export function calculateDownPayment(carPrice: number, downPaymentPercent: number): number {
  return (carPrice * downPaymentPercent) / 100;
}

/**
 * חישוב סך הריבית
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  numberOfPayments: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, numberOfPayments);
  const totalPayment = monthlyPayment * numberOfPayments;
  return totalPayment - principal;
}

/**
 * קבלת ריבית לפי סוג רכב
 */
export function getInterestRate(isNewCar: boolean): number {
  return isNewCar ? 7 : 9;
}

/**
 * חישוב יחס החזר (DTI - Debt to Income)
 */
export function calculateDTI(
  monthlyIncome: number,
  monthlyCarPayment: number,
  otherMonthlyDebts: number = 0
): number {
  const totalMonthlyDebts = monthlyCarPayment + otherMonthlyDebts;
  return (totalMonthlyDebts / monthlyIncome) * 100;
}

/**
 * בדיקת זכאות למימון
 */
export function checkEligibility(
  monthlyIncome: number,
  monthlyCarPayment: number,
  otherMonthlyDebts: number = 0
): { eligible: boolean; dti: number; maxRecommendedPayment: number } {
  const dti = calculateDTI(monthlyIncome, monthlyCarPayment, otherMonthlyDebts);
  const maxDTI = 43; // יחס החזר מקסימלי מומלץ
  const eligible = dti <= maxDTI;
  const maxRecommendedPayment = (monthlyIncome * maxDTI / 100) - otherMonthlyDebts;
  
  return {
    eligible,
    dti: Math.round(dti * 100) / 100,
    maxRecommendedPayment: Math.round(maxRecommendedPayment)
  };
}

/**
 * חישוב עלויות נוספות
 */
export function calculateAdditionalCosts(
  carPrice: number,
  includeInsurance: boolean = true,
  includeMaintenance: boolean = true
): {
  insurance: number;
  maintenance: number;
  registration: number;
  total: number;
} {
  const insurance = includeInsurance ? carPrice * 0.03 : 0; // 3% מהמחיר
  const maintenance = includeMaintenance ? carPrice * 0.02 : 0; // 2% מהמחיר
  const registration = 1500; // רישום קבוע
  
  return {
    insurance: Math.round(insurance),
    maintenance: Math.round(maintenance),
    registration,
    total: Math.round(insurance + maintenance + registration)
  };
}

/**
 * חישוב עלות כוללת של הבעלות
 */
export function calculateTotalCostOfOwnership(
  carPrice: number,
  financeCalculation: FinanceCalculation,
  yearsOfOwnership: number = 5
): {
  totalCost: number;
  monthlyCost: number;
  breakdown: {
    carPrice: number;
    interest: number;
    insurance: number;
    maintenance: number;
    fuel: number;
    depreciation: number;
  };
} {
  const additionalCosts = calculateAdditionalCosts(carPrice);
  const fuelCost = 800 * 12 * yearsOfOwnership; // 800 ש"ח לחודש
  const depreciation = carPrice * 0.15 * yearsOfOwnership; // 15% לשנה
  
  const totalCost = carPrice + 
    financeCalculation.totalInterest + 
    additionalCosts.total * yearsOfOwnership + 
    fuelCost + 
    depreciation;
  
  const monthlyCost = totalCost / (yearsOfOwnership * 12);
  
  return {
    totalCost: Math.round(totalCost),
    monthlyCost: Math.round(monthlyCost),
    breakdown: {
      carPrice,
      interest: financeCalculation.totalInterest,
      insurance: additionalCosts.insurance * yearsOfOwnership,
      maintenance: additionalCosts.maintenance * yearsOfOwnership,
      fuel: fuelCost,
      depreciation: Math.round(depreciation)
    }
  };
}

/**
 * חישוב תשלום מקדמה מינימלי
 */
export function calculateMinimumDownPayment(carPrice: number): number {
  return Math.max(carPrice * 0.1, 10000); // 10% או 10,000 ש"ח, הגבוה מביניהם
}

/**
 * חישוב תשלום מקדמה מומלץ
 */
export function calculateRecommendedDownPayment(carPrice: number): number {
  return carPrice * 0.2; // 20% מהמחיר
}

/**
 * חישוב תקופת הלוואה מומלצת
 */
export function calculateRecommendedLoanTerm(carPrice: number): number {
  if (carPrice <= 100000) return 3;
  if (carPrice <= 200000) return 4;
  if (carPrice <= 300000) return 5;
  return 6;
}

/**
 * חישוב תשלום חודשי מקסימלי לפי הכנסה
 */
export function calculateMaxMonthlyPayment(
  monthlyIncome: number,
  otherMonthlyDebts: number = 0
): number {
  const maxDTI = 0.43; // 43% יחס החזר מקסימלי
  return (monthlyIncome * maxDTI) - otherMonthlyDebts;
}

/**
 * חישוב מחיר רכב מקסימלי לפי הכנסה
 */
export function calculateMaxCarPrice(
  monthlyIncome: number,
  downPaymentPercent: number = 20,
  loanTermYears: number = 5,
  interestRate: number = 8,
  otherMonthlyDebts: number = 0
): number {
  const maxMonthlyPayment = calculateMaxMonthlyPayment(monthlyIncome, otherMonthlyDebts);
  const numberOfPayments = loanTermYears * 12;
  const monthlyRate = interestRate / 12 / 100;
  
  // חישוב סכום הלוואה מקסימלי
  const maxLoanAmount = maxMonthlyPayment * 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1) / 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));
  
  // חישוב מחיר רכב מקסימלי
  const downPaymentRatio = downPaymentPercent / 100;
  const maxCarPrice = maxLoanAmount / (1 - downPaymentRatio);
  
  return Math.round(maxCarPrice);
}

/**
 * קבלת תנאי תשלום מומלצים
 */
export function getRecommendedPaymentTerms(carPrice: number): {
  downPaymentPercent: number;
  loanTermYears: number;
  monthlyPayment: number;
} {
  const downPaymentPercent = carPrice > 200000 ? 25 : 20;
  const loanTermYears = calculateRecommendedLoanTerm(carPrice);
  const downPayment = calculateDownPayment(carPrice, downPaymentPercent);
  const loanAmount = calculateLoanAmount(carPrice, downPayment);
  const interestRate = getInterestRate(true); // נניח רכב חדש
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears * 12);
  
  return {
    downPaymentPercent,
    loanTermYears,
    monthlyPayment: Math.round(monthlyPayment)
  };
}

/**
 * קבלת תנאי הלוואה מומלצים
 */
export function getRecommendedLoanTerms(carPrice: number): {
  minDownPayment: number;
  recommendedDownPayment: number;
  maxLoanTerm: number;
  recommendedLoanTerm: number;
} {
  return {
    minDownPayment: calculateMinimumDownPayment(carPrice),
    recommendedDownPayment: calculateRecommendedDownPayment(carPrice),
    maxLoanTerm: 7,
    recommendedLoanTerm: calculateRecommendedLoanTerm(carPrice)
  };
}
