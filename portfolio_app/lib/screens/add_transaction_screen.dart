import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../models/asset.dart';
import '../services/auth_service.dart';
import '../services/transaction_service.dart';
import '../services/asset_service.dart';

class AddTransactionScreen extends StatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  // Asset selection
  String? _selectedAssetId;
  String? _selectedAssetName;

  String _selectedType = 'Plan';
  DateTime _selectedDate = DateTime.now();

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
        id: '',
        userId: user.uid,
        amount: amount,
        description: _selectedAssetName ?? '',
        assetId: _selectedAssetId!,
        date: _selectedDate,
        type: _selectedType,
      );

      try {
        await TransactionService().addTransaction(user.uid, transaction);
        if (mounted) {
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error adding transaction: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Add Transaction')),
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
                        child: const Text('Save Transaction'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
