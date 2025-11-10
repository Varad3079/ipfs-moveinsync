import threading
import time
from dataclasses import dataclass, asdict
from typing import Dict


@dataclass
class MetricsSnapshot:
    total_requests: int
    error_requests: int
    average_latency_ms: float
    max_latency_ms: float


class RequestMetrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._total_requests = 0
        self._error_requests = 0
        self._total_latency_ms = 0.0
        self._max_latency_ms = 0.0

    def record(self, duration_seconds: float, succeeded: bool) -> None:
        latency_ms = duration_seconds * 1000
        with self._lock:
            self._total_requests += 1
            if not succeeded:
                self._error_requests += 1
            self._total_latency_ms += latency_ms
            if latency_ms > self._max_latency_ms:
                self._max_latency_ms = latency_ms

    def snapshot(self) -> MetricsSnapshot:
        with self._lock:
            average_latency = (
                self._total_latency_ms / self._total_requests
                if self._total_requests
                else 0.0
            )
            return MetricsSnapshot(
                total_requests=self._total_requests,
                error_requests=self._error_requests,
                average_latency_ms=round(average_latency, 2),
                max_latency_ms=round(self._max_latency_ms, 2),
            )


metrics = RequestMetrics()


def now() -> float:
    return time.perf_counter()


def to_dict() -> Dict:
    """
    Return the current metrics snapshot as a serializable dict.
    """
    return asdict(metrics.snapshot())

