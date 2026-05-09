import os
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client

from deduplicator import normalize_url

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)


class PipelineRunLogger:
    """
    Best-effort logger for pipeline runs and article events.
    Logging failures should never stop ingestion.
    """

    def __init__(self):
        self.run_id: Optional[str] = None
        self.counters = {
            'articles_scraped': 0,
            'keyword_matched': 0,
            'url_duplicates': 0,
            'content_duplicates': 0,
            'haiku_checked': 0,
            'haiku_rejected': 0,
            'sonnet_checked': 0,
            'extracted': 0,
            'saved': 0,
            'skipped': 0,
            'failed': 0,
        }

    def start(self) -> Optional[str]:
        try:
            result = supabase.table('pipeline_runs')\
                .insert({'status': 'running'})\
                .execute()
            if result.data:
                self.run_id = result.data[0]['id']
        except Exception as e:
            print(f"  ⚠️  Run logger unavailable: {e}")
        return self.run_id

    def increment(self, key: str, amount: int = 1) -> None:
        if key in self.counters:
            self.counters[key] += amount

    def event(
        self,
        article: dict,
        stage: str,
        event: str,
        details: Optional[dict] = None
    ) -> None:
        if not self.run_id:
            return

        try:
            supabase.table('pipeline_article_events')\
                .insert({
                    'run_id': self.run_id,
                    'source_name': article.get('source_name', ''),
                    'article_url': article.get('url'),
                    'normalized_url': normalize_url(article.get('url', '')),
                    'article_title': article.get('title', ''),
                    'stage': stage,
                    'event': event,
                    'details': details or {},
                })\
                .execute()
        except Exception as e:
            print(f"  ⚠️  Article event log failed: {e}")

    def finish(
        self,
        status: str = 'completed',
        error_message: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        if not self.run_id:
            return

        payload = {
            **self.counters,
            'status': status,
            'finished_at': datetime.now(timezone.utc).isoformat(),
            'metadata': metadata or {},
        }

        if error_message:
            payload['error_message'] = error_message[:2000]

        try:
            supabase.table('pipeline_runs')\
                .update(payload)\
                .eq('id', self.run_id)\
                .execute()
        except Exception as e:
            print(f"  ⚠️  Run finish log failed: {e}")
