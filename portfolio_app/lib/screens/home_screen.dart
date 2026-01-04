import 'package:flutter/material.dart';
import '../main.dart';
import '../services/auth_service.dart';
import 'transactions_screen.dart';
import 'add_transaction_screen.dart';
import 'asset_summary_screen.dart';
import 'manage_assets_screen.dart';
import '../models/transaction.dart';
import '../services/transaction_service.dart';
import '../widgets/portfolio_dashboard.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolio Manager'),
        actions: [
          ValueListenableBuilder<ThemeMode>(
            valueListenable: themeNotifier,
            builder: (context, currentMode, _) {
              IconData icon;
              if (currentMode == ThemeMode.system) {
                icon = Icons.brightness_auto;
              } else if (currentMode == ThemeMode.light) {
                icon = Icons.light_mode;
              } else {
                icon = Icons.dark_mode;
              }
              return IconButton(
                icon: Icon(icon),
                onPressed: () {
                  if (currentMode == ThemeMode.system) {
                    themeNotifier.value = ThemeMode.light;
                  } else if (currentMode == ThemeMode.light) {
                    themeNotifier.value = ThemeMode.dark;
                  } else {
                    themeNotifier.value = ThemeMode.system;
                  }
                },
                tooltip: 'Cambiar tema (Sistema/Claro/Oscuro)',
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService().signOut();
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: Theme.of(context).primaryColor),
              accountName: Text(user?.displayName ?? "User"),
              accountEmail: Text(user?.email ?? ""),
              currentAccountPicture: user?.photoURL != null
                  ? CircleAvatar(backgroundImage: NetworkImage(user!.photoURL!))
                  : const CircleAvatar(child: Icon(Icons.person)),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Home'),
              onTap: () {
                Navigator.pop(context); // Close the drawer
              },
            ),
            ListTile(
              leading: const Icon(Icons.list),
              title: const Text('Transactions'),
              onTap: () {
                Navigator.pop(context); // Close the drawer
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TransactionsScreen(),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.pie_chart),
              title: const Text('Asset Summary'),
              onTap: () {
                Navigator.pop(context); // Close the drawer
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AssetSummaryScreen(),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_suggest),
              title: const Text('Manage Assets'),
              onTap: () {
                Navigator.pop(context); // Close the drawer
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const ManageAssetsScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.symmetric(vertical: 24),
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Hola, ${user.displayName ?? 'Inversionista'} 👋",
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                ),
                          ),
                          Text(
                            "Bienvenido de nuevo a tu portafolio",
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      if (user.photoURL != null)
                        CircleAvatar(
                          backgroundImage: NetworkImage(user.photoURL!),
                          radius: 24,
                        )
                      else
                        const CircleAvatar(
                          child: Icon(Icons.person),
                          radius: 24,
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Dashboard
                PortfolioDashboard(uid: user.uid),
                const SizedBox(height: 32),

                // Quick Actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    "Acciones Rápidas",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      _buildQuickAction(
                        context,
                        "Añadir transacción",
                        Icons.add_circle_outline,
                        Colors.blue,
                        const AddTransactionScreen(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Recent Activity
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Actividad Reciente",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const TransactionsScreen(),
                          ),
                        ),
                        child: const Text("Ver todas"),
                      ),
                    ],
                  ),
                ),
                StreamBuilder<List<TransactionModel>>(
                  stream: TransactionService().getUserTransactions(user.uid),
                  builder: (context, snapshot) {
                    if (!snapshot.hasData) return const SizedBox();
                    final recent = snapshot.data!.take(3).toList();
                    if (recent.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(20),
                        child: Text("No hay transacciones recientes"),
                      );
                    }
                    return Column(
                      children: recent.map((tx) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: TransactionCard(
                            uid: user.uid,
                            tx: tx,
                            onRefresh: () {},
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
              ],
            ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    Widget screen,
  ) {
    return InkWell(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => screen),
      ),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 110,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: color is MaterialColor ? color.shade800 : color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
