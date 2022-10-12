#! /usr/bin/env python3

from flask import url_for, current_app
from random import random
from dateutil.parser import isoparse


def fetch_data(at):
    """ Collect remote data """
    print("Collecting remote data ...")
    SORT_KEY = current_app.config.get('SORT_KEY')
    TABLE_NAME = current_app.config.get('TABLE_NAME')
    REQ_FIELDS = current_app.config.get('REQUIRED_FIELDS').split(",")
    invalid_entry = None
    int_sort = False
    items = {}

    # Collect the data structure
    for r in at.iterate(TABLE_NAME):
        # Use default (id) for reference
        ident = r['id']
        record = r['fields']

        # Assign sort order key
        if not SORT_KEY:
            sortkey = ident
        elif SORT_KEY in record:
            sortkey = record[SORT_KEY]
            if sortkey.endswith('00Z'):
                sortkey = int(isoparse(sortkey).timestamp())
                int_sort = True
        else:
            sortkey = round(random() * 9999)
            int_sort = True
        if int_sort and type(sortkey) is not int:
            sortkey = [ord(i) for i in sortkey].join()
        record.sort = sortkey

        # If the record is valid, include it in the output
        if valid_entry(record, REQ_FIELDS):
            items[ident] = record
        else:
            invalid_entry = record

    # Notify about invalid records in the log
    if invalid_entry is not None:
        print(REQ_FIELDS)
        print(invalid_entry)
        print("(-- Check your data! --)")

    print("... Loaded %d items" % len(items))
    return items


def valid_entry(entry, required_fields):
    """ Validate the row """
    reqlist = required_fields
    if len(reqlist) == 0 or reqlist[0] == '':
        return True
    for value in reqlist:
        if value != "None":
            if value not in entry or not entry[value]:
                return False
    return True


def get_sorted(g_items, g_reverse):
    g_sortd = sorted(
        g_items, key=lambda item: g_items[item].sort
    )
    if g_reverse:
        g_sortd.reverse()
    return g_sortd


def item_repr(item, key, host_url):
    return {
        'id': key,
        'url': host_url.rstrip('/') + url_for('item_detail', key=key),
        'data': item
    }
