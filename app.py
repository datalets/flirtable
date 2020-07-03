#! /usr/bin/env python3

from flask import request, url_for, send_from_directory
from flask_api import FlaskAPI, status, exceptions
from airtable import airtable

import json, os

from dotenv import load_dotenv
load_dotenv()

try:
    SORT_KEY = os.getenv("SORT_KEY", None)
    REQUIRED_FIELDS = os.getenv("REQUIRED_FIELDS", '').split(",")
    TABLE_NAME = os.environ["AIRTABLE_TABLE"]
    at = airtable.Airtable(
        os.environ["AIRTABLE_BASE"],
        os.environ["AIRTABLE_KEY"],
    )
except KeyError:
    print("Environment not ready:")
    print("- AIRTABLE_BASE, AIRTABLE_TABLE and AIRTABLE_KEY from the API")
    print("- REQUIRED_FIELDS (optional) with a comma-delimited list of columns")
    print("- SORT_KEY (optional) to indicate which column to sort on")
    exit(1)

def fetch_data():
    """ Collect remote data """
    for r in at.iterate(TABLE_NAME):
        record = r['fields']
        if SORT_KEY is None:
            sort_value = r['id']
        else:
            sort_value = record[SORT_KEY]
        if valid_entry(record):
            items[sort_value] = record

def valid_entry(entry):
    """ Validate the row """
    for value in REQUIRED_FIELDS:
        if value not in entry or not entry[value]:
            return False
    return True

# Set up the Flask App
app = FlaskAPI(__name__, static_url_path='/static')

# Load the data
items = {}
fetch_data()

def item_repr(key):
    return {
        'id': key,
        'url': request.host_url.rstrip('/') + url_for('item_detail', key=key),
        'data': items[key]
    }

@app.route("/items", methods=['GET'])
def items_list():
    """
    List sorted items
    """
    return [item_repr(idx) for idx in sorted(items.keys())]

@app.route("/detail/<key>/", methods=['GET'])
def item_detail(key):
    """
    Retrieve instances
    """
    if key not in items:
        raise exceptions.NotFound()
    return item_repr(key)

@app.route('/app/')
def route_index():
    return send_from_directory('static', 'index.html')

@app.route('/app/<path:path>')
def route_app(path):
    return send_from_directory('static', path)

if __name__ == "__main__":
    app.run(debug=True)
