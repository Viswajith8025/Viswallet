import 'dart:async';

/// Merges [sources] and emits an initial [emit] call on listen.
///
/// Concurrent [emit] calls are sequenced so only the latest completed snapshot
/// is delivered — older in-flight results are discarded.
Stream<T> mergeReactiveStreams<T>(
  Future<T> Function() emit,
  List<Stream<dynamic>> sources,
) {
  late final StreamController<T> controller;
  final subscriptions = <StreamSubscription<dynamic>>[];
  var generation = 0;

  Future<void> push() async {
    if (controller.isClosed) return;
    final token = ++generation;
    try {
      final value = await emit();
      if (controller.isClosed || token != generation) return;
      controller.add(value);
    } catch (error, stackTrace) {
      if (controller.isClosed || token != generation) return;
      controller.addError(error, stackTrace);
    }
  }

  controller = StreamController<T>(
    onListen: () {
      push();
      for (final source in sources) {
        subscriptions.add(source.listen((_) => push()));
      }
    },
    onCancel: () async {
      for (final subscription in subscriptions) {
        await subscription.cancel();
      }
      subscriptions.clear();
    },
  );

  return controller.stream;
}
