import 'package:flutter_test/flutter_test.dart';

import 'package:brand_training_app/core/utils/date_utils.dart';

void main() {
  group('formatDuration', () {
    test('uses hours and minutes past an hour', () {
      expect(AppDateUtils.formatDuration(const Duration(hours: 2, minutes: 15)), '2h 15m');
    });

    test('uses minutes and seconds under an hour', () {
      expect(AppDateUtils.formatDuration(const Duration(minutes: 45, seconds: 30)), '45m 30s');
    });

    test('uses seconds only under a minute', () {
      expect(AppDateUtils.formatDuration(const Duration(seconds: 12)), '12s');
    });

    test('drops the seconds once hours are present', () {
      expect(
        AppDateUtils.formatDuration(const Duration(hours: 1, minutes: 5, seconds: 59)),
        '1h 5m',
      );
    });
  });

  group('humanDate', () {
    test('labels today', () {
      expect(AppDateUtils.humanDate(DateTime.now()), 'Today');
    });

    test('labels yesterday', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      expect(AppDateUtils.humanDate(yesterday), 'Yesterday');
    });

    test('falls back to an absolute date further out', () {
      expect(AppDateUtils.humanDate(DateTime(2026, 3, 14)), '14 Mar 2026');
    });
  });

  group('countdown', () {
    test('reports Expired once the target has passed', () {
      final past = DateTime.now().subtract(const Duration(minutes: 5));
      expect(AppDateUtils.countdown(past), 'Expired');
    });

    test('reports remaining time for a future target', () {
      final future = DateTime.now().add(const Duration(hours: 3, minutes: 30));
      expect(AppDateUtils.countdown(future), startsWith('3h'));
    });
  });

  group('formatDate', () {
    test('renders day, short month and year', () {
      expect(AppDateUtils.formatDate(DateTime(2026, 8, 13)), '13 Aug 2026');
    });
  });
}
