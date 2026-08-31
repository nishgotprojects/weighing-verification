import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class GisAllocationScreen extends StatefulWidget {
  const GisAllocationScreen({super.key});

  @override
  State<GisAllocationScreen> createState() => _GisAllocationScreenState();
}

class _GisAllocationScreenState extends State<GisAllocationScreen> {
  final List<Map<String, dynamic>> _officers = [
    {'name': 'Officer Karthik', 'zone': 'Ambattur Zone', 'workload': 2},
    {'name': 'Officer Priya', 'zone': 'T Nagar Zone', 'workload': 4},
    {'name': 'Officer Suresh', 'zone': 'Tambaram Zone', 'workload': 1},
    {'name': 'Officer Divya', 'zone': 'Anna Nagar Zone', 'workload': 3},
  ];

  final Set<String> _calculating = {};

  Future<void> _autoAssign(String docId) async {
    setState(() => _calculating.add(docId));

    await Future.delayed(const Duration(milliseconds: 1400));

    _officers.sort((a, b) => a['workload'].compareTo(b['workload']));
    final chosen = _officers.first;
    final mockDistance = 2 + (docId.hashCode.abs() % 14);

    setState(() {
      chosen['workload'] = chosen['workload'] + 1;
    });

    await FirebaseFirestore.instance.collection('applications').doc(docId).update({
      'assignedOfficer': chosen['name'],
      'assignedZone': chosen['zone'],
      'assignedDistanceKm': mockDistance,
      'assignedAt': FieldValue.serverTimestamp(),
    });

    await FirebaseFirestore.instance
        .collection('applications')
        .doc(docId)
        .collection('history')
        .add({
      'event': 'officer_assigned',
      'details':
          'Assigned to ${chosen['name']} (${chosen['zone']}, ~${mockDistance}km away)',
      'timestamp': FieldValue.serverTimestamp(),
    });

    if (mounted) {
      setState(() => _calculating.remove(docId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GIS Smart Officer Allocation')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('applications')
            .where('status', isEqualTo: 'pending')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No pending applications'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final doc = docs[index];
              final data = doc.data() as Map<String, dynamic>;
              final isCalculating = _calculating.contains(doc.id);
              final isAssigned = data['assignedOfficer'] != null;

              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(data['instrumentName'] ?? 'Unnamed',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(data['location'] ?? '-'),
                      const SizedBox(height: 10),
                      if (isCalculating)
                        const Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(width: 10),
                            Text('Calculating optimal officer...'),
                          ],
                        )
                      else if (isAssigned)
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Assigned: ${data['assignedOfficer']} (${data['assignedZone']}, ~${data['assignedDistanceKm']}km)',
                          ),
                        )
                      else
                        ElevatedButton(
                          onPressed: () => _autoAssign(doc.id),
                          child: const Text('Auto-Assign Officer'),
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