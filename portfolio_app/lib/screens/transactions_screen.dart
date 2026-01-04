import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaction.dart';
import '../services/transaction_service.dart';
import '../services/auth_service.dart';
import 'add_transaction_screen.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  static final DateFormat dateFormat = DateFormat('dd/MM/yyyy');

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final TransactionService _transactionService = TransactionService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchTimer;

  String _searchQuery = '';
  List<TransactionModel> _transactions = [];
  List<TransactionModel> _filteredTransactionsMemo = [];
  DocumentSnapshot? _lastDocument;
  bool _isLoading = false;
  bool _hasMore = true;
  List<String> _selectedTypes = [];

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoading &&
        _hasMore) {
      _fetchTransactions();
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredTransactionsMemo = _transactions.where((tx) {
        final matchesSearch =
            tx.description.toLowerCase().contains(_searchQuery) ||
            tx.assetId.toLowerCase().contains(_searchQuery) ||
            tx.type.toLowerCase().contains(_searchQuery);

        final matchesType =
            _selectedTypes.isEmpty || _selectedTypes.contains(tx.type);

        return matchesSearch && matchesType;
      }).toList();
    });
  }

  void _onSearchChanged(String query) {
    _searchTimer?.cancel();
    _searchTimer = Timer(const Duration(milliseconds: 300), () {
      _searchQuery = query.toLowerCase();
      _applyFilters();
    });
  }

  Future<void> _fetchTransactions({bool refresh = false}) async {
    if (_isLoading) return;

    final user = AuthService().currentUser;
    if (user == null) return;

    setState(() {
      _isLoading = true;
      if (refresh) {
        _transactions = [];
        _filteredTransactionsMemo = [];
        _lastDocument = null;
        _hasMore = true;
      }
    });

    try {
      final snapshot = await _transactionService.getTransactionsPage(
        user.uid,
        limit: 20,
        startAfter: _lastDocument,
      );

      final newTransactions = snapshot.docs.map((doc) {
        return TransactionModel.fromFirestore(doc);
      }).toList();

      _transactions.addAll(newTransactions);
      if (snapshot.docs.isNotEmpty) {
        _lastDocument = snapshot.docs.last;
      }
      _hasMore = snapshot.docs.length == 20;
      _applyFilters();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading transactions: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transacciones'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por descripción, activo...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              setState(() {
                                _searchQuery = '';
                                _searchController.clear();
                                _applyFilters();
                              });
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onChanged: _onSearchChanged,
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: TransactionModel.validTypes.map((type) {
                    final isSelected = _selectedTypes.contains(type);
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: FilterChip(
                        label: Text(type, style: const TextStyle(fontSize: 12)),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            _selectedTypes.add(type);
                          } else {
                            _selectedTypes.remove(type);
                          }
                          _applyFilters();
                        },
                        selectedColor: Colors.teal.withOpacity(0.3),
                        checkmarkColor: Colors.teal,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
      body: user == null
          ? const Center(child: Text('Inicia sesión para ver transacciones.'))
          : RefreshIndicator(
              onRefresh: () => _fetchTransactions(refresh: true),
              child: _transactions.isEmpty && _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _filteredTransactionsMemo.isEmpty
                  ? const Center(child: Text('No hay transacciones.'))
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(8),
                      itemExtent: 85.0,
                      addAutomaticKeepAlives: false,
                      addRepaintBoundaries: true,
                      itemCount:
                          _filteredTransactionsMemo.length + (_hasMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _filteredTransactionsMemo.length) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }
                        return TransactionCard(
                          uid: user.uid,
                          tx: _filteredTransactionsMemo[index],
                          onRefresh: () => _fetchTransactions(refresh: true),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AddTransactionScreen(),
            ),
          );
          if (result == true) {
            _fetchTransactions(refresh: true);
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class TransactionCard extends StatelessWidget {
  final String uid;
  final TransactionModel tx;
  final VoidCallback onRefresh;

  const TransactionCard({
    super.key,
    required this.uid,
    required this.tx,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr = TransactionsScreen.dateFormat.format(tx.date);
    final isNegative = tx.amount < 0;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: _getTypeColor(tx.type).withOpacity(0.2),
          child: Icon(_getTypeIcon(tx.type), color: _getTypeColor(tx.type)),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                tx.description,
                style: const TextStyle(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              '${tx.amount.toStringAsFixed(2)} €',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isNegative ? Colors.redAccent : Colors.greenAccent,
                fontSize: 16,
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0),
          child: Row(
            children: [
              Text(dateStr, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  tx.type,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.edit, size: 20, color: Colors.blue),
          onPressed: () => _editTransaction(context, tx),
        ),
      ),
    );
  }

  void _editTransaction(BuildContext context, TransactionModel tx) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddTransactionScreen(transaction: tx),
      ),
    );
    if (result == true) {
      onRefresh();
    }
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'compra':
      case 'buy':
      case 'aportación':
        return Colors.green;
      case 'venta':
      case 'sell':
      case 'retirada':
        return Colors.red;
      case 'dividendo':
      case 'dividend':
        return Colors.blue;
      case 'plan':
        return Colors.teal;
      case 'comisión':
      case 'fee':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'compra':
      case 'buy':
      case 'aportación':
        return Icons.add_circle_outline;
      case 'venta':
      case 'sell':
      case 'retirada':
        return Icons.remove_circle_outline;
      case 'dividendo':
      case 'dividend':
        return Icons.payments_outlined;
      case 'plan':
        return Icons.event_repeat;
      case 'comisión':
      case 'fee':
        return Icons.receipt_long_outlined;
      default:
        return Icons.swap_horiz;
    }
  }
}
