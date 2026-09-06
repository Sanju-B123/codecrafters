"""
BharatStandards AI - Rate Limiter
Simple in-memory sliding window rate limiter to protect AI endpoints against abuse.
"""
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List
from fastapi import HTTPException, status
from app.core.config import settings


class InMemoryRateLimiter:
    """
    Sliding window rate limiter per user/client ID.
    Thread-safe implementation with configurable request caps and time windows.
    """
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.user_requests: Dict[str, List[float]] = defaultdict(list)
        self.lock = Lock()

    def check_rate_limit(self, identifier: str) -> None:
        """
        Check if the identifier has exceeded the allowed requests in the last minute.
        Raises HTTP 429 Too Many Requests if rate limit is exceeded.
        """
        now = time.time()
        cutoff = now - self.window_seconds

        with self.lock:
            # Filter timestamps within current window
            timestamps = self.user_requests[identifier]
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= self.requests_per_minute:
                retry_after = int(valid_timestamps[0] + self.window_seconds - now) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.requests_per_minute} AI requests per minute.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            valid_timestamps.append(now)
            self.user_requests[identifier] = valid_timestamps

    def reset(self, identifier: str = None) -> None:
        """Helper for test suites to clear stored request timestamps."""
        with self.lock:
            if identifier:
                self.user_requests.pop(identifier, None)
            else:
                self.user_requests.clear()


# Default singleton instance
ai_rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.AI_RATE_LIMIT_PER_MINUTE)
