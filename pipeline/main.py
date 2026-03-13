import os
from datetime import datetime, timezone
from dotenv import load_dotenv

from scraper import scrape_all
from extractor import extract_all
from writer import save_all_drafts

load_dotenv()


def run_pipeline():
    """
    Main pipeline orchestrator
    Runs scrape → extract → save
    Check drafts in Supabase after run
    """
    start_time = datetime.now(timezone.utc)

    print("=" * 50)
    print("AgentCodex Pipeline Starting")
    print(f"Time: {start_time.strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 50)
    print()

    # Step 1 - Scrape all sources
    print("STEP 1 - Scraping Sources")
    print("-" * 30)
    articles = scrape_all()

    if not articles:
        print("No articles found - exiting")
        return

    print(f"\nTotal articles scraped: {len(articles)}")

    # Step 2 - Extract versions using Claude
    print("\nSTEP 2 - Extracting Versions with Claude")
    print("-" * 30)
    versions_found = extract_all(articles)

    if not versions_found:
        print("\nNo new versions found today")
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).seconds
        print(f"\nPipeline completed in {duration}s")
        print("Nothing new to save")
        return

    # Step 3 - Save to Supabase as drafts
    print("\nSTEP 3 - Saving Drafts to Supabase")
    print("-" * 30)
    results = save_all_drafts(versions_found)

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

    if results['saved'] > 0:
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


if __name__ == "__main__":
    run_pipeline()