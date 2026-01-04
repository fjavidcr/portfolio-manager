import 'package:cloud_firestore/cloud_firestore.dart';

class PlatformModel {
  final String id;
  final String name;
  final String iconUrl;

  PlatformModel({required this.id, required this.name, this.iconUrl = ''});

  factory PlatformModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return PlatformModel(
      id: doc.id,
      name: data['name'] ?? '',
      iconUrl: data['iconUrl'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {'name': name, 'iconUrl': iconUrl};
  }
}
