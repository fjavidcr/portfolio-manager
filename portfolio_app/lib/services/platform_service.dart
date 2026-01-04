import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/platform.dart';

class PlatformService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<List<PlatformModel>> getUserPlatforms(String uid) {
    return _firestore
        .collection('users') // Store platforms under user scope? Or global?
        .doc(uid) // Let's stick to user scope for now as per plan
        .collection('platforms')
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return PlatformModel.fromFirestore(doc);
          }).toList();
        });
  }

  Future<void> addPlatform(String uid, PlatformModel platform) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('platforms')
        .doc(platform.id.isEmpty ? null : platform.id) // Auto-ID if empty
        .set(platform.toMap());
  }
}
