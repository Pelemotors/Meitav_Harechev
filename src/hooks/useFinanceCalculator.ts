import { useState, useMemo } from 'react';

export interface FinanceOptions {
  loanAmount: number;
  downPayment: number;
  annualInterestRate: number; // בריבית שנתית (למשל 0.08 עבור 8%)
  loanTermMonths: number; // תקופת הלוואה בחודשים (20-100)
}

export interface FinanceCalculation {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  loanAmount: number;
  downPayment: number;
}

export const useFinanceCalculator = () => {
  const [options, setOptions] = useState<FinanceOptions>({
    loanAmount: 0,
    downPayment: 0,
    annualInterestRate: 0.08, // 8% ברירת מחדל
    loanTermMonths: 60 // 60 חודשים ברירת מחדל (5 שנים)
  });

  const calculation = useMemo((): FinanceCalculation => {
    const { loanAmount, downPayment, annualInterestRate, loanTermMonths } = options;
    
    // סכום ההלוואה לאחר מקדמה
    const actualLoanAmount = loanAmount - downPayment;
    
    if (actualLoanAmount <= 0) {
      return {
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        loanAmount,
        downPayment
      };
    }

    // חישוב החזר חודשי
    const monthlyInterestRate = annualInterestRate / 12;
    const numberOfPayments = loanTermMonths;

    let monthlyPayment = 0;
    let totalPayments = 0;
    let totalInterest = 0;

    if (monthlyInterestRate === 0) {
      // ללא ריבית
      monthlyPayment = actualLoanAmount / numberOfPayments;
      totalPayments = actualLoanAmount;
      totalInterest = 0;
    } else {
      // עם ריבית
      monthlyPayment = actualLoanAmount * 
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      
      totalPayments = monthlyPayment * numberOfPayments;
      totalInterest = totalPayments - actualLoanAmount;
    }

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayments: Math.round(totalPayments),
      totalInterest: Math.round(totalInterest),
      loanAmount,
      downPayment
    };
  }, [options]);

  const updateLoanAmount = (amount: number) => {
    setOptions(prev => ({ ...prev, loanAmount: amount }));
  };

  const updateDownPayment = (payment: number) => {
    setOptions(prev => ({ ...prev, downPayment: payment }));
  };

  const updateInterestRate = (rate: number) => {
    setOptions(prev => ({ ...prev, annualInterestRate: rate / 100 }));
  };

  const updateLoanTerm = (months: number) => {
    setOptions(prev => ({ ...prev, loanTermMonths: months }));
  };

  const resetToDefaults = () => {
    setOptions({
      loanAmount: 0,
      downPayment: 0,
      annualInterestRate: 0.08,
      loanTermMonths: 60
    });
  };

  return {
    options,
    calculation,
    updateLoanAmount,
    updateDownPayment,
    updateInterestRate,
    updateLoanTerm,
    resetToDefaults
  };
};

export default useFinanceCalculator;
