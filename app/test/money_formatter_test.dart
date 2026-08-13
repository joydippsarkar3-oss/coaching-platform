import 'package:flutter_test/flutter_test.dart';

import 'package:brand_training_app/core/utils/money_formatter.dart';

void main() {
  group('formatPaise', () {
    test('renders paise as rupees with two decimals', () {
      expect(formatPaise(150000), '₹1,500.00');
    });

    test('keeps sub-thousand amounts uncommaed', () {
      expect(formatPaise(99900), '₹999.00');
    });

    test('preserves the paise remainder', () {
      expect(formatPaise(12345), '₹123.45');
    });

    test('formats zero', () {
      expect(formatPaise(0), '₹0.00');
    });

    test('groups lakhs the Indian way (2,2,3)', () {
      // 10,00,000 rupees — not 1,000,000
      expect(formatPaise(100000000), '₹10,00,000.00');
    });

    test('groups crores the Indian way', () {
      expect(formatPaise(1000000000), '₹1,00,00,000.00');
    });
  });

  group('formatPaiseCompact', () {
    test('drops the decimal part', () {
      expect(formatPaiseCompact(150000), '₹1,500');
    });

    test('rounds to the nearest rupee', () {
      expect(formatPaiseCompact(12350), '₹124');
    });

    test('groups lakhs the Indian way', () {
      expect(formatPaiseCompact(100000000), '₹10,00,000');
    });
  });
}
