import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

class ApplyScreen extends StatefulWidget {
  const ApplyScreen({super.key});

  @override
  State<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends State<ApplyScreen> {
  final _instrumentNameController = TextEditingController();
  final _instrumentTypeController = TextEditingController();
  final _serialNumberController = TextEditingController();
  final _locationController = TextEditingController();
  bool _isSubmitting = false;
  String _statusMessage = '';
  Uint8List? _imageBytes;
  String? _imageName;

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image);
    if (result != null && result.files.single.bytes != null) {
      setState(() {
        _imageBytes = result.files.single.bytes;
        _imageName = result.files.single.name;
      });
    }
  }

  Future<void> _submitApplication() async {
    if (_instrumentNameController.text.trim().isEmpty ||
        _serialNumberController.text.trim().isEmpty) {
      setState(() {
        _statusMessage = 'Please fill instrument name and serial number';
      });
      return;
    }
    if (_imageBytes == null) {
      setState(() {
        _statusMessage = 'Please upload an instrument photo';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _statusMessage = 'Running AI check...';
    });

    try {
      final base64Image = base64Encode(_imageBytes!);

      final aiResponse = await http.post(
        Uri.parse('http://127.0.0.1:8000/analyze-instrument'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'image_base64': base64Image,
          'declared_serial': _serialNumberController.text.trim(),
        }),
      );

      final aiResult = jsonDecode(aiResponse.body);

      final user = FirebaseAuth.instance.currentUser;
      await FirebaseFirestore.instance.collection('applications').add({
        'ownerEmail': user?.email,
        'ownerId': user?.uid,
        'instrumentName': _instrumentNameController.text.trim(),
        'instrumentType': _instrumentTypeController.text.trim(),
        'serialNumber': _serialNumberController.text.trim(),
        'location': _locationController.text.trim(),
        'status': 'pending',
        'aiFlagged': aiResult['flagged'] ?? false,
        'aiRawResult': aiResult['raw_result'] ?? '',
        'submittedAt': FieldValue.serverTimestamp(),
      });

      setState(() {
        _statusMessage = 'Application submitted successfully!';
        _instrumentNameController.clear();
        _instrumentTypeController.clear();
        _serialNumberController.clear();
        _locationController.clear();
        _imageBytes = null;
        _imageName = null;
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: $e';
      });
    }

    setState(() {
      _isSubmitting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Apply for Verification')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          children: [
            TextField(
              controller: _instrumentNameController,
              decoration: const InputDecoration(labelText: 'Instrument Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _instrumentTypeController,
              decoration: const InputDecoration(labelText: 'Instrument Type'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _serialNumberController,
              decoration: const InputDecoration(labelText: 'Serial Number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(labelText: 'Location / Address'),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.camera_alt),
              label: Text(_imageName ?? 'Upload Instrument Photo'),
            ),
            const SizedBox(height: 20),
            if (_statusMessage.isNotEmpty)
              Text(
                _statusMessage,
                style: TextStyle(
                  color: _statusMessage.startsWith('Error') ||
                          _statusMessage.startsWith('Please')
                      ? Colors.red
                      : Colors.green,
                ),
              ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitApplication,
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Submit Application'),
            ),
          ],
        ),
      ),
    );
  }
}