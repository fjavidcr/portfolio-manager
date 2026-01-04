import 'package:cloud_firestore/cloud_firestore.dart';

class AssetModel {
  final String id; // This will be the ticker/symbol e.g., "AAPL" or "bitcoin"
  final String name;
  final String type; // 'Stock', 'Crypto', 'ETF', etc.

  AssetModel({required this.id, required this.name, required this.type});

  factory AssetModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return AssetModel(
      id: doc.id,
      name: data['name'] ?? '',
      type: data['type'] ?? 'General',
    );
  }

  Map<String, dynamic> toMap() {
    return {'name': name, 'type': type};
  }
}
