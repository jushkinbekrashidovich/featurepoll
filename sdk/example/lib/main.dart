import 'package:flutter/material.dart';
import 'package:feature_poll/feature_poll.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Line 1: Initialize the SDK
  await FeaturePoll.init('feature_poll_pk_test_key_123');

  runApp(const ExampleApp());
}

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FeaturePoll Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My App')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            // Line 2 & 3: Open the board
            FeaturePoll.openBoard(context);
          },
          child: const Text('Open Feature Board'),
        ),
      ),
    );
  }
}
