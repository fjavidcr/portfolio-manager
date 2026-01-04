import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'auth_gate.dart';
import 'firebase_options.dart';

final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.system);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (_, ThemeMode currentMode, __) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Portfolio Manager',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.blueAccent,
              brightness: Brightness.light,
            ),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.blueAccent,
              brightness: Brightness.dark,
              surface: const Color(
                0xFF121212,
              ), // Deeper black for main surfaces
              onSurface: Colors.white,
            ),
            useMaterial3: true,
            drawerTheme: const DrawerThemeData(
              backgroundColor: Color(
                0xFF1E1E1E,
              ), // Slightly lighter than background for contrast
              surfaceTintColor: Colors.transparent,
            ),
            listTileTheme: const ListTileThemeData(
              iconColor: Colors.blueAccent,
              textColor: Colors.white70,
            ),
          ),
          themeMode: currentMode,
          home: const AuthGate(),
        );
      },
    );
  }
}
