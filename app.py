#! /usr/bin/env python3

from flask import (
    request, url_for,
    send_from_directory,
    render_template,
    redirect, g
)
from flask_api import FlaskAPI, status, exceptions
from airtable import airtable

import json, os

from dotenv import load_dotenv
load_dotenv()

try:
    SORT_KEY = os.getenv("SORT_KEY", None)
    POPUP_FIELDS = os.getenv("POPUP_FIELDS", '')
    REQUIRED_FIELDS = POPUP_FIELDS.split(",")
    TABLE_NAME = os.environ["AIRTABLE_TABLE"]
    MAPBOX_KEY = os.environ["MAPBOX_KEY"]
    AIRTABLE_LINK = os.getenv("AIRTABLE_LINK", '')
    AIRTABLE_FORM = os.getenv("AIRTABLE_FORM", '')
    at = airtable.Airtable(
        os.environ["AIRTABLE_BASE"],
        os.environ["AIRTABLE_KEY"],
    )
except KeyError:
    print("Environment not ready: see README for required keys")
    exit(1)

def fetch_data():
    """ Collect remote data """
    g.items = {}
    for r in at.iterate(TABLE_NAME):
        record = r['fields']
        if SORT_KEY is None:
            sort_value = r['id']
        else:
            sort_value = record[SORT_KEY]
        if valid_entry(record):
            g.items[sort_value] = record

def valid_entry(entry):
    """ Validate the row """
    if len(REQUIRED_FIELDS) == 0 or REQUIRED_FIELDS[0] == '':
        return True
    for value in REQUIRED_FIELDS:
        if value not in entry or not entry[value]:
            return False
    return True

# Set up the Flask App
app = FlaskAPI(__name__, static_url_path='/static')

app.config.update(
    MAPBOX_KEY=MAPBOX_KEY,
    POPUP_FIELDS=POPUP_FIELDS,
    AIRTABLE_LINK=AIRTABLE_LINK,
    AIRTABLE_FORM=AIRTABLE_FORM,
)

def item_repr(key):
    return {
        'id': key,
        'url': request.host_url.rstrip('/') + url_for('item_detail', key=key),
        'data': g.items[key]
    }

@app.route("/items", methods=['GET'])
def items_list():
    """
    List sorted items
    """
    if not 'items' in g or not g.items: fetch_data()
    return [item_repr(idx) for idx in sorted(g.items.keys())]

@app.route("/detail/<key>/", methods=['GET'])
def item_detail(key):
    """
    Retrieve instances
    """
    if key not in g.items:
        raise exceptions.NotFound()
    return item_repr(key)

@app.route('/')
@app.route('/app')
def route_index():
    return render_template('index.html')

@app.route('/refresh')
def route_refresh():
    fetch_data()
    return redirect("/", code=302)

@app.route('/static/<path:path>')
def route_static(path):
    return send_from_directory('static', path)

if __name__ == "__main__":
    app.run(debug=True)
