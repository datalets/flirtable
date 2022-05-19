#! /usr/bin/env python3

from wrangle import (
    fetch_data,
    item_repr,
)
from flask import (
    send_from_directory,
    render_template,
    redirect, request,
    g
)
from flask_api import FlaskAPI, exceptions
from flask_caching import Cache
from airtable import airtable

import os

from dotenv import load_dotenv
load_dotenv()


try:
    SORT_KEY = os.getenv("SORT_KEY", None)
    BASE_FIELDS = os.getenv("BASE_FIELDS", '')
    POPUP_FIELDS = os.getenv("POPUP_FIELDS", '')
    # TODO: add defaults / base_fields
    REQUIRED_FIELDS = POPUP_FIELDS.split(",") + BASE_FIELDS.split(";")
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


# Set up the Flask App
app = FlaskAPI(__name__, static_url_path='/static')

app.config.update(
    SORT_KEY=SORT_KEY,
    MAPBOX_KEY=MAPBOX_KEY,
    BASE_FIELDS=BASE_FIELDS,
    POPUP_FIELDS=POPUP_FIELDS,
    REQUIRED_FIELDS=REQUIRED_FIELDS,
    AIRTABLE_LINK=AIRTABLE_LINK,
    AIRTABLE_FORM=AIRTABLE_FORM,
    TABLE_NAME=TABLE_NAME,
)

cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})
cache.init_app(app)


@app.route("/items", methods=['GET'])
@cache.cached(timeout=50)
def items_list():
    """
    List sorted items
    """
    if not g.get('items', False):
        g.items = fetch_data(at)
    return [item_repr(g.items, idx, request.host_url)
            for idx in sorted(g.items.keys())]


@app.route("/detail/<key>/", methods=['GET'])
@cache.cached(timeout=50)
def item_detail(key):
    """
    Retrieve instances
    """
    if key not in g.items:
        raise exceptions.NotFound()
    return item_repr(g.items, key, request.host_url)


@app.route('/')
@app.route('/app')
@cache.cached(timeout=250)
def route_index():
    if MAPBOX_KEY:
        return render_template('map.html')
    else:
        return render_template('gallery.html')


@app.route('/refresh')
def route_refresh():
    g.items = fetch_data(at)
    return redirect("/", code=302)


@app.route('/static/<path:path>')
def route_static(path):
    return send_from_directory('static', path)


if __name__ == "__main__":
    app.run(debug=True)
