import 'package:intl/intl.dart';

/// App-wide date/time formatting helpers.
class AppDateUtils {
  AppDateUtils._();

  static final _dateFmt = DateFormat('d MMM yyyy');
  static final _timeFmt = DateFormat('h:mm a');
  static final _dateTimeFmt = DateFormat('d MMM yyyy, h:mm a');

  static String formatDate(DateTime dt) => _dateFmt.format(dt);
  static String formatTime(DateTime dt) => _timeFmt.format(dt);
  static String formatDateTime(DateTime dt) => _dateTimeFmt.format(dt);

  /// Returns "2h 15m" style duration string.
  static String formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  /// Returns "Today", "Yesterday", or formatted date.
  static String humanDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(dt.year, dt.month, dt.day);
    if (d == today) return 'Today';
    if (d == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return _dateFmt.format(dt);
  }

  /// Countdown string: "2d 3h", "45m", "12s"
  static String countdown(DateTime target) {
    final diff = target.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    return formatDuration(diff);
  }
}
