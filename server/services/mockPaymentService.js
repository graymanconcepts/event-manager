// Mock payment service to simulate payment processing

class MockPaymentService {
  constructor() {
    this.successRate = 0.9; // 90% success rate for payments
    this.processingTime = 1000; // 1 second processing time
  }

  async processPayment(amount, currency = 'USD') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.processingTime));

    // Simulate success/failure
    if (Math.random() < this.successRate) {
      return {
        success: true,
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Payment processing failed');
    }
  }

  async processRefund(transactionId, amount, currency = 'USD') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.processingTime));

    // Simulate success/failure (higher success rate for refunds)
    if (Math.random() < 0.95) {
      return {
        success: true,
        refundId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalTransactionId: transactionId,
        amount,
        currency,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Refund processing failed');
    }
  }

  async getTransactionStatus(transactionId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.processingTime / 2));

    return {
      transactionId,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }
}

export default new MockPaymentService();
