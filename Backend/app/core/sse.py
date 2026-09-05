import asyncio
import json
from typing import AsyncGenerator, Set, Dict, Any

class SSEManager:
    """
    Manages live Server-Sent Events (SSE) client subscriptions and event broadcasting.
    Allows real-time streaming of analyzed email cases directly to the React frontend.
    """
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    @property
    def active_subscribers_count(self) -> int:
        return len(self._subscribers)

    async def subscribe(self) -> AsyncGenerator[Dict[str, str], None]:
        """
        Subscribes a client connection, yielding SSE event dictionaries compatible
        with sse_starlette / FastAPI EventSourceResponse.
        """
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.add(queue)

        try:
            # Yield initial connection confirmation heartbeat
            yield {
                "event": "connected",
                "data": json.dumps({"message": "SSE stream established", "subscribers": len(self._subscribers)}),
            }

            while True:
                try:
                    # Wait for next broadcasted event with 20s keep-alive ping
                    message = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield message
                except asyncio.TimeoutError:
                    # Send periodic keep-alive comment/ping to prevent client timeouts
                    yield {
                        "event": "ping",
                        "data": json.dumps({"timestamp": asyncio.get_event_loop().time()}),
                    }
        except asyncio.CancelledError:
            pass
        finally:
            self._subscribers.discard(queue)

    async def broadcast(self, event: str, data: Any):
        """
        Broadcasts an event with payload data to all currently connected clients.
        """
        if not self._subscribers:
            return

        payload_str = json.dumps(data) if not isinstance(data, str) else data
        message = {
            "event": event,
            "data": payload_str,
        }

        for q in list(self._subscribers):
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                # Discard slow/stalled subscriber
                self._subscribers.discard(q)
            except Exception:
                pass

sse_manager = SSEManager()
