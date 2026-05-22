import os
import argparse
from datetime import datetime, timezone
from dotenv import load_dotenv

from scraper import scrape_all
from extractor import PipelineAuthError, ensure_anthropic_api_key, extract_all
from writer import save_all_drafts
from cost_guard import check_cost_safe
from run_logger import PipelineRunLogger

load_dotenv()


def parse_args():
    parser = argparse.ArgumentParser(description='Run AgentCodex pipeline')
    parser.add_argument('--backfill', action='store_true')
    parser.add_argument(
        '--agents',
        default='',
        help='Comma-separated slugs to limit sources, e.g. codex,claude-code',
    )
    parser.add_argument(
        '--max-links',
        type=int,
        default=5,
        help='Max entries per source/listing',
    )
    parser.add_argument(
        '--max-age-days',
        type=int,
        default=30,
        help='Max release/article age window for validation and RSS date cutoff',
    )
    parser.add_argument(
        '--backfill-days',
        type=int,
        default=90,
        help='Backfill mode: release/article age window used for seeded historical ingestion',
    )
    parser.add_argument(
        '--max-versions-per-article',
        type=int,
        default=8,
        help='Backfill mode: max versions to extract from one article/listing page',
    )
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument(
        '--scoring-mode',
        choices=['legacy', 'calibrated'],
        default='legacy',
        help='Score processing mode: keep current behavior (legacy) or deterministic calibration (calibrated)',
    )
    parser.add_argument(
        '--source-mode',
        default='',
        help='Optional source mode overrides, e.g. antigravity=listing_snapshot,qwen=hybrid',
    )
    return parser.parse_args()


def parse_source_mode_overrides(value: str) -> dict:
    if not value.strip():
        return {}
    overrides = {}
    allowed_modes = {'rss', 'listing_links', 'listing_snapshot', 'hybrid'}
    for chunk in value.split(','):
        item = chunk.strip()
        if not item or '=' not in item:
            continue
        slug, mode = item.split('=', 1)
        slug = slug.strip()
        mode = mode.strip()
        if slug and mode in allowed_modes:
            overrides[slug] = mode
    return overrides


def run_pipeline():
    """
    Main pipeline orchestrator
    Runs scrape → extract → save
    Check drafts in Supabase after run
    """
    start_time = datetime.now(timezone.utc)
    args = parse_args()
    target_agent_slugs = {
        slug.strip() for slug in args.agents.split(',') if slug.strip()
    } or None
    is_backfill = args.backfill
    source_mode_overrides = parse_source_mode_overrides(args.source_mode)
    max_age_days = max(1, args.backfill_days if is_backfill else args.max_age_days)

    run_logger = PipelineRunLogger()
    run_logger.start()

    print("=" * 50)
    print("AgentCodex Pipeline Starting")
    print(f"Time: {start_time.strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 50)
    print()

    try:
        ensure_anthropic_api_key()

        # Guard: stop if daily article budget is exhausted
        if (not is_backfill) and (not check_cost_safe()):
            print("⚠️  Daily article limit reached — exiting to stay under budget")
            run_logger.finish(status='skipped', metadata={'reason': 'daily_limit'})
            return

        # Step 1 - Scrape all sources
        print("STEP 1 - Scraping Sources")
        print("-" * 30)
        articles = scrape_all(
            run_logger=run_logger,
            target_agent_slugs=target_agent_slugs,
            max_links=max(1, args.max_links),
            max_article_age_days=max_age_days,
            skip_url_dedupe=False,
            source_mode_overrides=source_mode_overrides or None,
        )
        run_logger.increment('articles_scraped', len(articles))

        if not articles:
            print("No articles found - exiting")
            run_logger.finish(status='completed', metadata={'reason': 'no_articles'})
            return

        print(f"\nTotal articles scraped: {len(articles)}")

        # Step 2 - Extract versions using Claude
        print("\nSTEP 2 - Extracting Versions with Claude")
        print("-" * 30)
        versions_found = extract_all(
            articles,
            run_logger=run_logger,
            skip_content_dedupe=False,
            max_release_age_days=max_age_days,
            backfill_mode=is_backfill,
            max_versions_per_article=max(1, args.max_versions_per_article),
            scoring_mode=args.scoring_mode,
        )

        if not versions_found:
            print("\nNo new versions found today")
            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).seconds
            print(f"\nPipeline completed in {duration}s")
            print("Nothing new to save")
            run_logger.finish(status='completed', metadata={'reason': 'no_versions'})
            return

        # Step 3 - Save to Supabase as drafts
        print("\nSTEP 3 - Saving Drafts to Supabase")
        print("-" * 30)
        if is_backfill:
            for version in versions_found:
                impact = version.get('impact_factors') if isinstance(version.get('impact_factors'), dict) else {}
                impact.update({
                    'backfillRun': True,
                    'backfillWindowDays': max_age_days,
                })
                version['impact_factors'] = impact
                existing_note = str(version.get('editor_note') or '').strip()
                tag = f"backfill({max_age_days}d)"
                version['editor_note'] = f"{existing_note} | {tag}".strip(' |')

        results = save_all_drafts(
            versions_found,
            run_logger=run_logger,
            max_release_age_days=max_age_days,
            dry_run=args.dry_run,
        )

        # Final summary
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).seconds

        print()
        print("=" * 50)
        print("Pipeline Complete")
        print(f"Duration:   {duration} seconds")
        print(f"Scraped:    {len(articles)} articles")
        print(f"Extracted:  {len(versions_found)} versions")
        print(f"Saved:      {results['saved']} new drafts")
        print(f"Skipped:    {results['skipped']} duplicates")
        print(f"Failed:     {results['failed']} errors")
        print("=" * 50)

        run_logger.finish(
            status='completed',
            metadata={
                'duration_seconds': duration,
                'backfill': is_backfill,
                'target_agents': sorted(target_agent_slugs) if target_agent_slugs else [],
                'max_links': max(1, args.max_links),
                'max_age_days': max_age_days,
                'backfill_days': max(1, args.backfill_days),
                'max_versions_per_article': max(1, args.max_versions_per_article),
                'dry_run': args.dry_run,
                'scoring_mode': args.scoring_mode,
                'source_mode_overrides': source_mode_overrides,
                'by_agent': results.get('by_agent', {}),
            }
        )

        if results['saved'] > 0 and not args.dry_run:
            print()
            print("Review drafts in Supabase")
            print("─" * 30)
            print("Table Editor → agent_versions")
            print("Filter: status = draft")
            print()
            print("Or run this SQL query")
            print("─" * 30)
            print("""
select
  a.name as agent,
  av.version_number,
  av.release_date,
  av.what_changed,
  av.pipeline_run_date
from agent_versions av
join agents a on a.id = av.agent_id
where av.status = 'draft'
order by av.pipeline_run_date desc;
            """)

    except PipelineAuthError as e:
        print(f"❌ Pipeline authentication error: {e}")
        run_logger.finish(status='failed', error_message=str(e))
        raise

    except Exception as e:
        run_logger.finish(status='failed', error_message=str(e))
        raise


if __name__ == "__main__":
    run_pipeline()
