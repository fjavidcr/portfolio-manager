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

  Future<void> updateTransaction(String uid, TransactionModel transaction) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transaction.id)
        .update(transaction.toMap());
  }

  Future<void> deleteTransaction(String uid, String transactionId) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transactionId)
        .delete();
  }

  Future<QuerySnapshot<Map<String, dynamic>>> getTransactionsPage(
    String uid, {
    int limit = 20,
    DocumentSnapshot? startAfter,
  }) {
    Query<Map<String, dynamic>> query = _firestore
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .orderBy('date', descending: true);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    return query.limit(limit).get();
  }
}
