/// Converts paise (integer) to formatted ₹ string.
/// e.g. 150000 → "₹1,500.00"
String formatPaise(int paise) {
  final rupees = paise / 100.0;
  final parts = rupees.toStringAsFixed(2).split('.');
  final intPart = _addCommasIndian(parts[0]);
  return '₹$intPart.${parts[1]}';
}

/// Compact form: 150000 paise → "₹1,500"
String formatPaiseCompact(int paise) {
  final rupees = (paise / 100).round();
  return '₹${_addCommasIndian(rupees.toString())}';
}

String _addCommasIndian(String n) {
  if (n.length <= 3) return n;
  final last3 = n.substring(n.length - 3);
  final rest = n.substring(0, n.length - 3);
  final buf = StringBuffer();
  for (var i = 0; i < rest.length; i++) {
    if (i != 0 && (rest.length - i) % 2 == 0) buf.write(',');
    buf.write(rest[i]);
  }
  return '${buf.toString()},$last3';
}
