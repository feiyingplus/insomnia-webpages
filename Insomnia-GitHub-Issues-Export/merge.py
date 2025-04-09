#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import pandas as pd
import os
import sys
import re
from datetime import datetime
import glob
import logging
import markdown

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('merge_log.txt'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def find_json_files():
    """Find all JSON files starting with open_bug_"""
    return glob.glob('open_bug_*.json')

def read_json_file(file_path):
    """Read JSON file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        return None

def process_issues(all_issues):
    """Process issues data and convert to DataFrame format"""
    processed_issues = []
    failed_issues = []
    
    for issue in all_issues:
        try:
            processed_issue = {
                'number': issue.get('number'),
                'title': issue.get('title'),
                'body': issue.get('body'),
                'url': issue.get('url'),
                'createdAt': format_date(issue.get('createdAt')),
                'updatedAt': format_date(issue.get('updatedAt')),
                'author_login': extract_author_login(issue.get('author'))
            }
            processed_issues.append(processed_issue)
        except Exception as e:
            logger.error(f"Error processing issue #{issue.get('number')}: {str(e)}")
            failed_issues.append(issue)
    
    return processed_issues, failed_issues

def format_date(date_str):
    """Format date string"""
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%SZ')
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return date_str

def extract_author_login(author):
    """Extract author login information"""
    if not author:
        return ""
    return author.get('login', '')

def clean_text_for_excel(text):
    """Clean text to make it Excel-friendly"""
    if not isinstance(text, str):
        return text
    
    # Replace problematic Unicode characters
    text = re.sub(r'[\ufffd\ufeff\u0000-\u0008\u000b-\u000c\u000e-\u001f]', '', text)
    
    # Truncate if too long for Excel
    if len(text) > 32000:  # Using 32000 to be safe
        logger.warning(f"Truncating text with length {len(text)} to 32000 characters")
        return text[:32000] + "... [truncated]"
    
    return text

def save_to_excel_and_csv(df, excel_path, csv_path):
    """Save data to Excel and CSV files"""
    try:
        # Clean data before saving to Excel
        excel_df = df.copy()
        for column in excel_df.columns:
            excel_df[column] = excel_df[column].apply(clean_text_for_excel)
        
        # Remove body_length column if it exists
        if 'body_length' in excel_df.columns:
            excel_df = excel_df.drop('body_length', axis=1)
            
        excel_df.to_excel(excel_path, index=False)
        logger.info(f"Data saved to Excel file: {excel_path}")
    except Exception as e:
        logger.error(f"Error saving to Excel file: {str(e)}")
    
    try:
        # For CSV, we can keep the original data
        csv_df = df.copy()
        if 'body_length' in csv_df.columns:
            csv_df = csv_df.drop('body_length', axis=1)
            
        csv_df.to_csv(csv_path, index=False, encoding='utf-8', quoting=1)  # quoting=1 means quote all fields
        logger.info(f"Data saved to CSV file: {csv_path}")
    except Exception as e:
        logger.error(f"Error saving to CSV file: {str(e)}")

def save_failed_issues(failed_issues, file_path):
    """Save failed issues to JSON file"""
    if not failed_issues:
        return
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(failed_issues, f, indent=2, ensure_ascii=False)
        logger.info(f"Failed issues saved to: {file_path}")
    except Exception as e:
        logger.error(f"Error saving failed issues: {str(e)}")

def main():
    logger.info("Starting GitHub Issues merge process")
    
    # Find JSON files
    json_files = find_json_files()
    logger.info(f"Found {len(json_files)} JSON files")
    
    if not json_files:
        logger.warning("No files found starting with open_bug_")
        return
    
    # Read and merge all issues
    all_issues = []
    for file_path in json_files:
        data = read_json_file(file_path)
        if data:
            if isinstance(data, list):
                all_issues.extend(data)
            else:
                all_issues.append(data)
            logger.info(f"Read data from {file_path}")
    
    logger.info(f"Total issues read: {len(all_issues)}")
    
    # Process issues data
    processed_issues, failed_issues = process_issues(all_issues)
    logger.info(f"Successfully processed {len(processed_issues)} issues")
    logger.info(f"Failed to process {len(failed_issues)} issues")
    
    if not processed_issues:
        logger.warning("No successfully processed issues")
        return
    
    # Create DataFrame
    df = pd.DataFrame(processed_issues)
    
    # Convert body to markdown (optional - can be disabled if causing problems)
    try:
        df['body'] = df['body'].apply(lambda x: markdown.markdown(x) if isinstance(x, str) else x)
    except Exception as e:
        logger.error(f"Error converting markdown: {str(e)}")
    
    # Calculate body length and log rows with long body
    df['body_length'] = df['body'].apply(lambda x: len(x) if isinstance(x, str) else 0)
    long_bodies = df[df['body_length'] > 32767]
    if not long_bodies.empty:
        logger.warning(f"Found {len(long_bodies)} rows with body length exceeding Excel's limit")
        for _, row in long_bodies.iterrows():
            logger.warning(f"Issue #{row['number']} has body length of {row['body_length']}")
    
    # Save to Excel and CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    excel_path = f"Insomnia-GitHub-Issues_{timestamp}.xlsx"
    csv_path = f"Insomnia-GitHub-Issues_{timestamp}.csv"
    save_to_excel_and_csv(df, excel_path, csv_path)
    
    # Save failed issues
    if failed_issues:
        save_failed_issues(failed_issues, "merge_failed.json")
    
    logger.info("Merge process completed")

if __name__ == "__main__":
    main()

