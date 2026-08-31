import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class OfflineVerificationScreen extends StatefulWidget {
  const OfflineVerificationScreen({super.key});

  @override
  State<OfflineVerificationScreen> createState() =>
      _OfflineVerificationScreenState();
}

class _OfflineVerificationScreenState
    extends State<OfflineVerificationScreen> {
  bool _isOffline = false;
  bool _isSyncing = false;
  bool _loadingCache = true;
  List<Map<String, dynamic>> _cachedInstruments = [];
  List<Map<String, dynamic>> _pendingSync = [];

  @override
  void initState() {
    super.initState();
    _loadCache();
  }

  Future<void> _loadCache() async {
    final snapshot = await FirebaseFirestore.instance
        .collection('applications')
        .where('status', isEqualTo: 'approved')
        .get();

    setState(() {
      _cachedInstruments = snapshot.docs
          .map((doc) => {
                'id': doc.id,
                'instrumentName': doc['instrumentName'] ?? 'Unnamed',
                'serialNumber': doc['serialNumber'] ?? '-',
                'location': doc['location'] ?? '-',
              })
          .toList();
      _loadingCache = false;
    });
  }

  void _verifyOffline(Map<String, dynamic> instrument) {
    setState(() {
      _pendingSync.add(instrument);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
            '${instrument['instrumentName']} verified offline. Queued for sync.'),
      ),
    );
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);

    await Future.delayed(const Duration(seconds: 2));

    for (final item in _pendingSync) {
      await FirebaseFirestore.instance
          .collection('applications')
          .doc(item['id'])
          .collection('history')
          .add({
        'event': 'field_verified',
        'details': 'Field-verified offline by inspector, synced on reconnect',
        'timestamp': FieldValue.serverTimestamp(),
      });
    }

    setState(() {
      _pendingSync.clear();
      _isSyncing = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Synced successfully.')),
      );
    }
  }

  void _toggleOffline(bool value) {
    setState(() => _isOffline = value);
    if (!value && _pendingSync.isNotEmpty) {
      _syncNow();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Offline Field Verification')),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: _isOffline ? Colors.orange.shade100 : Colors.green.shade100,
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      _isOffline ? Icons.wifi_off : Icons.wifi,
                      color: _isOffline
                          ? Colors.orange.shade800
                          : Colors.green.shade800,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isOffline ? 'Offline Mode (simulated)' : 'Online',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _isOffline
                            ? Colors.orange.shade800
                            : Colors.green.shade800,
                      ),
                    ),
                  ],
                ),
                Switch(value: _isOffline, onChanged: _toggleOffline),
              ],
            ),
          ),
          if (_isSyncing)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Row(
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Text('Syncing queued verifications...'),
                ],
              ),
            ),
          if (_pendingSync.isNotEmpty && !_isSyncing)
            Container(
              width: double.infinity,
              color: Colors.blue.shade50,
              padding: const EdgeInsets.all(8),
              child: Text('${_pendingSync.length} verification(s) pending sync'),
            ),
          Expanded(
            child: _loadingCache
                ? const Center(child: CircularProgressIndicator())
                : _cachedInstruments.isEmpty
                    ? const Center(child: Text('No approved instruments cached'))
                    : ListView.builder(
                        itemCount: _cachedInstruments.length,
                        itemBuilder: (context, index) {
                          final item = _cachedInstruments[index];
                          final alreadyQueued = _pendingSync
                              .any((p) => p['id'] == item['id']);

                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            child: ListTile(
                              title: Text(item['instrumentName']),
                              subtitle: Text(
                                  'Serial: ${item['serialNumber']}\n${item['location']}'),
                              isThreeLine: true,
                              trailing: alreadyQueued
                                  ? const Icon(Icons.check_circle,
                                      color: Colors.blue)
                                  : ElevatedButton(
                                      onPressed: _isOffline
                                          ? () => _verifyOffline(item)
                                          : null,
                                      child: const Text('Verify'),
                                    ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}