import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/money_formatter.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';

part 'wallet_page.g.dart';

@riverpod
Future<WalletBalance> walletBalance(WalletBalanceRef ref) =>
    ref.watch(apiServiceProvider).getWalletBalance();

@riverpod
Future<List<WalletTransaction>> walletTransactions(
    WalletTransactionsRef ref) =>
    ref.watch(apiServiceProvider).getWalletTransactions();

// ── S8 Wallet ─────────────────────────────────────────────────────────────────

class WalletPage extends ConsumerWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceAsync = ref.watch(walletBalanceProvider);
    final txnsAsync = ref.watch(walletTransactionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Wallet')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletBalanceProvider);
          ref.invalidate(walletTransactionsProvider);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Balance card
            SliverToBoxAdapter(
              child: balanceAsync.when(
                loading: () => const SizedBox(
                  height: 140,
                  child: LoadingShimmer(),
                ),
                error: (e, _) => const SizedBox.shrink(),
                data: (w) => _BalanceCard(wallet: w),
              ),
            ),

            // Transactions header
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Text(
                  'Transaction History',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ),

            // Transactions list
            txnsAsync.when(
              loading: () => const SliverFillRemaining(child: LoadingShimmer()),
              error: (e, _) => SliverFillRemaining(
                child: EmptyState(
                  icon: Icons.error_outline,
                  title: 'Could not load transactions',
                  subtitle: e.toString(),
                ),
              ),
              data: (txns) => txns.isEmpty
                  ? const SliverFillRemaining(
                      child: EmptyState(
                        icon: Icons.account_balance_wallet_outlined,
                        title: 'No transactions yet',
                        subtitle: 'Your wallet history will appear here',
                      ),
                    )
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => _TxnTile(txn: txns[i]),
                        childCount: txns.length,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final WalletBalance wallet;
  const _BalanceCard({required this.wallet});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Available Balance',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 8),
          Text(
            MoneyFormatter.formatPaise(wallet.balancePaise),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _TxnTile extends StatelessWidget {
  final WalletTransaction txn;
  const _TxnTile({required this.txn});

  @override
  Widget build(BuildContext context) {
    final isCredit = txn.type == 'CREDIT' || txn.type == 'REFUND';
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isCredit
            ? Colors.green.withOpacity(0.1)
            : Colors.red.withOpacity(0.1),
        child: Icon(
          isCredit ? Icons.arrow_downward : Icons.arrow_upward,
          color: isCredit ? Colors.green : Colors.red,
          size: 18,
        ),
      ),
      title: Text(txn.description ?? txn.type),
      subtitle: Text(
        txn.createdAt.toLocal().toString().substring(0, 16),
        style: const TextStyle(fontSize: 12),
      ),
      trailing: Text(
        '${isCredit ? '+' : '-'}${MoneyFormatter.formatPaise(txn.amountPaise)}',
        style: TextStyle(
          color: isCredit ? Colors.green[700] : Colors.red[700],
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
