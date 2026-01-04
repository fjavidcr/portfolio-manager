import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../models/asset.dart';
import '../models/transaction.dart';
import '../services/asset_service.dart';
import '../services/transaction_service.dart';

class AssetSummaryScreen extends StatefulWidget {
  const AssetSummaryScreen({super.key});

  @override
  State<AssetSummaryScreen> createState() => _AssetSummaryScreenState();
}

class _AssetSummaryScreenState extends State<AssetSummaryScreen> {
  final AssetService _assetService = AssetService();
  final TransactionService _transactionService = TransactionService();
  final String _uid = FirebaseAuth.instance.currentUser?.uid ?? '';

  @override
  Widget build(BuildContext context) {
    if (_uid.isEmpty) {
      return const Scaffold(
        body: Center(child: Text("Por favor, inicia sesión")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resumen de Activos'),
        centerTitle: true,
      ),
      body: StreamBuilder<List<AssetModel>>(
        stream: _assetService.getUserAssets(_uid),
        builder: (context, assetSnapshot) {
          if (assetSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (assetSnapshot.hasError) {
            return Center(child: Text('Error: ${assetSnapshot.error}'));
          }

          final assets = assetSnapshot.data ?? [];

          return StreamBuilder<List<TransactionModel>>(
            stream: _transactionService.getUserTransactions(_uid),
            builder: (context, txSnapshot) {
              if (txSnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (txSnapshot.hasError) {
                return Center(child: Text('Error: ${txSnapshot.error}'));
              }

              final transactions = txSnapshot.data ?? [];

              // Calculate total invested per asset
              Map<String, double> assetInvested = {};
              for (var tx in transactions) {
                if (tx.assetId.isNotEmpty) {
                  assetInvested[tx.assetId] =
                      (assetInvested[tx.assetId] ?? 0.0) + tx.amount;
                }
              }

              // Split assets into active and archived
              final activeAssets = assets.where((a) {
                final invested = assetInvested[a.id] ?? 0.0;
                return invested.abs() > 0.01; // Avoid floating point issues
              }).toList();

              final archivedAssets = assets.where((a) {
                final invested = assetInvested[a.id] ?? 0.0;
                return invested.abs() <= 0.01;
              }).toList();

              return ListView(
                padding: const EdgeInsets.symmetric(vertical: 16),
                children: [
                  if (activeAssets.isEmpty && archivedAssets.isEmpty)
                    const Center(child: Text("No hay activos disponibles")),

                  if (activeAssets.isNotEmpty)
                    Center(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columnSpacing: 15,
                          horizontalMargin: 16,
                          columns: const [
                            DataColumn(label: Text('Activo')),
                            DataColumn(label: Text('Invertido')),
                            DataColumn(label: Text('Actual')),
                            DataColumn(label: Text('ROI')),
                            DataColumn(label: Text('Actualizado')),
                            DataColumn(label: Text('')),
                          ],
                          rows: activeAssets.map((asset) {
                            final invested = assetInvested[asset.id] ?? 0.0;
                            return _buildDataRow(asset, invested);
                          }).toList(),
                        ),
                      ),
                    ),

                  if (archivedAssets.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Theme(
                      data: Theme.of(
                        context,
                      ).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        title: Text(
                          "Archivados (${archivedAssets.length})",
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        children: [
                          Center(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                columnSpacing: 15,
                                horizontalMargin: 16,
                                columns: const [
                                  DataColumn(label: Text('Activo')),
                                  DataColumn(label: Text('Invertido')),
                                  DataColumn(label: Text('Actual')),
                                  DataColumn(label: Text('ROI')),
                                  DataColumn(label: Text('Actualizado')),
                                  DataColumn(label: Text('')),
                                ],
                                rows: archivedAssets.map((asset) {
                                  final invested =
                                      assetInvested[asset.id] ?? 0.0;
                                  return _buildDataRow(asset, invested);
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              );
            },
          );
        },
      ),
    );
  }

  DataRow _buildDataRow(AssetModel asset, double invested) {
    final currentValue = asset.currentValue;
    final roiEur = currentValue - invested;
    final roiPercent = invested != 0 ? (roiEur / invested) * 100 : 0.0;
    final roiColor = roiEur >= 0 ? Colors.green : Colors.red;
    Color dateColor = Colors.grey;
    if (asset.lastUpdated == null) {
      dateColor = Colors.red;
    } else {
      final difference = DateTime.now().difference(asset.lastUpdated!).inDays;
      if (difference >= 30) {
        dateColor = Colors.red;
      } else if (difference >= 15) {
        dateColor = Colors.orange;
      }
    }

    final lastUpdatedStr = asset.lastUpdated != null
        ? DateFormat('dd/MM/yy').format(asset.lastUpdated!)
        : 'Nunca';

    return DataRow(
      cells: [
        DataCell(
          Text(asset.name, style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
        DataCell(Text("${invested.toStringAsFixed(2)} €")),
        DataCell(Text("${currentValue.toStringAsFixed(2)} €")),
        DataCell(
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "${roiEur >= 0 ? '+' : ''}${roiEur.toStringAsFixed(1)}€",
                style: TextStyle(
                  color: roiColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                "${roiEur >= 0 ? '+' : ''}${roiPercent.toStringAsFixed(1)}%",
                style: TextStyle(color: roiColor, fontSize: 10),
              ),
            ],
          ),
        ),
        DataCell(
          Row(
            children: [
              if (dateColor != Colors.grey)
                Icon(Icons.warning_amber_rounded, size: 14, color: dateColor),
              if (dateColor != Colors.grey) const SizedBox(width: 4),
              Text(
                lastUpdatedStr,
                style: TextStyle(
                  fontSize: 10,
                  color: dateColor,
                  fontWeight: dateColor != Colors.grey
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
        DataCell(
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.blue, size: 18),
            onPressed: () => _editCurrentValue(asset),
          ),
        ),
      ],
    );
  }

  void _editCurrentValue(AssetModel asset) {
    final TextEditingController controller = TextEditingController(
      text: asset.currentValue.toString(),
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Actualizar valor de ${asset.name}"),
          content: TextField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              suffixText: "€",
              labelText: "Nuevo valor",
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancelar"),
            ),
            ElevatedButton(
              onPressed: () async {
                final newValue = double.tryParse(controller.text);
                if (newValue != null) {
                  await _assetService.updateAssetValue(
                    _uid,
                    asset.id,
                    newValue,
                  );
                  if (mounted) Navigator.pop(context);
                }
              },
              child: const Text("Guardar"),
            ),
          ],
        );
      },
    );
  }
}
