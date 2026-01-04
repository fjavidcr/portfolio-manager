import 'package:cloud_firestore/cloud_firestore.dart';

class AssetModel {
  final String id; // This will be the ticker/symbol e.g., "AAPL" or "bitcoin"
  final String name;
  final String type; // 'Stock', 'Crypto', 'ETF', etc.
  final double currentValue;
  final DateTime? lastUpdated;

  AssetModel({
    required this.id,
    required this.name,
    required this.type,
    this.currentValue = 0.0,
    this.lastUpdated,
  });

  factory AssetModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

    DateTime? lastUpdated;
    if (data['lastUpdated'] is Timestamp) {
      lastUpdated = (data['lastUpdated'] as Timestamp).toDate();
    }

    return AssetModel(
      id: doc.id,
      name: data['name'] ?? '',
      type: data['type'] ?? 'General',
      currentValue: (data['currentValue'] ?? 0.0).toDouble(),
      lastUpdated: lastUpdated,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'type': type,
      'currentValue': currentValue,
      'lastUpdated': lastUpdated != null
          ? Timestamp.fromDate(lastUpdated!)
          : null,
    };
  }
}
