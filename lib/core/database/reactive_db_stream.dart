import 'dart:async';

/// Merges [sources] and emits an initial [emit] call on listen.
Stream<T> mergeReactiveStreams<T>(
  Future<T> Function() emit,
  List<Stream<dynamic>> sources,
) {
  late final StreamController<T> controller;
  final subscriptions = <StreamSubscription<dynamic>>[];

  Future<void> push() async {
    if (controller.isClosed) return;
    try {
      controller.add(await emit());
    } catch (error, stackTrace) {
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
