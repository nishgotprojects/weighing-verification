import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PassportScreen extends StatelessWidget {
  final String applicationId;
  final String instrumentName;

  const PassportScreen({
    super.key,
    required this.applicationId,
    required this.instrumentName,
  });

  IconData _iconForEvent(String event) {
    switch (event) {
      case 'submitted':
        return Icons.upload_file;
      case 'ai_checked':
        return Icons.smart_toy;
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      default:
        return Icons.circle;
    }
  }

  Color _colorForEvent(String event) {
    switch (event) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'ai_checked':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _formatTimestamp(Timestamp? timestamp) {
    if (timestamp == null) return 'Pending...';
    final date = timestamp.toDate();
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    final h = date.hour.toString().padLeft(2, '0');
    final min = date.minute.toString().padLeft(2, '0');
    return '$d/$m/${date.year} $h:$min';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Passport: $instrumentName')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('applications')
            .doc(applicationId)
            .collection('history')
            .orderBy('timestamp', descending: false)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No history yet'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;
              final event = data['event'] ?? 'unknown';
              final details = data['details'] ?? '';
              final timestamp = data['timestamp'] as Timestamp?;

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Icon(_iconForEvent(event), color: _colorForEvent(event)),
                      if (index != docs.length - 1)
                        Container(
                          width: 2,
                          height: 40,
                          color: Colors.grey.shade300,
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            details,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatTimestamp(timestamp),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}