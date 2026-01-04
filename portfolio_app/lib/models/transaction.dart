import 'package:cloud_firestore/cloud_firestore.dart';

class TransactionModel {
  final String id;
  final String userId;
  final double amount;
  final String description;
  final String assetId; // Link to AssetModel
  final DateTime date;
  final String type; // 'buy' or 'sell' usually, or 'credit'/'debit'

  TransactionModel({
    required this.id,
    required this.userId,
    required this.amount,
    required this.description,
    this.assetId = '',
    required this.date,
    required this.type,
  });

  factory TransactionModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

    DateTime date = DateTime.now();
    if (data['date'] is Timestamp) {
      date = (data['date'] as Timestamp).toDate();
    }

    return TransactionModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      amount: (data['amount'] ?? 0.0).toDouble(),
      description: data['description'] ?? '',
      assetId: data['assetId'] ?? '',
      date: date,
      type: data['type'] ?? 'unknown',
    );
  }

  static const List<String> validTypes = [
    'Plan',
    'Aportación',
    'Retirada',
    'Dividendo',
    'Traspaso',
    'Venta',
  ];

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'amount': amount,
      'description': description,
      'assetId': assetId,
      'date': date,
      'type': type,
    };
  }
}
