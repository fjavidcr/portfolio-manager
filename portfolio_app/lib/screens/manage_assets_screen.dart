import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/asset.dart';
import '../models/platform.dart';
import '../services/asset_service.dart';
import '../services/platform_service.dart';
import '../services/transaction_service.dart';

class ManageAssetsScreen extends StatefulWidget {
  const ManageAssetsScreen({super.key});

  @override
  State<ManageAssetsScreen> createState() => _ManageAssetsScreenState();
}

class _ManageAssetsScreenState extends State<ManageAssetsScreen> {
  final AssetService _assetService = AssetService();
  final PlatformService _platformService = PlatformService();
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
      appBar: AppBar(title: const Text('Gestionar Activos'), centerTitle: true),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAssetDialog(),
        child: const Icon(Icons.add),
      ),
      body: StreamBuilder<List<AssetModel>>(
        stream: _assetService.getUserAssets(_uid),
        builder: (context, assetSnapshot) {
          if (assetSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final assets = assetSnapshot.data ?? [];

          return StreamBuilder<List<PlatformModel>>(
            stream: _platformService.getUserPlatforms(_uid),
            builder: (context, platformSnapshot) {
              if (platformSnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              final platforms = platformSnapshot.data ?? [];
              final platformMap = {for (var p in platforms) p.id: p.name};

              if (assets.isEmpty) {
                return const Center(child: Text("No hay activos. ¡Añade uno!"));
              }

              return ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: assets.length,
                itemBuilder: (context, index) {
                  final asset = assets[index];
                  final platformName =
                      platformMap[asset.platformId] ?? 'Sin plataforma';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: _getTypeColor(asset.type).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getTypeIcon(asset.type),
                              color: _getTypeColor(asset.type),
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      asset.id,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color: Theme.of(
                                          context,
                                        ).colorScheme.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.teal.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        asset.type,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: Colors.teal,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  asset.name,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.business,
                                      size: 14,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      platformName,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.edit_note,
                              color: Colors.blue,
                            ),
                            onPressed: () => _showAssetDialog(
                              asset: asset,
                              platforms: platforms,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  void _showAssetDialog({
    AssetModel? asset,
    List<PlatformModel> platforms = const [],
  }) {
    final bool isEditing = asset != null;
    final TextEditingController idController = TextEditingController(
      text: asset?.id ?? '',
    );
    final TextEditingController nameController = TextEditingController(
      text: asset?.name ?? '',
    );
    final TextEditingController newPlatformController = TextEditingController();
    String selectedType = asset?.type ?? 'Stock';
    String? selectedPlatformId = asset?.platformId.isNotEmpty == true
        ? asset?.platformId
        : (platforms.isNotEmpty ? platforms.first.id : null);

    final List<String> assetTypes = [
      'Stock',
      'Crypto',
      'Cripto',
      'ETF',
      'Cash',
      'Acción',
      'Other',
    ];

    // Ensure selectedType is in assetTypes to avoid crash
    if (!assetTypes.contains(selectedType)) {
      assetTypes.add(selectedType);
    }

    // Ensure selectedPlatformId is in platforms to avoid crash
    if (selectedPlatformId != null &&
        !platforms.any((p) => p.id == selectedPlatformId)) {
      selectedPlatformId = null;
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(isEditing ? "Editar Activo" : "Añadir Nuevo Activo"),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Información del Activo",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),
                    TextField(
                      controller: idController,
                      decoration: const InputDecoration(
                        labelText: 'Símbolo (Ticker/ID)',
                        prefixIcon: Icon(Icons.label_outline),
                      ),
                      enabled: !isEditing,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre Completo',
                        prefixIcon: Icon(Icons.info_outline),
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: selectedType,
                      decoration: const InputDecoration(
                        labelText: 'Tipo de Activo',
                        prefixIcon: Icon(Icons.category_outlined),
                      ),
                      items: assetTypes
                          .map(
                            (type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ),
                          )
                          .toList(),
                      onChanged: (val) =>
                          setDialogState(() => selectedType = val!),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      "Plataforma / Broker",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),
                    if (platforms.isNotEmpty)
                      DropdownButtonFormField<String>(
                        value: selectedPlatformId,
                        decoration: const InputDecoration(
                          labelText: 'Seleccionar Existente',
                          prefixIcon: Icon(Icons.business),
                        ),
                        items: platforms
                            .map(
                              (p) => DropdownMenuItem(
                                value: p.id,
                                child: Text(p.name),
                              ),
                            )
                            .toList(),
                        onChanged: (val) =>
                            setDialogState(() => selectedPlatformId = val),
                      ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: newPlatformController,
                      decoration: const InputDecoration(
                        labelText: 'O Crear Nueva Plataforma',
                        hintText: 'Ej: Binance, DeGiro...',
                        prefixIcon: Icon(Icons.add_business_outlined),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                if (isEditing)
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context); // Close edit dialog
                      _confirmDelete(asset);
                    },
                    child: const Text(
                      "Eliminar Activo",
                      style: TextStyle(color: Colors.redAccent, fontSize: 12),
                    ),
                  ),
                const Spacer(),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Cancelar"),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (idController.text.isEmpty ||
                        nameController.text.isEmpty)
                      return;

                    String platformId = selectedPlatformId ?? '';
                    String newPlatformName = newPlatformController.text.trim();

                    if (newPlatformName.isNotEmpty) {
                      // Check if it exists (case insensitive)
                      final existing = platforms.where(
                        (p) =>
                            p.name.toLowerCase() ==
                            newPlatformName.toLowerCase(),
                      );
                      if (existing.isNotEmpty) {
                        platformId = existing.first.id;
                      } else {
                        // Create new platform
                        String newId = newPlatformName
                            .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')
                            .toLowerCase();
                        await _platformService.addPlatform(
                          _uid,
                          PlatformModel(id: newId, name: newPlatformName),
                        );
                        platformId = newId;
                      }
                    }

                    final newAsset = AssetModel(
                      id: idController.text.trim(),
                      name: nameController.text.trim(),
                      type: selectedType,
                      platformId: platformId,
                      currentValue: asset?.currentValue ?? 0.0,
                      lastUpdated: asset?.lastUpdated,
                    );

                    if (isEditing) {
                      await _assetService.updateAsset(_uid, newAsset);
                    } else {
                      await _assetService.addAsset(_uid, newAsset);
                    }

                    if (mounted) Navigator.pop(context);
                  },
                  child: Text(isEditing ? "Guardar" : "Añadir"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmDelete(AssetModel asset) async {
    // Show loading indicator while checking transactions
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final transactions = await _transactionService
          .getUserTransactions(_uid)
          .first;
      if (mounted) Navigator.pop(context); // Remove loading

      final hasTransactions = transactions.any((tx) => tx.assetId == asset.id);

      if (hasTransactions) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text("No se puede eliminar"),
              content: Text(
                "Este activo (${asset.name}) tiene transacciones asociadas. Para eliminarlo, primero debes borrar todas sus transacciones para mantener la integridad del balance total.",
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Entendido"),
                ),
              ],
            ),
          );
        }
        return;
      }

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text("Confirmar eliminación"),
            content: Text(
              "¿Estás seguro de que quieres eliminar ${asset.name}?",
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancelar"),
              ),
              TextButton(
                onPressed: () async {
                  await _assetService.deleteAsset(_uid, asset.id);
                  if (mounted) {
                    Navigator.pop(context);
                  }
                },
                child: const Text(
                  "Eliminar",
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Remove loading if error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error al comprobar transacciones: $e")),
        );
      }
    }
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'stock':
      case 'acción':
        return Colors.blue;
      case 'crypto':
      case 'cripto':
        return Colors.orange;
      case 'etf':
        return Colors.purple;
      case 'cash':
        return Colors.green;
      default:
        return Colors.blueGrey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'stock':
      case 'acción':
        return Icons.show_chart;
      case 'crypto':
      case 'cripto':
        return Icons.currency_bitcoin;
      case 'etf':
        return Icons.pie_chart_outline;
      case 'cash':
        return Icons.payments_outlined;
      default:
        return Icons.help_outline;
    }
  }
}
