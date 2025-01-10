const { z } = require('zod');

const walletTransactionValidation = z.object({
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId").nonempty(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  type: z.enum(['CREDIT', 'DEBIT']),
  amount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().min(1, 'Description is required'),
  date: z.date().default(() => new Date()) 
});

const walletValidation = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId").nonempty(),
  balance: z.number().min(0, "Balance must be a positive number").default(0),
});

module.exports = {
  walletTransactionValidation,
  walletValidation
};
