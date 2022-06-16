#! /usr/bin/env python3

from wrangle import (
    fetch_data,
    get_sorted,
    item_repr,
)
from flask import (
    send_from_directory,
    render_template,
    redirect, request,
    session
)
from flask_api import FlaskAPI, exceptions
from flask_caching import Cache
from airtable import airtable

import os

from random import getrandbits

from dotenv import load_dotenv
load_dotenv()


try:
    VERSION = os.getenv("VERCEL_GIT_COMMIT_SHA", 1)
    SORT_KEY = os.getenv("SORT_KEY", None)
    SORT_REVERSE = os.getenv("SORT_REVERSE", None)
    BASE_FIELDS = os.getenv("BASE_FIELDS", '')
    POPUP_FIELDS = os.getenv("POPUP_FIELDS", '')
    REQUIRED_FIELDS = os.getenv("REQUIRED_FIELDS", POPUP_FIELDS)
    MAPBOX_KEY = os.getenv("MAPBOX_KEY", '')
    TABLE_NAME = os.environ["AIRTABLE_TABLE"]
    AIRTABLE_LINK = os.getenv("AIRTABLE_LINK", '')
    AIRTABLE_FORM = os.getenv("AIRTABLE_FORM", '')
    at = airtable.Airtable(
        os.environ["AIRTABLE_BASE"],
        os.environ["AIRTABLE_KEY"],
    )
except KeyError:
    print("Environment not ready: see README for required keys")
    exit(1)

# Check for reverse option
if SORT_KEY.startswith('-'):
    SORT_REVERSE = True
    SORT_KEY = SORT_KEY[1:]

# Set up the Flask App
app = FlaskAPI(__name__, static_url_path='/static')
app.secret_key = bytes([getrandbits(8) for _ in range(0, 16)])

app.config.update(
    SORT_KEY=SORT_KEY,
    SORT_REVERSE=SORT_REVERSE,
    MAPBOX_KEY=MAPBOX_KEY,
    BASE_FIELDS=BASE_FIELDS,
    POPUP_FIELDS=POPUP_FIELDS,
    REQUIRED_FIELDS=REQUIRED_FIELDS,
    AIRTABLE_LINK=AIRTABLE_LINK,
    AIRTABLE_FORM=AIRTABLE_FORM,
    TABLE_NAME=TABLE_NAME,
    VERSION=VERSION,
)

cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})
cache.init_app(app)


@app.route("/items", methods=['GET'])
@cache.cached(timeout=500)
def items_list():
    """
    List sorted items
    """
    if 'items' not in session:
        session['items'] = fetch_data(at)
    g_items = session['items']
    g_sortd = get_sorted(g_items, SORT_REVERSE)
    return [item_repr(g_items[idx], idx, request.host_url) for idx in g_sortd]


@app.route("/search", methods=['GET'])
def items_search():
    """
    Search by keyword
    """
    q = request.args.get('q')
    print('Searching:', q)
    if 'items' not in session:
        session['items'] = fetch_data(at)
    g_items = session['items']
    gfilter = {}
    for idx in g_items.keys():
        gk = g_items[idx]
        matching = False
        for fld in gk.keys():
            s = None
            if isinstance(gk[fld], str):
                s = gk[fld]
            elif isinstance(gk[fld], list) and isinstance(gk[fld][0], str):
                s = gk[fld][0]
            if s and q.lower() in s.lower():
                matching = True
                break
        if matching:
            gfilter[idx] = gk
    g_sortd = get_sorted(gfilter, SORT_REVERSE)
    return [item_repr(g_items[idx], idx, request.host_url) for idx in g_sortd]


@app.route("/detail/<key>/", methods=['GET'])
@cache.cached(timeout=250)
def item_detail(key):
    """
    Retrieve instances
    """
    if 'items' not in session:
        session['items'] = fetch_data(at)
    g_items = session['items']
    if key not in g_items:
        raise exceptions.NotFound()
    return item_repr(g_items, key, request.host_url)


@app.route('/')
@app.route('/app')
@cache.cached(timeout=1000)
def route_index():
    if MAPBOX_KEY:
        return render_template('map.html')
    else:
        return render_template('gallery.html')


@app.route('/refresh')
def route_refresh():
    session['items'] = fetch_data(at)
    return redirect("/", code=302)


@app.route('/static/<path:path>')
def route_static(path):
    return send_from_directory('static', path)


if __name__ == "__main__":
    app.run(debug=True)
