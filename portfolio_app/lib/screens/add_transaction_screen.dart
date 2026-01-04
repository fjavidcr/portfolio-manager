import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../models/asset.dart';
import '../services/auth_service.dart';
import '../services/transaction_service.dart';
import '../services/asset_service.dart';

class AddTransactionScreen extends StatefulWidget {
  final TransactionModel? transaction;
  const AddTransactionScreen({super.key, this.transaction});

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  // Asset selection
  String? _selectedAssetId;
  String? _selectedAssetName;

  late String _selectedType;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.transaction?.amount.toString() ?? '';
    _selectedAssetId = widget.transaction?.assetId;
    _selectedAssetName = widget.transaction?.description;
    _selectedType = widget.transaction?.type ?? 'Plan';
    _selectedDate = widget.transaction?.date ?? DateTime.now();
  }

  // Use types from Model
  final List<String> _transactionTypes = TransactionModel.validTypes;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  void _saveTransaction() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedAssetId == null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Please select an asset')));
        return;
      }

      final user = AuthService().currentUser;
      if (user == null) {
        return;
      }

      final amount = double.tryParse(_amountController.text) ?? 0.0;

      final transaction = TransactionModel(
        id: widget.transaction?.id ?? '',
        userId: user.uid,
        amount: amount,
        description: _selectedAssetName ?? '',
        assetId: _selectedAssetId!,
        date: _selectedDate,
        type: _selectedType,
      );

      try {
        if (widget.transaction != null) {
          await TransactionService().updateTransaction(user.uid, transaction);
        } else {
          await TransactionService().addTransaction(user.uid, transaction);
        }
        if (mounted) {
          Navigator.pop(context, true);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Error ${widget.transaction != null ? 'updating' : 'adding'} transaction: $e',
              ),
            ),
          );
        }
      }
    }
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Eliminar Transacción"),
        content: const Text(
          "¿Estás seguro de que quieres eliminar esta transacción?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancelar"),
          ),
          TextButton(
            onPressed: () async {
              final user = AuthService().currentUser;
              if (user != null && widget.transaction != null) {
                await TransactionService().deleteTransaction(
                  user.uid,
                  widget.transaction!.id,
                );
                if (mounted) {
                  Navigator.pop(context); // Pop dialog
                  Navigator.pop(context, true); // Pop screen with refresh flag
                }
              }
            },
            child: const Text("Eliminar", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.transaction != null ? 'Edit Transaction' : 'Add Transaction',
        ),
        actions: widget.transaction != null
            ? [
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline,
                    color: Colors.redAccent,
                  ),
                  onPressed: _confirmDelete,
                  tooltip: 'Eliminar transacción',
                ),
              ]
            : null,
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Asset Selection Dropdown
                    StreamBuilder<List<AssetModel>>(
                      stream: AssetService().getUserAssets(user.uid),
                      builder: (context, snapshot) {
                        if (!snapshot.hasData) {
                          return const LinearProgressIndicator();
                        }
                        final assets = snapshot.data!;

                        // Sort assets by name for better UX
                        assets.sort((a, b) => a.name.compareTo(b.name));

                        return DropdownButtonFormField<String>(
                          value: _selectedAssetId,
                          decoration: const InputDecoration(
                            labelText: 'Asset',
                            hintText: 'Select an asset',
                          ),
                          items: assets.map((AssetModel asset) {
                            return DropdownMenuItem<String>(
                              value: asset.id,
                              child: Text('${asset.name} (${asset.id})'),
                            );
                          }).toList(),
                          onChanged: (String? newValue) {
                            setState(() {
                              _selectedAssetId = newValue;
                              _selectedAssetName = assets
                                  .firstWhere((a) => a.id == newValue)
                                  .name;
                            });
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please select an asset';
                            }
                            return null;
                          },
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _amountController,
                      decoration: const InputDecoration(
                        labelText: 'Amount (EUR)',
                        hintText: 'e.g. 1500.50',
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter an amount';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedType,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: _transactionTypes.map((String type) {
                        return DropdownMenuItem<String>(
                          value: type,
                          child: Text(type),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedType = newValue!;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text(
                          'Date: ${_selectedDate.toLocal().toString().split(' ')[0]}',
                        ),
                        const SizedBox(width: 20),
                        ElevatedButton(
                          onPressed: () => _selectDate(context),
                          child: const Text('Select Date'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Center(
                      child: ElevatedButton(
                        onPressed: _saveTransaction,
                        child: Text(
                          widget.transaction != null
                              ? 'Update Transaction'
                              : 'Save Transaction',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
