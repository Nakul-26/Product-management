import { Request, Response } from 'express';
import { Delivery } from '../models/Delivery';
import { Payment } from '../models/Payment';
import { Product } from '../models/Product';

export const getDashboard = async (_req: Request, res: Response) => {
  const [products, lowStock, pendingPaymentsAgg, pendingDeliveries, completedRevenue] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, status: 'active' }),
    Payment.aggregate([
      { $match: { paymentStatus: 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),
    Delivery.countDocuments({ deliveryStatus: 'pending' }),
    Payment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const pendingPaymentsAmount = pendingPaymentsAgg[0]?.total ?? 0;
  const pendingPaymentsCount = pendingPaymentsAgg[0]?.count ?? 0;

  res.json({
    products,
    lowStock,
    pendingPayments: pendingPaymentsCount,
    pendingPaymentsAmount,
    pendingDeliveries,
    totalRevenue: completedRevenue[0]?.total ?? 0
  });
};
