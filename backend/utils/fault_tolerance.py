import time
from typing import Callable, TypeVar

T = TypeVar("T")


def with_retry(
    operation: Callable[[], T],
    *,
    max_attempts: int = 3,
    backoff_seconds: float = 0.2,
) -> T:
    """
    Execute an operation with basic retry semantics.
    """
    attempt = 0
    while True:
        attempt += 1
        try:
            return operation()
        except Exception as exc:
            if attempt >= max_attempts:
                raise exc
            time.sleep(backoff_seconds * attempt)

