#! /usr/bin/env python3

from flask import url_for, current_app


def fetch_data(at):
    """ Collect remote data """
    SORT_KEY = current_app.config.get('SORT_KEY')
    TABLE_NAME = current_app.config.get('TABLE_NAME')
    REQ_FIELDS = current_app.config.get('REQUIRED_FIELDS')
    items = {}
    print("Fetching remote data")
    invalid_entry = None
    for r in at.iterate(TABLE_NAME):
        record = r['fields']
        if not SORT_KEY:
            sort_value = r['id']
        else:
            sort_value = record[SORT_KEY]
        if valid_entry(record, REQ_FIELDS):
            items[sort_value] = record
        else:
            invalid_entry = record
    if invalid_entry is not None:
        print(REQ_FIELDS)
        print(invalid_entry)
        print("(-- Check your data! --)")
    return items


def valid_entry(entry, REQUIRED_FIELDS):
    """ Validate the row """
    if len(REQUIRED_FIELDS) == 0 or REQUIRED_FIELDS[0] == '':
        return True
    for value in REQUIRED_FIELDS:
        if value not in entry or not entry[value]:
            return False
    return True


def item_repr(item, key, host_url):
    return {
        'id': key,
        'url': host_url.rstrip('/') + url_for('item_detail', key=key),
        'data': item
    }
