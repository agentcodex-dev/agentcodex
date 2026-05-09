import os
import time


class RateLimiter:
    """Simple minimum-interval limiter for polite external API calls."""

    def __init__(self, interval_seconds: float):
        self.interval_seconds = max(interval_seconds, 0)
        self._last_call_at = 0.0

    def wait(self) -> None:
        if self.interval_seconds <= 0:
            return

        now = time.monotonic()
        elapsed = now - self._last_call_at
        remaining = self.interval_seconds - elapsed

        if self._last_call_at > 0 and remaining > 0:
            time.sleep(remaining)

        self._last_call_at = time.monotonic()


def env_interval(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default
