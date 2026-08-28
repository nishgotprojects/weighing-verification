import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class InspectorScreen extends StatelessWidget {
  const InspectorScreen({super.key});

  Future<void> _updateStatus(String docId, String newStatus) async {
    await FirebaseFirestore.instance
        .collection('applications')
        .doc(docId)
        .update({'status': newStatus});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inspector Dashboard')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('applications')
            .orderBy('submittedAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No applications submitted yet'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final doc = docs[index];
              final data = doc.data() as Map<String, dynamic>;
              final status = data['status'] ?? 'pending';

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data['instrumentName'] ?? 'Unnamed',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text('Owner: ${data['ownerEmail'] ?? "-"}'),
                      Text('Type: ${data['instrumentType'] ?? "-"}'),
                      Text('Serial: ${data['serialNumber'] ?? "-"}'),
                      Text('Location: ${data['location'] ?? "-"}'),
                      if (data['aiFlagged'] == true)
  const Padding(
    padding: EdgeInsets.only(top: 6),
    child: Text(
      '⚠ AI flagged this application for review',
      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
    ),
  ),
                      const SizedBox(height: 8),
                      Chip(
                        label: Text(status),
                        backgroundColor: (status == 'approved')
                            ? Colors.green.shade100
                            : (status == 'rejected')
                                ? Colors.red.shade100
                                : Colors.orange.shade100,
                      ),
                      const SizedBox(height: 8),
                      if (status == 'pending')
                        Row(
                          children: [
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                              onPressed: () => _updateStatus(doc.id, 'approved'),
                              child: const Text('Approve'),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                              onPressed: () => _updateStatus(doc.id, 'rejected'),
                              child: const Text('Reject'),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}