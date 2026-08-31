import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'passport_screen.dart';

class StatusScreen extends StatelessWidget {
  const StatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('My Applications')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('applications')
            .where('ownerId', isEqualTo: user?.uid)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No applications yet'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final doc = docs[index];
              final data = doc.data() as Map<String, dynamic>;
              final status = data['status'] ?? 'pending';
              final isApproved = status == 'approved';
              final verifyUrl = 'https://sih-weighing-verification.web.app/verify/${doc.id}';

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
                      Text('Type: ${data['instrumentType'] ?? "-"}'),
                      Text('Serial: ${data['serialNumber'] ?? "-"}'),
                      const SizedBox(height: 8),
                      Chip(
                        label: Text(status),
                        backgroundColor: isApproved
                            ? Colors.green.shade100
                            : (status == 'rejected')
                                ? Colors.red.shade100
                                : Colors.orange.shade100,
                      ),
                                            if (isApproved) ...[
                        const SizedBox(height: 16),
                        const Text('Certificate QR Code:'),
                        const SizedBox(height: 8),
                        QrImageView(
                          data: verifyUrl,
                          size: 150,
                        ),
                      ],
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => PassportScreen(
                                applicationId: doc.id,
                                instrumentName: data['instrumentName'] ?? 'Unnamed',
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.history),
                        label: const Text('View Passport / History'),
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