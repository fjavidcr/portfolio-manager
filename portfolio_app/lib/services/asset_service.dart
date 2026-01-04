import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/asset.dart';

class AssetService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get stream of assets for a user
  Stream<List<AssetModel>> getUserAssets(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('assets')
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return AssetModel.fromFirestore(doc);
          }).toList();
        });
  }

  // Add a new asset
  Future<void> addAsset(String uid, AssetModel asset) {
    // We use set() with asset.id because we want the ID to be the ticker (if possible)
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('assets')
        .doc(asset.id)
        .set(asset.toMap());
  }

  // Update asset current value
  Future<void> updateAssetValue(String uid, String assetId, double newValue) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('assets')
        .doc(assetId)
        .update({
          'currentValue': newValue,
          'lastUpdated': FieldValue.serverTimestamp(),
        });
  }

  // Update full asset data
  Future<void> updateAsset(String uid, AssetModel asset) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('assets')
        .doc(asset.id)
        .update(asset.toMap());
  }

  // Delete an asset
  Future<void> deleteAsset(String uid, String assetId) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('assets')
        .doc(assetId)
        .delete();
  }
}
