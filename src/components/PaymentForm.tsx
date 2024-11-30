import { useState, useEffect } from 'react';

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: string;
  onPaymentError: string;
}

type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

declare global {
  interface Window {
    handlePaymentSuccess: (paymentId: string) => void;
    handlePaymentError: (error: string) => void;
  }
}

const PaymentForm = ({ amount, onPaymentSuccess, onPaymentError }: PaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cardType, setCardType] = useState<CardType>('unknown');

  const detectCardType = (number: string): CardType => {
    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.match(/^4/)) return 'visa';
    if (cleanNumber.match(/^5[1-5]/)) return 'mastercard';
    if (cleanNumber.match(/^3[47]/)) return 'amex';
    if (cleanNumber.match(/^6(?:011|5)/)) return 'discover';
    return 'unknown';
  };

  useEffect(() => {
    setCardType(detectCardType(cardNumber));
  }, [cardNumber]);

  const getCardTypeIcon = (type: CardType) => {
    switch (type) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳';
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    console.log('Starting payment processing...');

    try {
      // Simulate payment processing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Payment processing complete');

      // For mock transactions, always succeed
      const mockPaymentId = 'py_' + Math.random().toString(36).substr(2, 9);
      console.log('Generated mock payment ID:', mockPaymentId);
      
      setProcessing(false);
      console.log('Processing state cleared');
      
      // Call the global function by name
      if (typeof window[onPaymentSuccess] === 'function') {
        console.log('Calling payment success handler');
        window[onPaymentSuccess](mockPaymentId);
      } else {
        console.error('Payment success handler not found:', onPaymentSuccess);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setProcessing(false);
      
      // Call the global error handler by name
      if (typeof window[onPaymentError] === 'function') {
        window[onPaymentError](error instanceof Error ? error.message : 'Payment failed');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Payment Details</h2>
        <p className="text-gray-400">Total Amount: ${amount.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-1">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
            {cardType !== 'unknown' && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {getCardTypeIcon(cardType)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-1">
              CVV
            </label>
            <input
              type="text"
              id="cvv"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, cardType === 'amex' ? 4 : 3))}
              placeholder={cardType === 'amex' ? '1234' : '123'}
              maxLength={cardType === 'amex' ? 4 : 3}
              className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={processing}
            className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-all relative ${
              processing
                ? 'bg-gray-600 cursor-not-allowed opacity-80'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing Payment...
              </div>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            We accept Visa, Mastercard, American Express, and Discover
          </p>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
