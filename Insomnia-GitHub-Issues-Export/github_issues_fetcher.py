# -*- coding: utf-8 -*-

import requests
import json
import os
import sys
import time
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GITHUB_API_URL = "https://api.github.com/graphql"
REPO_OWNER = "Kong"
REPO_NAME = "insomnia"
LABEL = "B-bug"
ISSUES_PER_PAGE = 100
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(OUTPUT_DIR, "fetch_log.txt")

# Default token (empty string)
GITHUB_TOKEN = ""

print("Environment variables:")
print(f"GITHUB_TOKEN exists: {'GITHUB_TOKEN' in os.environ}")
if 'GITHUB_TOKEN' in os.environ:
    # 不要打印完整的令牌，只显示前几个字符
    token_preview = os.environ['GITHUB_TOKEN'][:4] + '...'
    print(f"GITHUB_TOKEN value starts with: {token_preview}")

def log_message(message):
    """Log message to console and file"""
    print(message)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{timestamp}] {message}\n")

def init_log():
    """Initialize log file"""
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(f"GitHub Issues Fetcher Log - Started at {datetime.now()}\n\n")

def get_github_token():
    """Get GitHub token from environment or prompt user"""
    token = os.environ.get("GITHUB_TOKEN", GITHUB_TOKEN)
    if not token:
        token = input("Enter your GitHub Personal Access Token: ")
    return token

def fetch_issues(cursor=None):
    """Fetch issues using GraphQL API"""
    token = get_github_token()
    
    # GraphQL query
    query = """
    query($cursor: String) {
      repository(owner: "%s", name: "%s") {
        issues(first: %d, after: $cursor, states: OPEN, labels: ["%s"]) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            body
            url
            createdAt
            updatedAt
            author {
              login
            }
          }
        }
      }
    }
    """ % (REPO_OWNER, REPO_NAME, ISSUES_PER_PAGE, LABEL)
    
    # Variables for the query
    variables = {}
    if cursor:
        variables["cursor"] = cursor
    
    # Headers for the request
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Make the request
    response = requests.post(
        GITHUB_API_URL,
        headers=headers,
        json={"query": query, "variables": variables}
    )
    
    # Check for errors
    if response.status_code != 200:
        log_message(f"Error: API returned status code {response.status_code}")
        log_message(f"Response: {response.text}")
        return None
    
    # Parse the response
    data = response.json()
    
    # Check for GraphQL errors
    if "errors" in data:
        log_message(f"GraphQL Error: {json.dumps(data['errors'], indent=2)}")
        return None
    
    return data

def save_issues_to_file(issues, batch_number=None, min_issue_number=None, append=False):
    """Save issues to a JSON file"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Determine filename based on parameters
    if min_issue_number is not None:
        # For --min-issue parameter, use filter_bug_after_{issueNumber}_{timestamp}.json
        filename = os.path.join(OUTPUT_DIR, f"filter_bug_after_{min_issue_number}_{timestamp}.json")
        append = False  # Never append for filtered files
    elif batch_number is not None:
        # For regular batch or --update parameter
        filename = os.path.join(OUTPUT_DIR, f"open_bug_{batch_number}.json")
    else:
        # Fallback
        filename = os.path.join(OUTPUT_DIR, f"open_bug_{timestamp}.json")
    
    if append and os.path.exists(filename):
        # Read existing file
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                existing_issues = json.load(f)
            
            # Merge issues
            all_issues = existing_issues + issues
            
            # Remove duplicates based on issue number
            unique_issues = []
            seen_numbers = set()
            for issue in all_issues:
                if isinstance(issue, dict) and 'number' in issue:
                    issue_number = issue['number']
                    if issue_number not in seen_numbers:
                        unique_issues.append(issue)
                        seen_numbers.add(issue_number)
                else:
                    # Keep non-standard issues
                    unique_issues.append(issue)
            
            # Save merged issues
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(unique_issues, f, indent=2)
            
            log_message(f"Appended {len(issues)} issues to {filename}, total unique issues: {len(unique_issues)}")
            return len(unique_issues)
        except Exception as e:
            log_message(f"Error appending to {filename}: {e}")
            # If append fails, create new file
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(issues, f, indent=2)
            log_message(f"Saved {len(issues)} issues to {filename} (append failed)")
            return len(issues)
    else:
        # Create new file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(issues, f, indent=2)
        log_message(f"Saved {len(issues)} issues to {filename}")
        return len(issues)

def get_latest_issue_number():
    """Get the latest issue number from existing files"""
    latest_number = 0
    
    # Find all existing issue files
    json_files = [f for f in os.listdir(OUTPUT_DIR) 
                 if f.startswith('open_bug_') and f.endswith('.json')]
    
    for json_file in json_files:
        file_path = os.path.join(OUTPUT_DIR, json_file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                issues = json.load(f)
                if isinstance(issues, list) and issues:
                    for issue in issues:
                        if isinstance(issue, dict) and 'number' in issue:
                            latest_number = max(latest_number, int(issue['number']))
        except Exception as e:
            log_message(f"Error reading {file_path}: {e}")
    
    return latest_number

def get_last_batch_number():
    """Get the last batch number from existing open_bug_X.json files"""
    last_batch = 0
    
    # Find all existing issue files
    json_files = [f for f in os.listdir(OUTPUT_DIR) 
                 if f.startswith('open_bug_') and f.endswith('.json')]
    
    for json_file in json_files:
        try:
            # Extract batch number from filename
            batch_str = json_file.replace('open_bug_', '').replace('.json', '')
            batch_num = int(batch_str)
            last_batch = max(last_batch, batch_num)
        except ValueError:
            # Skip files with non-numeric batch numbers
            continue
    
    return last_batch

def filter_issues_by_number(issues, min_issue_number):
    """Filter issues to only include those with number greater than min_issue_number"""
    if not min_issue_number:
        return issues
    
    filtered_issues = []
    for issue in issues:
        if isinstance(issue, dict) and 'number' in issue:
            if int(issue['number']) > min_issue_number:
                filtered_issues.append(issue)
    
    return filtered_issues

def fetch_all_issues(min_issue_number=None, update_mode=False):
    """Fetch all issues using pagination"""
    init_log()
    
    if update_mode:
        # If in update mode and no min_issue_number provided, get the latest issue number
        if not min_issue_number:
            min_issue_number = get_latest_issue_number()
            log_message(f"Update mode: Getting issues newer than #{min_issue_number}")
    
    log_message(f"Starting to fetch issues from {REPO_OWNER}/{REPO_NAME} with label {LABEL}")
    if min_issue_number:
        log_message(f"Filtering for issues with number greater than {min_issue_number}")
    
    cursor = None
    batch_number = 1
    total_issues = 0
    filtered_total = 0
    
    # In update mode, get the last batch number for appending
    if update_mode:
        last_batch = get_last_batch_number()
        if last_batch > 0:
            batch_number = last_batch
            log_message(f"Update mode: Will append to open_bug_{batch_number}.json")
    
    while True:
        log_message(f"Fetching batch {batch_number}...")
        data = fetch_issues(cursor)
        
        if not data:
            log_message("Failed to fetch data. Exiting.")
            break
        
        # Extract issues from the response
        issues_data = data["data"]["repository"]["issues"]
        issues = issues_data["nodes"]
        page_info = issues_data["pageInfo"]
        
        if not issues:
            log_message("No issues found in this batch.")
            break
        
        total_issues += len(issues)
        
        # Filter issues by number if needed
        if min_issue_number:
            filtered_issues = filter_issues_by_number(issues, min_issue_number)
            log_message(f"Filtered {len(filtered_issues)} issues out of {len(issues)} fetched")
            
            if filtered_issues:
                if update_mode:
                    # In update mode, append to the last batch file
                    count = save_issues_to_file(filtered_issues, batch_number=batch_number, append=True)
                    log_message(f"Appended {len(filtered_issues)} issues to open_bug_{batch_number}.json")
                else:
                    # In min-issue mode, save to a special filter file
                    count = save_issues_to_file(filtered_issues, min_issue_number=min_issue_number)
                filtered_total += len(filtered_issues)
            else:
                log_message("No issues match the filter criteria in this batch.")
        else:
            # Save all issues to file
            if update_mode:
                # In update mode, always append
                count = save_issues_to_file(issues, batch_number=batch_number, append=True)
                log_message(f"Appended {len(issues)} issues to open_bug_{batch_number}.json")
            else:
                # In normal mode, create new files for each batch
                save_issues_to_file(issues, batch_number=batch_number)
                # Increment batch number for next file (only in normal mode)
                batch_number += 1
            filtered_total += len(issues)
        
        # Check if there are more pages
        if page_info["hasNextPage"]:
            cursor = page_info["endCursor"]
            log_message(f"More issues available. Next cursor: {cursor}")
            
            # Add a small delay to avoid rate limiting
            time.sleep(1)
        else:
            log_message("No more issues to fetch.")
            break
    
    log_message(f"Completed. Total issues fetched: {total_issues}")
    if min_issue_number:
        log_message(f"Issues matching filter criteria: {filtered_total}")

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Fetch GitHub issues with filtering options')
    parser.add_argument('--min-issue', type=int, help='Minimum issue number to fetch')
    parser.add_argument('--update', action='store_true', help='Update mode: fetch only new issues')
    args = parser.parse_args()
    
    try:
        fetch_all_issues(args.min_issue, args.update)
    except KeyboardInterrupt:
        log_message("Process interrupted by user.")
    except Exception as e:
        log_message(f"Error: {str(e)}")
        import traceback
        log_message(traceback.format_exc())