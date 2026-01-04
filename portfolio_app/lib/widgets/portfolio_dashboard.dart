import 'package:flutter/material.dart';
import '../models/asset.dart';
import '../models/transaction.dart';
import '../services/asset_service.dart';
import '../services/transaction_service.dart';

class PortfolioDashboard extends StatelessWidget {
  final String uid;

  const PortfolioDashboard({super.key, required this.uid});

  @override
  Widget build(BuildContext context) {
    final AssetService assetService = AssetService();
    final TransactionService transactionService = TransactionService();

    return StreamBuilder<List<AssetModel>>(
      stream: assetService.getUserAssets(uid),
      builder: (context, assetSnapshot) {
        if (!assetSnapshot.hasData) return const SizedBox(height: 100);

        return StreamBuilder<List<TransactionModel>>(
          stream: transactionService.getUserTransactions(uid),
          builder: (context, txSnapshot) {
            if (!txSnapshot.hasData) return const SizedBox(height: 100);

            final assets = assetSnapshot.data ?? [];
            final transactions = txSnapshot.data ?? [];

            // Calculate total invested per asset
            Map<String, double> assetInvested = {};
            for (var tx in transactions) {
              if (tx.assetId.isNotEmpty) {
                assetInvested[tx.assetId] =
                    (assetInvested[tx.assetId] ?? 0.0) + tx.amount;
              }
            }

            // Calculate global stats
            double totalInvested = 0;
            double totalCurrent = 0;
            int activeAssetsCount = 0;
            for (var asset in assets) {
              final invested = assetInvested[asset.id] ?? 0.0;
              totalInvested += invested;
              totalCurrent += asset.currentValue;
              if (invested.abs() > 0.01) {
                activeAssetsCount++;
              }
            }
            final totalRoiEur = totalCurrent - totalInvested;
            final totalRoiPercent = totalInvested != 0
                ? (totalRoiEur / totalInvested) * 100
                : 0.0;

            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildStatCard(
                    "Activos",
                    "$activeAssetsCount",
                    Icons.inventory_2_outlined,
                    [Colors.orange.shade700, Colors.orange.shade400],
                  ),
                  _buildStatCard(
                    "Invertido",
                    "${totalInvested.toStringAsFixed(0)}€",
                    Icons.account_balance_wallet,
                    [Colors.blue.shade700, Colors.blue.shade400],
                  ),
                  _buildStatCard(
                    "Valor Actual",
                    "${totalCurrent.toStringAsFixed(0)}€",
                    Icons.show_chart,
                    [Colors.purple.shade700, Colors.purple.shade400],
                  ),
                  _buildStatCard(
                    "ROI Total",
                    "${totalRoiEur >= 0 ? '+' : ''}${totalRoiEur.toStringAsFixed(0)}€",
                    totalRoiEur >= 0 ? Icons.trending_up : Icons.trending_down,
                    totalRoiEur >= 0
                        ? [Colors.green.shade700, Colors.green.shade400]
                        : [Colors.red.shade700, Colors.red.shade400],
                    subtitle: "${totalRoiPercent.toStringAsFixed(1)}%",
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    List<Color> gradient, {
    String? subtitle,
  }) {
    return Container(
      width: 160,
      height: 100,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradient[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              Icon(icon, color: Colors.white, size: 20),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
