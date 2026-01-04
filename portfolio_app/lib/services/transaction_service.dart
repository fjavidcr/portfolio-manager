import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaction.dart';

class TransactionService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<List<TransactionModel>> getUserTransactions(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return TransactionModel.fromFirestore(doc);
          }).toList();
        });
  }

  Future<void> addTransaction(String uid, TransactionModel transaction) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .add(transaction.toMap());
  }
}
