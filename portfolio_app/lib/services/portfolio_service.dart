import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaction.dart';

class PortfolioService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Calculates Net Invested Capital (Deposits - Withdrawals)
  // Also considers 'Aportación' as Deposit and 'Retirada' as Withdrawal based on CSV types.
  Stream<double> getNetInvestedStream(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .snapshots()
        .map((snapshot) {
          double total = 0.0;
          for (var doc in snapshot.docs) {
            final tx = TransactionModel.fromFirestore(doc);
            final type = tx.type;

            // Valid types from TransactionModel (Single Source of Truth)
            if (TransactionModel.validTypes.any(
              (t) => t.toLowerCase() == type.toLowerCase(),
            )) {
              total += tx.amount;
            }
          }
          return total;
        });
  }

  // Alternative: Sum of all current assets * cost (if we assume price = cost for now)
  // But let's stick to the Plan: Net Invested.
  // Actually, checking the CSV types... 'Aportación' is what we want.
  // We'll also include 'Plan' as potentially an investment entry?
  // Let's keep it simple: Deposits - Withdrawals.
}
