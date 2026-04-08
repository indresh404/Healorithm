import 'package:uuid/uuid.dart';

class QRService {
  static const uuid = Uuid();

  /// Generate a unique QR code
  static String generateQRCode() {
    // Format: QR_<UUID>
    return 'QR_${uuid.v4().replaceAll('-', '').substring(0, 16).toUpperCase()}';
  }

  /// Generate a simple user ID based on phone (optional)
  static String generateUserIdFromPhone(String phone) {
    // Format: USER_<last10digits>
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final lastDigits = cleanPhone.length >= 10 
        ? cleanPhone.substring(cleanPhone.length - 10)
        : cleanPhone;
    return 'USER_$lastDigits';
  }
}
