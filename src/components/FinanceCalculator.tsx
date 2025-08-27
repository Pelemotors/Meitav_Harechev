import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Calendar, Percent, AlertCircle } from 'lucide-react';
import { Button, Card, Badge } from './ui';
import { calculateMonthlyPayment, calculatePaymentBreakdown, calculateTotalInterest, calculateDownPayment, calculateLoanAmount, getInterestRate, calculateDTI, checkEligibility, calculateAdditionalCosts, calculateTotalCostOfOwnership, getRecommendedPaymentTerms, getRecommendedLoanTerms, calculateMaxCarPrice } from '../utils/finance';

interface FinanceCalculatorProps {
  carPrice: number;
  className?: string;
}

const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({ carPrice, className = '' }) => {
  const [downPayment, setDownPayment] = useState<number>(carPrice * 0.2);
  const [loanTerm, setLoanTerm] = useState<number>(60);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(15000);
  const [existingDebts, setExistingDebts] = useState<number>(0);
  const [isNewCar, setIsNewCar] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const interestRate = getInterestRate(isNewCar);
  const loanAmount = calculateLoanAmount(carPrice, downPayment);
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
  const totalInterest = calculateTotalInterest(loanAmount, interestRate, loanTerm);
  const paymentBreakdown = calculatePaymentBreakdown(loanAmount, interestRate, loanTerm);
  const dti = calculateDTI(monthlyIncome, monthlyPayment, existingDebts);
  const eligibility = checkEligibility(monthlyIncome, monthlyPayment, existingDebts);
  const additionalCosts = calculateAdditionalCosts(carPrice);
  const financeCalculation = {
    monthlyPayment,
    totalPayment: monthlyPayment * loanTerm,
    totalInterest,
    downPayment,
    loanAmount,
    numberOfPayments: loanTerm,
    interestRate,
    breakdown: paymentBreakdown
  };
  const totalCostOfOwnership = calculateTotalCostOfOwnership(carPrice, financeCalculation);
  const recommendedPaymentTerms = getRecommendedPaymentTerms(carPrice);
  const recommendedLoanTerms = getRecommendedLoanTerms(carPrice);
  const maxCarPrice = calculateMaxCarPrice(monthlyIncome, 20, loanTerm / 12, interestRate, existingDebts);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getDTIColor = (dti: number) => {
    if (dti <= 28) return 'text-slc-success';
    if (dti <= 36) return 'text-slc-warning';
    return 'text-slc-error';
  };

  const getDTILabel = (dti: number) => {
    if (dti <= 28) return 'מצוין';
    if (dti <= 36) return 'טוב';
    return 'גבוה מדי';
  };

  const isEligible = eligibility.eligible;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-slc-bronze" />
        <h3 className="heading-2 text-slc-dark hebrew">מחשבון מימון</h3>
      </div>

      {/* Basic Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">פרטי המימון</h4>
          
          <div className="space-y-4">
            {/* Car Price */}
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                מחיר הרכב
              </label>
              <div className="text-2xl font-bold text-slc-dark price-text">
                {formatCurrency(carPrice)}
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                מקדמה
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={carPrice * 0.1}
                  max={carPrice * 0.8}
                  step={1000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slc-dark min-w-[80px]">
                  {formatCurrency(downPayment)}
                </span>
              </div>
              <div className="text-xs text-slc-gray mt-1 hebrew">
                {formatPercentage((downPayment / carPrice) * 100)} מהמחיר
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                תקופת הלוואה (חודשים)
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="input-field w-full"
              >
                <option value={36}>36 חודשים (3 שנים)</option>
                <option value={48}>48 חודשים (4 שנים)</option>
                <option value={60}>60 חודשים (5 שנים)</option>
                <option value={72}>72 חודשים (6 שנים)</option>
                <option value={84}>84 חודשים (7 שנים)</option>
              </select>
            </div>

            {/* Car Type */}
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                סוג רכב
              </label>
              <div className="flex gap-2">
                <Button
                  variant={isNewCar ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsNewCar(true)}
                >
                  רכב חדש
                </Button>
                <Button
                  variant={!isNewCar ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsNewCar(false)}
                >
                  רכב משומש
                </Button>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slc-bronze hover:text-slc-bronze"
              >
                {showAdvanced ? 'הסתר' : 'הצג'} אפשרויות מתקדמות
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-slc-light-gray">
                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    הכנסה חודשית
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="input-field w-full"
                    placeholder="הכנסה חודשית"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    חובות קיימים (חודשי)
                  </label>
                  <input
                    type="number"
                    value={existingDebts}
                    onChange={(e) => setExistingDebts(Number(e.target.value))}
                    className="input-field w-full"
                    placeholder="חובות קיימים"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Results Section */}
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">סיכום המימון</h4>
          
          <div className="space-y-4">
            {/* Monthly Payment */}
            <div className="text-center p-4 bg-slc-bronze/10 rounded-lg">
              <div className="text-sm text-slc-gray hebrew mb-1">תשלום חודשי</div>
              <div className="text-3xl font-bold text-slc-bronze price-text">
                {formatCurrency(monthlyPayment)}
              </div>
            </div>

            {/* Key Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">סכום הלוואה:</span>
                <span className="font-medium text-slc-dark">{formatCurrency(loanAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">ריבית:</span>
                <span className="font-medium text-slc-dark">{formatPercentage(interestRate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">סה"כ ריבית:</span>
                <span className="font-medium text-slc-dark">{formatCurrency(totalInterest)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">סה"כ לתשלום:</span>
                <span className="font-medium text-slc-dark">{formatCurrency(loanAmount + totalInterest)}</span>
              </div>
            </div>

            {/* Eligibility Check */}
            {showAdvanced && (
              <div className="p-4 border border-slc-light-gray rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slc-gray hebrew">יחס חוב להכנסה:</span>
                  <Badge variant={isEligible ? 'success' : 'error'} size="sm">
                    {getDTILabel(dti)}
                  </Badge>
                </div>
                <div className={`text-lg font-bold ${getDTIColor(dti)}`}>
                  {formatPercentage(dti)}
                </div>
                <div className="text-xs text-slc-gray mt-1 hebrew">
                  {isEligible ? 'מתאים למימון' : 'יחס חוב גבוה מדי'}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card className="p-6">
        <h4 className="heading-3 text-slc-dark mb-4 hebrew">פירוט תשלומים</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slc-light-gray">
              <tr>
                <th className="text-right p-3 hebrew">שנה</th>
                <th className="text-center p-3 hebrew">תשלום חודשי</th>
                <th className="text-center p-3 hebrew">תשלום שנתי</th>
                <th className="text-center p-3 hebrew">ריבית שנתית</th>
                <th className="text-center p-3 hebrew">קרן שנתית</th>
                <th className="text-center p-3 hebrew">יתרה</th>
              </tr>
            </thead>
            <tbody>
              {paymentBreakdown.map((year, index) => (
                <tr key={index} className="border-b border-slc-light-gray">
                  <td className="text-right p-3 hebrew">{index + 1}</td>
                  <td className="text-center p-3">{formatCurrency(year.monthlyPayment)}</td>
                  <td className="text-center p-3">{formatCurrency(year.yearlyPayment)}</td>
                  <td className="text-center p-3">{formatCurrency(year.yearlyInterest)}</td>
                  <td className="text-center p-3">{formatCurrency(year.yearlyPrincipal)}</td>
                  <td className="text-center p-3">{formatCurrency(year.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Costs */}
      <Card className="p-6">
        <h4 className="heading-3 text-slc-dark mb-4 hebrew">עלויות נוספות</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(additionalCosts).map(([key, value]) => (
            <div key={key} className="text-center p-4 border border-slc-light-gray rounded-lg">
              <div className="text-sm text-slc-gray hebrew mb-2">
                {key === 'insurance' ? 'ביטוח' :
                 key === 'maintenance' ? 'תחזוקה' :
                 key === 'registration' ? 'רישוי' :
                 key === 'fuel' ? 'דלק' : key}
              </div>
              <div className="text-lg font-bold text-slc-dark">
                {formatCurrency(value)}
              </div>
              <div className="text-xs text-slc-gray hebrew">לשנה</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-slc-bronze/10 rounded-lg text-center">
          <div className="text-sm text-slc-gray hebrew mb-2">סה"כ עלות בעלות (5 שנים)</div>
          <div className="text-2xl font-bold text-slc-bronze price-text">
            {formatCurrency(totalCostOfOwnership)}
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h4 className="heading-3 text-slc-dark mb-4 hebrew">המלצות</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="heading-4 text-slc-dark mb-3 hebrew">המלצות מקדמה</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">מינימום מומלץ:</span>
                <span className="font-medium text-slc-dark">
                  {formatCurrency(recommendedPaymentTerms.minDownPayment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">מומלץ:</span>
                <span className="font-medium text-slc-dark">
                  {formatCurrency(recommendedPaymentTerms.recommendedDownPayment)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="heading-4 text-slc-dark mb-3 hebrew">המלצות תקופת הלוואה</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">מינימום מומלץ:</span>
                <span className="font-medium text-slc-dark">
                  {recommendedLoanTerms.minLoanTerm} חודשים
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slc-gray hebrew">מומלץ:</span>
                <span className="font-medium text-slc-dark">
                  {recommendedLoanTerms.recommendedLoanTerm} חודשים
                </span>
              </div>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-6 p-4 bg-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-slc-warning" />
              <h5 className="heading-4 text-slc-dark hebrew">מחיר מקסימלי מומלץ</h5>
            </div>
            <div className="text-lg font-bold text-slc-dark">
              {formatCurrency(maxCarPrice)}
            </div>
            <div className="text-sm text-slc-gray hebrew mt-1">
              בהתבסס על הכנסתך וחובותיך הנוכחיים
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="primary" className="flex-1">
          <DollarSign className="w-4 h-4 ml-2" />
          הגש בקשה למימון
        </Button>
        
        <Button variant="outline" className="flex-1">
          <TrendingUp className="w-4 h-4 ml-2" />
          השוואת הצעות
        </Button>
      </div>
    </div>
  );
};

export default FinanceCalculator;
