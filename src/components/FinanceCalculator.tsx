import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useFinanceCalculator } from '../hooks/useFinanceCalculator';

interface FinanceCalculatorProps {
  initialPrice?: number;
  carPrice?: number; // מחיר הרכב מהעמוד
  onCalculationChange?: (calculation: any) => void;
}

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({
  initialPrice = 0,
  carPrice,
  onCalculationChange
}) => {
  const {
    options,
    calculation,
    updateLoanAmount,
    updateDownPayment,
    updateInterestRate,
    updateLoanTerm,
    resetToDefaults
  } = useFinanceCalculator();

  React.useEffect(() => {
    const priceToUse = carPrice || initialPrice;
    if (priceToUse > 0) {
      updateLoanAmount(priceToUse);
    }
  }, [carPrice, initialPrice, updateLoanAmount]);

  React.useEffect(() => {
    if (onCalculationChange) {
      onCalculationChange(calculation);
    }
  }, [calculation, onCalculationChange]);

  return (
        <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">המימון הנכון בשבילך</h3>
          <p className="text-gray-600">אחד הדברים החשובים בקניית רכב הוא המימון. אנחנו במיטב הרכב עובדים מול כל חברות המימון הגדולות, כדי למצוא בשבילכם את הריבית הכי משתלמת בשוק.</p>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* מחיר הרכב */}
            <div>
            <label htmlFor="carPrice" className="block text-sm font-medium text-gray-700 mb-2">
              מחיר הרכב (₪)
              </label>
                <input
              type="number"
              id="carPrice"
              value={options.loanAmount}
              onChange={(e) => updateLoanAmount(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            </div>

          {/* מקדמה */}
            <div>
            <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-2">
              מקדמה (₪)
                  </label>
                  <input
                    type="number"
              id="downPayment"
              value={options.downPayment}
              onChange={(e) => updateDownPayment(parseInt(e.target.value) || 0)}
              min="0"
              max={options.loanAmount}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

          {/* ריבית שנתית */}
                <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
              ריבית שנתית (%)
                  </label>
                  <input
                    type="number"
              id="interestRate"
              value={(options.annualInterestRate * 100).toFixed(2)}
              onChange={(e) => updateInterestRate(parseFloat(e.target.value) || 0)}
              min="0"
              max="50"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

          {/* תקופת הלוואה */}
          <div>
            <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-2">
              תקופת הלוואה: {Math.round(options.loanTermMonths / 12)} שנים ({options.loanTermMonths} חודשים)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                id="loanTerm"
                min="20"
                max="100"
                step="1"
                value={options.loanTermMonths}
                onChange={(e) => updateLoanTerm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>20 חודשים</span>
                <span>100 חודשים</span>
              </div>
            </div>
              </div>
            </div>

        {/* תוצאות החישוב */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">תוצאות החישוב</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 mb-1">החזר חודשי</div>
              <div className="text-2xl font-bold text-blue-900">
                ₪{calculation.monthlyPayment.toLocaleString()}
              </div>
              </div>
              
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 mb-1">סכום הלוואה</div>
              <div className="text-xl font-semibold text-blue-900">
                ₪{(calculation.loanAmount - calculation.downPayment).toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 mb-1">סה"כ תשלומים</div>
              <div className="text-xl font-semibold text-blue-900">
                ₪{calculation.totalPayments.toLocaleString()}
                </div>
      </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 mb-1">סה"כ ריבית</div>
              <div className="text-xl font-semibold text-blue-900">
                ₪{calculation.totalInterest.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-blue-700">
            <p><strong>הערה:</strong> החישוב הוא הערכה בלבד. התנאים הסופיים יקבעו על ידי הבנק או חברת המימון.</p>
            <p className="mt-2 text-blue-700"><strong>רוצים לדעת כמה תשלמו בחודש? תשאירו פרטים ואנחנו נחזור אליכם עם הצעה מותאמת אישית.</strong></p>
          </div>
        </div>

        {/* כפתור איפוס */}
        <div className="text-center">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            איפוס חישוב
        </Button>
      </div>
    </div>
    </Card>
  );
};

export default FinanceCalculator;
